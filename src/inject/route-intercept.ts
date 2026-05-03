// 这个脚本会被注入到页面的主世界（main world）中
// 用于捕获 SPA 路由变化（pushState / replaceState / popstate / hashchange）

(function () {
  if ((window as any).__replayRouteInstalled) return;
  (window as any).__replayRouteInstalled = true;

  const replayDebugNonce = document.currentScript instanceof HTMLScriptElement
    ? document.currentScript.dataset.replayDebugNonce || ''
    : '';

  let lastUrl = location.href;

  function emitRouteChange(source: string) {
    const url = location.href;
    if (url === lastUrl) return;
    lastUrl = url;

    window.postMessage({
      type: '__record_route',
      source,
      url,
      title: document.title,
      timestamp: Date.now(),
      __replayDebugNonce: replayDebugNonce,
    }, '*');
  }

  function emitSoon(source: string) {
    window.setTimeout(() => emitRouteChange(source), 0);
  }

  const originalPushState = history.pushState;
  history.pushState = function (...args: Parameters<History['pushState']>) {
    const result = originalPushState.apply(this, args);
    emitSoon('pushState');
    return result;
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args: Parameters<History['replaceState']>) {
    const result = originalReplaceState.apply(this, args);
    emitSoon('replaceState');
    return result;
  };

  window.addEventListener('popstate', () => emitSoon('popstate'));
  window.addEventListener('hashchange', () => emitSoon('hashchange'));
})();
