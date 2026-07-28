import { Braille } from "../../src/core/braille.js";
import type { Code } from "../../src/core/code.js";
import { Dots } from "../../src/core/dots.js";
import { Qr } from "../../src/core/qr.js";
import type { EmbedTheme } from "../../src/embed/types.js";
import type { Draw, Ec } from "../../src/types.js";

interface Opts {
  readonly text: string;
  readonly scale: number;
  readonly ec: Ec;
  readonly draw: Draw;
  readonly edge: number;
  readonly theme: EmbedTheme;
}

interface Api {
  readonly mount: (host: Element | null, opts?: Partial<Opts>) => void;
}

declare global {
  interface Window {
    BrailleQr?: Api;
    __brailleQrLoad?: Promise<Api>;
  }
}

class View {
  private readonly qr = new Qr();
  private readonly dots = new Dots();
  private readonly brl = new Braille();
  private readonly root: ShadowRoot;
  private readonly media = window.matchMedia("(prefers-color-scheme: dark)");
  private readonly attrs = new MutationObserver(() => this.render());
  private readonly size = new ResizeObserver(() => this.fit());
  private code: Code | null = null;
  private frame: HTMLElement | null = null;
  private grid: HTMLElement | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly opts: Partial<Opts>,
  ) {
    this.root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  }

  run(): void {
    this.attrs.observe(this.host, { attributes: true });
    this.size.observe(this.host);
    this.media.addEventListener("change", this.onTheme);
    this.render();
  }

  private readonly onTheme = (): void => {
    if (this.cfg().theme === "auto") this.render();
  };

  private render(): void {
    try {
      const cfg = this.cfg();
      const mat = this.qr.make(cfg.text, cfg.ec, 4);
      const code = this.brl.make(this.dots.make(mat, cfg.scale, cfg.draw, cfg.edge));
      const dark = this.dark(cfg.theme);
      const tpl = this.host.querySelector<HTMLTemplateElement>("template[data-braille-qr-template]");

      if (!tpl) throw new Error("Braille QR embed template is missing.");

      this.root.replaceChildren(tpl.content.cloneNode(true));
      const frame = this.need<HTMLElement>(".frame");
      const grid = this.need<HTMLElement>("[data-braille-qr-root]");

      frame.style.setProperty("--bg", dark ? "#000" : "#fff");
      frame.style.setProperty("--fg", dark ? "#fff" : "#000");
      grid.style.setProperty("--cols", String(code.cols));

      code.chars().forEach((line) => {
        const row = document.createElement("div");
        row.className = "row";

        line.forEach((char) => {
          const cell = document.createElement("span");
          cell.className = "cell";
          cell.textContent = char;
          row.append(cell);
        });

        grid.append(row);
      });

      this.code = code;
      this.frame = frame;
      this.grid = grid;
      requestAnimationFrame(() => this.fit());
      document.fonts?.ready.then(() => this.fit());
    } catch (err: unknown) {
      this.fail(err);
    }
  }

  private fail(err: unknown): void {
    const tpl = this.host.querySelector<HTMLTemplateElement>("template[data-braille-qr-template]");
    this.root.replaceChildren(tpl?.content.cloneNode(true) ?? document.createDocumentFragment());

    const frame = this.root.querySelector<HTMLElement>(".frame") ?? document.createElement("div");
    const msg = document.createElement("div");
    const dark = this.dark(this.cfgSafeTheme());

    frame.className = "frame";
    frame.style.setProperty("--bg", dark ? "#000" : "#fff");
    frame.style.setProperty("--fg", dark ? "#fff" : "#000");
    frame.replaceChildren(msg);
    msg.className = "err";
    msg.textContent = err instanceof Error ? err.message : String(err);

    if (!frame.parentNode) this.root.append(frame);
    this.code = null;
    this.frame = frame;
    this.grid = null;
  }

  private fit(): void {
    if (!this.code || !this.frame || !this.grid) return;

    this.grid.style.fontSize = "10px";
    const probe = document.createElement("span");
    probe.className = "probe";
    probe.textContent = "⣿".repeat(200);
    this.grid.append(probe);
    const advance = probe.getBoundingClientRect().width / 200;
    probe.remove();

    const w = this.frame.clientWidth || this.host.clientWidth;
    const h = this.frame.clientHeight || this.host.clientHeight || w;
    const target = Math.max(0.5, Math.min(w / this.code.cols, h / (this.code.rows * 2)));
    const font = advance > 0 ? 10 * target / advance : 2.5;

    this.grid.style.fontSize = `${font}px`;
    this.grid.style.setProperty("--cell", `${target}px`);
  }

  private cfg(): Opts {
    const query = this.host.dataset.query === "true";
    const val = (name: string): string | undefined => {
      if (!query) return undefined;
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const search = new URLSearchParams(window.location.search);
      return hash.get(name) ?? search.get(name) ?? undefined;
    };
    const text = this.opts.text ?? val("text") ?? this.host.dataset.text ?? "";

    if (!text) throw new Error("Braille QR embed requires data-text.");

    return {
      text,
      scale: this.int(this.opts.scale ?? val("scale") ?? this.host.dataset.scale ?? "8", "scale", 1),
      ec: this.ec(this.opts.ec ?? val("ec") ?? this.host.dataset.ec ?? "H"),
      draw: this.draw(this.opts.draw ?? val("draw") ?? this.host.dataset.draw ?? "fill"),
      edge: this.int(this.opts.edge ?? val("edge") ?? this.host.dataset.edge ?? "1", "edge", 1),
      theme: this.theme(this.opts.theme ?? val("theme") ?? this.host.dataset.theme ?? "auto"),
    };
  }

  private cfgSafeTheme(): EmbedTheme {
    try {
      return this.cfg().theme;
    } catch {
      return "auto";
    }
  }

  private dark(theme: EmbedTheme): boolean {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    const page = document.documentElement.dataset.theme;
    return page === "dark" || (page !== "light" && this.media.matches);
  }

  private int(raw: number | string, name: string, min: number): number {
    const val = Number(raw);
    if (!Number.isInteger(val) || val < min) throw new Error(`Invalid ${name}.`);
    return val;
  }

  private ec(raw: Ec | string): Ec {
    const val = raw.toUpperCase();
    if (val === "L" || val === "M" || val === "Q" || val === "H") return val;
    throw new Error("Invalid error correction level.");
  }

  private draw(raw: Draw | string): Draw {
    if (raw === "fill" || raw === "edge") return raw;
    throw new Error("Invalid module style.");
  }

  private theme(raw: EmbedTheme | string): EmbedTheme {
    if (raw === "auto" || raw === "light" || raw === "dark") return raw;
    throw new Error("Invalid embed theme.");
  }

  private need<T extends Element>(query: string): T {
    const el = this.root.querySelector<T>(query);
    if (!el) throw new Error(`Missing embed element: ${query}`);
    return el;
  }
}

export function mount(host: Element | null, opts: Partial<Opts> = {}): void {
  if (!(host instanceof HTMLElement)) throw new Error("Braille QR host must be an HTMLElement.");
  new View(host, opts).run();
}

window.BrailleQr = { mount };
