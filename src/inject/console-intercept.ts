// 拦截 console 方法和 JS 错误
(function () {
  if ((window as any).__replayConsoleInstalled) return;
  (window as any).__replayConsoleInstalled = true;

  const replayDebugNonce = document.currentScript instanceof HTMLScriptElement
    ? document.currentScript.dataset.replayDebugNonce || ''
    : '';
  const levels = ['log', 'warn', 'error', 'info'] as const;
  const MAX_CONSOLE_VALUE_LENGTH = 10_000;
  const SENSITIVE_KEY_RE = /authorization|cookie|set-cookie|token|secret|password|passwd|pwd|api[-_]?key|session|jwt|credential|csrf/i;
  const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const BEARER_RE = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;

  function postReplayMessage(payload: Record<string, unknown>) {
    window.postMessage({
      ...payload,
      __replayDebugNonce: replayDebugNonce,
    }, '*');
  }

  function truncate(value: string): string {
    if (value.length <= MAX_CONSOLE_VALUE_LENGTH) return value;
    return value.slice(0, MAX_CONSOLE_VALUE_LENGTH) + '\n...[truncated]';
  }

  function redactText(text: string): string {
    return truncate(text
      .replace(BEARER_RE, 'Bearer [redacted]')
      .replace(EMAIL_RE, '[redacted-email]')
      .replace(/(["']?)(authorization|token|secret|password|passwd|pwd|api[-_]?key|session|jwt|credential|csrf)(\1)\s*[:=]\s*(["'])?[^"',&}\s]+(\4)?/gi, '$1$2$3:[redacted]'));
  }

  function safeSerialize(value: unknown): string {
    if (value instanceof Error) return redactText(value.stack || value.message);
    if (typeof value === 'string') return redactText(value);
    try {
      const seen = new WeakSet<object>();
      return truncate(JSON.stringify(value, (key, v) => {
        if (SENSITIVE_KEY_RE.test(key)) return '[redacted]';
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        if (typeof v === 'string') return redactText(v);
        return v;
      }) || '');
    } catch {
      return redactText(String(value));
    }
  }

  levels.forEach((level) => {
    const original = console[level];
    console[level] = function (...args: unknown[]) {
      postReplayMessage({
        type: '__record_console',
        level,
        args: args.map(safeSerialize),
        stack: level === 'error' || level === 'warn'
          ? redactText(new Error().stack?.split('\n').slice(2).join('\n') || '')
          : undefined,
        url: location.href,
        timestamp: Date.now(),
      });
      return original.apply(console, args);
    };
  });

  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as Element;
      const sourceUrl =
        target.getAttribute('src') ||
        target.getAttribute('href') ||
        target.getAttribute('poster') ||
        '';
      postReplayMessage({
        type: '__record_error',
        errorType: 'resourceError',
        message: `${target.tagName.toLowerCase()} resource failed to load`,
        filename: location.href,
        tagName: target.tagName.toLowerCase(),
        sourceUrl,
        timestamp: Date.now(),
      });
      return;
    }

    postReplayMessage({
      type: '__record_error',
      errorType: 'jsError',
      message: redactText(event.message),
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack ? redactText(event.error.stack) : undefined,
      timestamp: Date.now(),
    });
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    postReplayMessage({
      type: '__record_error',
      errorType: 'promiseError',
      message: redactText(String(event.reason)),
      stack: event.reason?.stack ? redactText(event.reason.stack) : undefined,
      timestamp: Date.now(),
    });
  });
})();
