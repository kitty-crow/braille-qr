import { HELP } from "./help.js";
import type { Cfg, Draw, Ec, Fmt } from "../types.js";

const DEF = {
  bytes: 64,
  scale: 8,
  ec: "H" as const,
  border: 4,
  font: 2.5,
  thick: 0.18,
  dark: false,
  draw: "fill" as const,
  edge: 1,
  fmt: "term" as const,
  justify: true,
  embedSrc: "https://kitty-crow.github.io/unicode-qr-studio/v1/embed.js",
};

export class Args {
  parse(argv: readonly string[]): Cfg {
    let text: string | undefined;
    let bytes = DEF.bytes;
    let scale = DEF.scale;
    let ec: Ec = DEF.ec;
    let border = DEF.border;
    let font = DEF.font;
    let thick = DEF.thick;
    let dark = DEF.dark;
    let draw: Draw = DEF.draw;
    let edge = DEF.edge;
    let fmt: Fmt = DEF.fmt;
    let justify = DEF.justify;
    let embedSrc = DEF.embedSrc;
    let out: string | undefined;

    for (let i = 0; i < argv.length; i += 1) {
      const arg = argv[i];
      if (arg === undefined) continue;

      switch (arg) {
        case "--text":
          text = this.val(arg, argv[++i]);
          break;
        case "--token-bytes":
          bytes = this.num(arg, argv[++i]);
          break;
        case "--scale":
          scale = this.num(arg, argv[++i]);
          break;
        case "--ec":
          ec = this.ec(this.val(arg, argv[++i]));
          break;
        case "--border":
          border = this.num(arg, argv[++i]);
          break;
        case "--font-size":
          font = this.num(arg, argv[++i]);
          break;
        case "--thicken":
          thick = this.num(arg, argv[++i]);
          break;
        case "--dark":
          dark = true;
          break;
        case "--edges":
        case "--negative-space":
          draw = "edge";
          break;
        case "--edge-width":
          edge = this.num(arg, argv[++i]);
          break;
        case "--format":
          fmt = this.fmt(this.val(arg, argv[++i]));
          break;
        case "--html":
          fmt = "html";
          break;
        case "--embed":
          fmt = "embed";
          break;
        case "--embed-src":
          embedSrc = this.url(arg, this.val(arg, argv[++i]));
          break;
        case "--term":
        case "--terminal":
          fmt = "term";
          break;
        case "--justify":
          justify = true;
          break;
        case "--no-justify":
          justify = false;
          break;
        case "-o":
        case "--output":
          out = this.val(arg, argv[++i]);
          break;
        case "-h":
        case "--help":
          this.help();
        default:
          throw new Error(`Unknown option: ${arg}`);
      }
    }

    this.chk({ bytes, scale, ec, border, font, thick, dark, draw, edge, fmt, justify, embedSrc });

    const base = {
      bytes,
      scale,
      ec,
      border,
      font,
      thick,
      dark,
      draw,
      edge,
      fmt,
      justify,
      embedSrc,
    };
    const cfg: Cfg = text === undefined ? base : { ...base, text };
    return out === undefined ? cfg : { ...cfg, out };
  }

  private help(): never {
    console.log(HELP);
    process.exit(0);
  }

  private val(name: string, val: string | undefined): string {
    if (val === undefined || val === "") throw new Error(`${name} requires a value.`);
    return val;
  }

  private num(name: string, raw: string | undefined): number {
    const val = Number(this.val(name, raw));
    if (!Number.isFinite(val)) throw new Error(`${name} must be a finite number.`);
    return val;
  }

  private ec(raw: string): Ec {
    const val = raw.toUpperCase();
    if (val === "L" || val === "M" || val === "Q" || val === "H") return val;
    throw new Error("--ec must be L, M, Q, or H.");
  }

  private fmt(raw: string): Fmt {
    const val = raw.toLowerCase();
    if (val === "html" || val === "term" || val === "embed") return val;
    throw new Error("--format must be html, term, or embed.");
  }

  private url(name: string, raw: string): string {
    try {
      return new URL(raw).href;
    } catch {
      throw new Error(`${name} must be an absolute URL.`);
    }
  }

  private chk(cfg: Omit<Cfg, "text" | "out">): void {
    if (!Number.isInteger(cfg.bytes) || cfg.bytes < 1) {
      throw new Error("--token-bytes must be a positive integer.");
    }
    if (!Number.isInteger(cfg.scale) || cfg.scale < 1) {
      throw new Error("--scale must be a positive integer.");
    }
    if (!Number.isInteger(cfg.border) || cfg.border < 4) {
      throw new Error("--border must be an integer of at least 4.");
    }
    if (cfg.font <= 0) throw new Error("--font-size must be greater than zero.");
    if (cfg.thick < 0) throw new Error("--thicken cannot be negative.");
    if (!Number.isInteger(cfg.edge) || cfg.edge < 1) {
      throw new Error("--edge-width must be a positive integer.");
    }
    if (cfg.draw === "edge" && cfg.scale <= cfg.edge * 2) {
      throw new Error("Edge mode needs scale greater than twice the edge width.");
    }
  }
}
