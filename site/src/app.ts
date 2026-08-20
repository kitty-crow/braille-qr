import { Braille } from "../../src/core/braille.js";
import type { Code } from "../../src/core/code.js";
import { Dots } from "../../src/core/dots.js";
import { Qr } from "../../src/core/qr.js";
import type { Draw, Ec } from "../../src/types.js";
import { gridFrag, metricsFrag } from "./ui/fragments.tsx";

type Theme = "light" | "dark";

interface Els {
  readonly form: HTMLFormElement;
  readonly mini: HTMLElement;
  readonly text: HTMLTextAreaElement;
  readonly scale: HTMLSelectElement;
  readonly ec: HTMLSelectElement;
  readonly draw: HTMLSelectElement;
  readonly dark: HTMLInputElement;
  readonly preview: HTMLElement;
  readonly empty: HTMLElement;
  readonly status: HTMLElement;
  readonly metrics: HTMLElement;
  readonly token: HTMLButtonElement;
  readonly copy: HTMLButtonElement;
  readonly txt: HTMLButtonElement;
  readonly html: HTMLButtonElement;
  readonly embed: HTMLButtonElement;
}

interface Last {
  readonly text: string;
  readonly code: Code;
  readonly dark: boolean;
  readonly qr: number;
}

class Web {
  private readonly qr = new Qr();
  private readonly dots = new Dots();
  private readonly brl = new Braille();
  private readonly els: Els;
  private last: Last | null = null;
  private timer: number | undefined;

  constructor() {
    this.els = {
      form: this.el<HTMLFormElement>("[data-gen-form]"),
      mini: this.el<HTMLElement>("[data-mini]"),
      text: this.el<HTMLTextAreaElement>("[data-text]"),
      scale: this.el<HTMLSelectElement>("[data-scale]"),
      ec: this.el<HTMLSelectElement>("[data-ec]"),
      draw: this.el<HTMLSelectElement>("[data-draw]"),
      dark: this.el<HTMLInputElement>("[data-output-dark]"),
      preview: this.el<HTMLElement>("[data-preview]"),
      empty: this.el<HTMLElement>("[data-empty]"),
      status: this.el<HTMLElement>("[data-status]"),
      metrics: this.el<HTMLElement>("[data-metrics]"),
      token: this.el<HTMLButtonElement>("[data-token]"),
      copy: this.el<HTMLButtonElement>("[data-copy]"),
      txt: this.el<HTMLButtonElement>("[data-download-text]"),
      html: this.el<HTMLButtonElement>("[data-download-html]"),
      embed: this.el<HTMLButtonElement>("[data-copy-embed]"),
    };
  }

  run(): void {
    this.syncDark(this.theme());
    this.mini();

    this.els.form.addEventListener("submit", (event) => event.preventDefault());
    this.els.form.addEventListener("input", () => this.queue());
    this.els.form.addEventListener("change", () => this.queue(0));
    this.els.form.addEventListener("reset", () => {
      window.setTimeout(() => {
        this.syncDark(this.theme());
        this.make();
        this.els.text.focus();
      });
    });

    this.els.token.addEventListener("click", () => {
      this.els.text.value = this.token();
      this.make();
    });

    this.els.copy.addEventListener("click", () => void this.copy());
    this.els.txt.addEventListener("click", () => this.saveText());
    this.els.html.addEventListener("click", () => this.saveHtml());

    window.addEventListener("braille-qr:theme", (event) => {
      this.syncDark((event as CustomEvent<Theme>).detail);
      this.make();
    });
    window.addEventListener("resize", () => this.redraw());
    document.fonts?.ready.then(() => this.redraw());

    this.els.text.value = "https://kittycrow.dev";
    this.make();
  }

  private queue(delay = 90): void {
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      this.make();
    }, delay);
  }

  private make(): void {
    const text = this.els.text.value.trim();
    if (!text) {
      this.clear();
      return;
    }

    try {
      const scale = Number(this.els.scale.value);
      const ec = this.ec(this.els.ec.value);
      const draw = this.draw(this.els.draw.value);
      const dark = this.els.dark.checked;
      const mat = this.qr.make(text, ec, 4);
      const code = this.brl.make(this.dots.make(mat, scale, draw, 1));

      this.last = { text, code, dark, qr: mat.w };
      this.render(code, dark);
      this.els.metrics.replaceChildren(metricsFrag([
        `${text.length} chars`,
        `${mat.w} × ${mat.h} modules`,
        `${code.cols} × ${code.rows} Unicode cells`,
      ]));
      this.msg("Live preview updated.");
      this.enable(true);
    } catch (err: unknown) {
      this.last = null;
      this.msg(err instanceof Error ? err.message : String(err));
      this.enable(false);
    }
  }

  private clear(): void {
    this.last = null;
    this.els.preview.replaceChildren();
    this.els.preview.hidden = true;
    this.els.empty.hidden = false;
    this.els.metrics.replaceChildren();
    this.enable(false);
    this.msg("Enter text or create a token to begin.");
  }

  private enable(on: boolean): void {
    [this.els.copy, this.els.txt, this.els.html, this.els.embed].forEach((btn) => {
      btn.disabled = !on;
    });
  }

  private render(code: Code, dark: boolean): void {
    this.grid(this.els.preview, code, "qr-row", "qr-cell", "--cols", "--cell");
    this.els.preview.classList.toggle("is-dark", dark);
    this.els.empty.hidden = true;
    this.els.preview.hidden = false;
  }

  private mini(): void {
    const mat = this.qr.make("https://github.com/kitty-crow/unicode-qr-studio", "H", 4);
    const code = this.brl.make(this.dots.make(mat, 2, "fill", 1));
    this.grid(this.els.mini, code, "mini-row", "mini-cell", "--mini-cols", "--mini-cell");
  }

  private grid(
    host: HTMLElement,
    code: Code,
    rowName: string,
    cellName: string,
    colsVar: string,
    cellVar: string,
  ): void {
    const frag = gridFrag(
      code,
      host === this.els.mini ? "mini-grid" : "qr-grid",
      rowName,
      cellName,
    );
    const grid = frag.firstElementChild;
    if (!(grid instanceof HTMLElement)) throw new Error("QR grid fragment is missing its root element.");

    grid.style.setProperty(colsVar, String(code.cols));
    grid.style.setProperty(cellVar, `${this.cell(host)}px`);
    host.replaceChildren(frag);
  }

  private redraw(): void {
    this.mini();
    if (this.last) this.render(this.last.code, this.last.dark);
  }

  private syncDark(theme: Theme): void {
    this.els.dark.checked = theme === "dark";
  }

  private theme(): Theme {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  private token(bytes = 64): string {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return [...buf]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  private cell(host: HTMLElement): number {
    const probe = document.createElement("span");
    const style = getComputedStyle(host);
    probe.textContent = "⣿".repeat(200);
    probe.className = "qr-probe";
    probe.style.fontFamily = style.fontFamily;
    probe.style.fontSize = style.fontSize;
    probe.style.fontWeight = style.fontWeight;
    probe.style.letterSpacing = style.letterSpacing;
    document.body.append(probe);
    const width = probe.getBoundingClientRect().width / 200;
    probe.remove();
    return width;
  }

  private async copy(): Promise<void> {
    if (!this.last) return;

    try {
      await navigator.clipboard.writeText(this.last.code.text());
      this.msg("Unicode QR copied.");
    } catch {
      this.msg("Clipboard access was blocked.");
    }
  }

  private saveText(): void {
    if (!this.last) return;
    this.save("unicode-qr-studio.txt", `${this.last.code.text()}\n`, "text/plain;charset=utf-8");
  }

  private saveHtml(): void {
    if (!this.last) return;
    this.save(
      "unicode-qr-studio.html",
      this.page(this.last.code, this.last.dark),
      "text/html;charset=utf-8",
    );
  }

  private page(code: Code, dark: boolean): string {
    const fg = dark ? "#fff" : "#000";
    const bg = dark ? "#000" : "#fff";
    const rows = code.chars().map((line) => (
      `<div class="r">${line.map((char) => `<span>${char}</span>`).join("")}</div>`
    )).join("");

    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Unicode QR Studio</title><style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:${bg}}body{display:grid;place-items:center;padding:24px}.q{--c:2px;color:${fg};font-family:"Apple Braille","Noto Sans Symbols 2","DejaVu Sans Mono",monospace;font-size:2.5px}.r{display:grid;grid-template-columns:repeat(${code.cols},var(--c));width:calc(${code.cols}*var(--c));height:calc(var(--c)*2)}span{display:block;width:var(--c);height:calc(var(--c)*2);line-height:calc(var(--c)*2);white-space:pre;overflow:visible}</style></head><body><main class="q">${rows}</main><script>const q=document.querySelector('.q'),p=document.createElement('span');p.textContent='⣿'.repeat(200);p.style.cssText='position:absolute;visibility:hidden;white-space:pre;font:inherit';document.body.append(p);q.style.setProperty('--c',(p.getBoundingClientRect().width/200)+'px');p.remove();</script></body></html>`;
  }

  private save(name: string, data: string, type: string): void {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  private ec(raw: string): Ec {
    if (raw === "L" || raw === "M" || raw === "Q" || raw === "H") return raw;
    throw new Error("Invalid error correction level.");
  }

  private draw(raw: string): Draw {
    if (raw === "fill" || raw === "edge") return raw;
    throw new Error("Invalid module style.");
  }

  private msg(text: string): void {
    this.els.status.textContent = text;
  }

  private el<T extends Element>(query: string): T {
    const el = document.querySelector<T>(query);
    if (!el) throw new Error(`Missing page element: ${query}`);
    return el;
  }
}

new Web().run();
