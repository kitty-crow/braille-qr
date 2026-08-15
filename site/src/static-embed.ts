import { Braille } from "../../src/core/braille.js";
import { Dots } from "../../src/core/dots.js";
import { Qr } from "../../src/core/qr.js";
import type { Draw, Ec } from "../../src/types.js";

export interface StaticEmbedCfg {
  readonly text: string;
  readonly scale: number;
  readonly ec: Ec;
  readonly draw: Draw;
  readonly dark: boolean;
}

const esc = (value: string): string => value.replace(/[&<>"']/gu, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[char] ?? char);

/** Self-contained literal Braille QR: inline styles only, no script/link/fetch dependency. */
export const staticEmbedHtml = (cfg: StaticEmbedCfg): string => {
  const mat = new Qr().make(cfg.text, cfg.ec, 4);
  const code = new Braille().make(new Dots().make(mat, cfg.scale, cfg.draw, 1));
  const cols = Math.max(1, code.cols);
  const rowsCount = Math.max(1, code.rows);
  // Compact uses a 24rem square host and fits against both width/cols and height/(rows*2).
  const fitCells = Math.max(cols, rowsCount * 2);
  const fallbackCell = 384 / fitCells;
  const cellH = `${(200 / fitCells).toFixed(8)}cqw`;
  const fontSize = `${(160 / fitCells).toFixed(8)}cqw`;
  const fallbackH = `${(fallbackCell * 2).toFixed(4)}px`;
  const fallbackFont = `${(fallbackCell * 1.6).toFixed(4)}px`;
  const gridWidth = `${(cols * 100 / fitCells).toFixed(8)}cqw`;
  const fg = cfg.dark ? "#fff" : "#000";
  const bg = cfg.dark ? "#000" : "#fff";
  const fonts = `"Apple Braille","Noto Sans Symbols 2","DejaVu Sans Mono","Segoe UI Symbol",monospace`;
  const rows = code.chars().map(line => {
    const cells = line.map(char => `<span style="display:grid;place-items:center;min-width:0;height:${fallbackH};height:${cellH};line-height:${fallbackH};line-height:${cellH};font-size:${fallbackFont};font-size:${fontSize};white-space:pre;overflow:visible">${esc(char)}</span>`).join("");
    return `<div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));width:100%;height:${fallbackH};height:${cellH};overflow:visible">${cells}</div>`;
  }).join("");

  return `<div role="img" aria-label="Braille QR code" style="display:grid;place-items:center;width:min(100%,24rem);aspect-ratio:1;container-type:inline-size;overflow:hidden;background:${bg};color:${fg};font-family:${fonts};font-weight:400;font-synthesis:none;font-variant-ligatures:none;letter-spacing:0;text-rendering:geometricPrecision"><div style="width:${(cols * fallbackCell).toFixed(4)}px;width:${gridWidth};overflow:visible">${rows}</div></div>`;
};
