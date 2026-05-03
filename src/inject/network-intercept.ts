// 这个脚本会被注入到页面的主世界（main world）中
// 用于拦截 fetch 和 XMLHttpRequest，默认只采集元信息和大小，不读取响应体

(function () {
  if ((window as any).__replayInterceptorInstalled) return;
  (window as any).__replayInterceptorInstalled = true;

  const replayDebugNonce = document.currentScript instanceof HTMLScriptElement
    ? document.currentScript.dataset.replayDebugNonce || ''
    : '';
  const CAPTURE_HTTP_BODIES = false;
  const MAX_BODY_LENGTH = 100_000;
  const SENSITIVE_KEY_RE = /authorization|cookie|set-cookie|token|secret|password|passwd|pwd|api[-_]?key|session|jwt|credential|csrf/i;
  const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const BEARER_RE = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;

  function postReplayMessage(payload: Record<string, unknown>) {
    window.postMessage({
      ...payload,
      __replayDebugNonce: replayDebugNonce,
    }, '*');
  }

  function redactText(text: string): string {
    return text
      .replace(BEARER_RE, 'Bearer [redacted]')
      .replace(EMAIL_RE, '[redacted-email]')
      .replace(/(["']?)(authorization|token|secret|password|passwd|pwd|api[-_]?key|session|jwt|credential|csrf)(\1)\s*[:=]\s*(["'])?[^"',&}\s]+(\4)?/gi, '$1$2$3:[redacted]');
  }

  function redactValue(key: string, value: unknown): string {
    if (SENSITIVE_KEY_RE.test(key)) return '[redacted]';
    return redactText(String(value));
  }

  function headersToObject(headers?: HeadersInit | null): Record<string, string> {
    const out: Record<string, string> = {};
    if (!headers) return out;

    try {
      if (headers instanceof Headers) {
        headers.forEach((value, key) => { out[key] = redactValue(key, value); });
      } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => { out[key] = redactValue(key, value); });
      } else {
        Object.entries(headers).forEach(([key, value]) => { out[key] = redactValue(key, value); });
      }
    } catch {
      // 忽略无法序列化的 headers
    }

    return out;
  }

  function truncateBody(body?: string): { body?: string; size?: number; truncated?: boolean } {
    if (body === undefined) return {};
    const size = body.length;
    if (size <= MAX_BODY_LENGTH) return { body, size, truncated: false };
    return {
      body: body.slice(0, MAX_BODY_LENGTH) + '\n...[truncated]',
      size,
      truncated: true,
    };
  }

  function estimateBodySize(body: BodyInit | null | undefined): number | undefined {
    if (!body) return undefined;
    if (typeof body === 'string') return body.length;
    if (body instanceof URLSearchParams) return body.toString().length;
    if (body instanceof Blob) return body.size;
    if (body instanceof ArrayBuffer) return body.byteLength;
    if (ArrayBuffer.isView(body)) return body.byteLength;
    if (body instanceof FormData) {
      let size = 0;
      body.forEach((value, key) => {
        size += key.length;
        size += value instanceof File ? value.size : String(value).length;
      });
      return size;
    }
    return undefined;
  }

  function serializeBody(body: BodyInit | null | undefined): string | undefined {
    if (!body) return undefined;
    if (typeof body === 'string') return body;
    if (body instanceof URLSearchParams) return body.toString();
    if (body instanceof FormData) {
      const entries: Record<string, string> = {};
      body.forEach((value, key) => {
        entries[key] = value instanceof File ? `[File: ${value.name}, ${value.size} bytes]` : String(value);
      });
      return JSON.stringify(entries);
    }
    if (body instanceof Blob) return `[Blob: ${body.type || 'unknown'}, ${body.size} bytes]`;
    if (body instanceof ArrayBuffer) return `[ArrayBuffer: ${body.byteLength} bytes]`;
    return String(body);
  }

  function bodyMeta(body: BodyInit | null | undefined): { body?: string; size?: number; truncated?: boolean } {
    const size = estimateBodySize(body);
    if (!CAPTURE_HTTP_BODIES) {
      return size === undefined ? {} : { size, truncated: false };
    }

    const serialized = serializeBody(body);
    if (serialized === undefined) return size === undefined ? {} : { size, truncated: false };
    const meta = truncateBody(redactText(serialized));
    return {
      ...meta,
      size: size ?? meta.size,
    };
  }

  function responseSizeFromHeaders(headers: Headers): number | undefined {
    const value = headers.get('content-length');
    if (!value) return undefined;
    const size = Number(value);
    return Number.isFinite(size) ? size : undefined;
  }

  // 拦截 fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const startTime = Date.now();
    const input = args[0];
    const init = args[1];
    const request = input instanceof Request ? input : null;
    const url = typeof input === 'string' ? input : request?.url || String(input);
    const method = init?.method || request?.method || 'GET';
    const requestBodyMeta = bodyMeta(init?.body);
    const requestHeaders = {
      ...headersToObject(request?.headers),
      ...headersToObject(init?.headers),
    };

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;
      const responseHeaders = headersToObject(response.headers);
      const responseBodyMeta: ReturnType<typeof truncateBody> = {
        size: responseSizeFromHeaders(response.headers),
        truncated: false,
      };

      postReplayMessage({
        type: '__record_fetch',
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        body: responseBodyMeta.body,
        requestBody: requestBodyMeta.body,
        requestHeaders,
        responseHeaders,
        contentType: response.headers.get('content-type') || undefined,
        requestSize: requestBodyMeta.size,
        responseSize: responseBodyMeta.size,
        truncated: requestBodyMeta.truncated || responseBodyMeta.truncated,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      postReplayMessage({
        type: '__record_fetch',
        url,
        method,
        status: 0,
        error: String(error),
        requestBody: requestBodyMeta.body,
        requestHeaders,
        requestSize: requestBodyMeta.size,
        truncated: requestBodyMeta.truncated,
        duration,
      });
      throw error;
    }
  };

  // 拦截 XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
    (this as any).__recordMeta = { method, url: String(url), requestHeaders: {} as Record<string, string> };
    return originalOpen.apply(this, [method, url, ...rest] as any);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
    if ((this as any).__recordMeta) {
      (this as any).__recordMeta.requestHeaders[name] = redactValue(name, value);
    }
    return originalSetRequestHeader.apply(this, [name, value]);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const meta = (this as any).__recordMeta;
    const startTime = Date.now();

    if (meta) {
      const requestBodyMeta = bodyMeta(body as BodyInit | null | undefined);

      this.addEventListener('load', function () {
        const duration = Date.now() - startTime;
        const responseBodyMeta: ReturnType<typeof truncateBody> = {};

        const responseHeaders: Record<string, string> = {};
        let responseSize: number | undefined;
        try {
          this.getAllResponseHeaders()
            .trim()
            .split(/[\r\n]+/)
            .filter(Boolean)
            .forEach((line) => {
              const index = line.indexOf(':');
              if (index > -1) {
                const key = line.slice(0, index).trim();
                const rawValue = line.slice(index + 1).trim();
                if (key.toLowerCase() === 'content-length') {
                  const parsedSize = Number(rawValue);
                  if (Number.isFinite(parsedSize)) responseSize = parsedSize;
                }
                responseHeaders[key] = redactValue(key, rawValue);
              }
            });
        } catch {
          // 忽略
        }

        responseBodyMeta.size = responseSize;

        postReplayMessage({
          type: '__record_xhr',
          url: meta.url,
          method: meta.method,
          status: this.status,
          statusText: this.statusText,
          body: responseBodyMeta.body,
          requestBody: requestBodyMeta.body,
          requestHeaders: meta.requestHeaders,
          responseHeaders,
          contentType: this.getResponseHeader('content-type') || undefined,
          requestSize: requestBodyMeta.size,
          responseSize: responseBodyMeta.size,
          truncated: requestBodyMeta.truncated || responseBodyMeta.truncated,
          duration,
        });
      });

      this.addEventListener('error', function () {
        const duration = Date.now() - startTime;
        postReplayMessage({
          type: '__record_xhr',
          url: meta.url,
          method: meta.method,
          status: 0,
          error: 'Network Error',
          requestBody: requestBodyMeta.body,
          requestHeaders: meta.requestHeaders,
          requestSize: requestBodyMeta.size,
          truncated: requestBodyMeta.truncated,
          duration,
        });
      });
    }

    return originalSend.apply(this, [body]);
  };
})();
