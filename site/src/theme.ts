type Theme = "light" | "dark";

type Kofi = Readonly<{
  draw: (name: string, cfg: Readonly<Record<string, string>>) => void;
}>;

declare global {
  interface Window {
    kofiWidgetOverlay?: Kofi;
  }
}

const key = "braille-qr.theme";
const kofiSrc = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
const media = window.matchMedia("(prefers-color-scheme: dark)");
const themeColours: Record<Theme, string> = {
  light: "#087f9c",
  dark: "#071418",
};

const kofiCss = `
.floatingchat-container-wrap,
.floatingchat-container-wrap-mobi {
  position: fixed !important;
  top: var(--kofi-top, 86px) !important;
  right: 16px !important;
  bottom: auto !important;
  left: auto !important;
  width: min(230px, calc(100vw - 32px)) !important;
  max-width: calc(100vw - 32px) !important;
  overflow: visible !important;
  transform: none !important;
  z-index: var(--kofi-z, 49) !important;
}

.floatingchat-container-wrap > iframe,
.floatingchat-container-wrap-mobi > iframe {
  position: static !important;
  inset: auto !important;
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  transform: none !important;
}

.floating-chat-kofi-popup-iframe,
.floating-chat-kofi-popup-iframe-mobi,
.floating-chat-kofi-popup-iframe-closer,
.floating-chat-kofi-popup-iframe-closer-mobi {
  z-index: var(--kofi-z, 49) !important;
}
`;

let kofiFrame = 0;

function saved(): Theme | null {
  try {
    const val = localStorage.getItem(key);
    return val === "light" || val === "dark" ? val : null;
  } catch {
    return null;
  }
}

function active(): Theme {
  return saved() ?? (media.matches ? "dark" : "light");
}

function controls(theme: Theme): void {
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((btn) => {
    const dark = theme === "dark";
    btn.dataset.themeState = theme;
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", `Use ${dark ? "light" : "dark"} theme`);
    const label = btn.querySelector<HTMLElement>("[data-theme-label]");
    if (label) {
      label.textContent = dark ? "🌙" : "☀️";
      label.title = dark ? "Dark theme" : "Light theme";
    }
  });
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = themeColours[theme];
  controls(theme);
  window.dispatchEvent(new CustomEvent<Theme>("braille-qr:theme", { detail: theme }));
}

function toggle(): void {
  const next: Theme = active() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(key, next);
  } catch {
    console.warn("Theme preference could not be saved");
  }
  apply(next);
}

function hasKofi(): boolean {
  return document.querySelector(".floatingchat-container-wrap, .floatingchat-container-wrap-mobi") !== null;
}

function placeKofi(): void {
  const head = document.querySelector<HTMLElement>(".header");
  if (head === null) return;

  const top = Math.max(12, Math.ceil(head.getBoundingClientRect().bottom + 12));
  const parsed = Number.parseInt(getComputedStyle(head).zIndex, 10);
  const z = Number.isFinite(parsed) ? Math.max(0, parsed - 1) : 49;

  document.documentElement.style.setProperty("--kofi-top", `${top}px`);
  document.documentElement.style.setProperty("--kofi-z", String(z));
}

function queueKofi(): void {
  cancelAnimationFrame(kofiFrame);
  kofiFrame = requestAnimationFrame(placeKofi);
}

function addKofiCss(): void {
  if (document.getElementById("kofi-site-style") !== null) return;

  const style = document.createElement("style");
  style.id = "kofi-site-style";
  style.textContent = kofiCss;
  document.head.appendChild(style);
}

function drawKofi(): void {
  if (hasKofi()) {
    queueKofi();
    return;
  }

  window.kofiWidgetOverlay?.draw("kittycrow", {
    "type": "floating-chat",
    "floating-chat.donateButton.text": "Buy me a coffee?",
    "floating-chat.donateButton.background-color": "#5bc0de",
    "floating-chat.donateButton.text-color": "#323842"
  });
  queueKofi();
}

function initKofi(): void {
  const head = document.querySelector<HTMLElement>(".header");
  if (head === null) return;

  addKofiCss();
  queueKofi();
  window.addEventListener("resize", queueKofi);
  window.addEventListener("scroll", queueKofi, { passive: true });
  new ResizeObserver(queueKofi).observe(head);

  const obs = new MutationObserver(() => {
    if (!hasKofi()) return;
    queueKofi();
    obs.disconnect();
  });
  obs.observe(document.body, { childList: true, subtree: true });

  if (hasKofi()) return;
  if (window.kofiWidgetOverlay) {
    drawKofi();
    return;
  }

  const old = document.querySelector<HTMLScriptElement>(`script[src="${kofiSrc}"]`);
  if (old !== null) {
    old.addEventListener("load", drawKofi, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = kofiSrc;
  script.addEventListener("load", drawKofi, { once: true });
  document.body.appendChild(script);
}

apply(active());

window.addEventListener("DOMContentLoaded", () => {
  controls(active());
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", toggle);
  });
  initKofi();
});

media.addEventListener("change", () => {
  if (!saved()) apply(active());
});

export {};
