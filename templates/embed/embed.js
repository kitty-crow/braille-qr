(() => {
  const script = document.currentScript;
  const host = script?.parentElement;

  if (!(script instanceof HTMLScriptElement) || !(host instanceof HTMLElement)) return;

  const src = script.dataset.api;
  if (!src) {
    host.textContent = "Braille QR API URL is missing.";
    return;
  }

  const key = "__brailleQrLoad";
  const win = window;
  const ready = win.BrailleQr
    ? Promise.resolve(win.BrailleQr)
    : win[key] ??= new Promise((resolve, reject) => {
        const api = document.createElement("script");
        api.src = src;
        api.async = true;
        api.onload = () => win.BrailleQr
          ? resolve(win.BrailleQr)
          : reject(new Error("Braille QR API did not initialise."));
        api.onerror = () => reject(new Error(`Could not load Braille QR API: ${src}`));
        document.head.append(api);
      });

  ready.then((api) => api.mount(host)).catch((err) => {
    host.textContent = err instanceof Error ? err.message : String(err);
  });
})();
