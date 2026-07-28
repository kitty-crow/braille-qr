import { Code } from "../core/code.js";
import { Css } from "./css.js";
import { Grid } from "./grid.js";
import type { Cfg, Meta } from "../types.js";

export class Page {
  constructor(
    private readonly css = new Css(),
    private readonly grid = new Grid(),
  ) {}

  make(code: Code, cfg: Cfg, meta: Meta): string {
    const fg = cfg.dark ? "#fff" : "#000";
    const bg = cfg.dark ? "#000" : "#fff";
    const scheme = cfg.dark ? "dark" : "light";
    const shadow = this.css.shadow(cfg.thick);
    const body = this.grid.make(code, cfg.justify);

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Braille QR</title>
<style>
  :root {
    color-scheme: ${scheme};
    background: ${bg};
    --cell-w: 1px;
    --cell-h: 2px;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    min-height: 100%;
    background: ${bg};
  }

  body {
    display: grid;
    place-items: center;
    padding: 16px;
    overflow: auto;
  }

  .qr {
    margin: 0;
    padding: 0;
    color: ${fg};
    background: ${bg};
    font-family:
      "Apple Braille",
      "Noto Sans Symbols 2",
      "DejaVu Sans Mono",
      "Segoe UI Symbol",
      monospace;
    font-size: ${cfg.font}px;
    font-weight: 400;
    font-variant-ligatures: none;
    font-synthesis: none;
    text-rendering: geometricPrecision;
    text-shadow: ${shadow};
  }

  .plain {
    white-space: pre;
    line-height: var(--cell-h);
    letter-spacing: 0;
  }

  .fixed {
    display: grid;
    grid-template-rows: repeat(${code.rows}, var(--cell-h));
    width: calc(${code.cols} * var(--cell-w));
    height: calc(${code.rows} * var(--cell-h));
  }

  .row {
    display: grid;
    grid-template-columns: repeat(${code.cols}, var(--cell-w));
    width: calc(${code.cols} * var(--cell-w));
    height: var(--cell-h);
    white-space: nowrap;
    overflow: visible;
  }

  .cell {
    display: block;
    width: var(--cell-w);
    height: var(--cell-h);
    line-height: var(--cell-h);
    overflow: visible;
  }
</style>
</head>
<body>
  <main
    data-kind="${meta.kind}"
    data-characters="${meta.chars}"
    data-bytes="${meta.bytes}"
    data-qr-size="${meta.qr}"
    data-scale="${cfg.scale}"
    data-error-correction="${cfg.ec}"
    data-draw="${cfg.draw}"
    data-justified="${cfg.justify}"
  >
    ${body}
  </main>

<script>
(() => {
  const qr = document.querySelector(".qr");
  if (!(qr instanceof HTMLElement)) return;

  const calc = () => {
    const probe = document.createElement("span");
    const len = 200;
    const style = getComputedStyle(qr);

    probe.textContent = "⣿".repeat(len);
    probe.setAttribute("aria-hidden", "true");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.whiteSpace = "pre";
    probe.style.fontFamily = style.fontFamily;
    probe.style.fontSize = style.fontSize;
    probe.style.fontWeight = style.fontWeight;
    probe.style.letterSpacing = "0";
    probe.style.fontVariantLigatures = "none";

    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width / len;
    probe.remove();

    // Braille cells are two dots wide and four dots high.
    document.documentElement.style.setProperty("--cell-w", w + "px");
    document.documentElement.style.setProperty("--cell-h", (w * 2) + "px");
  };

  calc();
  document.fonts?.ready.then(calc);
  window.addEventListener("resize", calc);
})();
</script>
</body>
</html>
`;
  }
}
