import { Args } from "./cli/args.js";
import { Braille } from "./core/braille.js";
import type { Code } from "./core/code.js";
import { Dots } from "./core/dots.js";
import { Qr } from "./core/qr.js";
import { Token } from "./core/token.js";
import { Embed } from "./embed/embed.js";
import { Page } from "./html/page.js";
import { Out } from "./io/out.js";
import { Term } from "./term/term.js";
import type { Cfg, Fmt, Meta, Res } from "./types.js";

export class App {
  constructor(
    private readonly arg = new Args(),
    private readonly tok = new Token(),
    private readonly qr = new Qr(),
    private readonly dot = new Dots(),
    private readonly brl = new Braille(),
    private readonly pg = new Page(),
    private readonly emb = new Embed(),
    private readonly tty = new Term(),
    private readonly io = new Out(),
  ) {}

  async run(argv: readonly string[]): Promise<Res> {
    const cfg = this.arg.parse(argv);
    const text = cfg.text ?? this.tok.make(cfg.bytes);
    const kind = cfg.text === undefined ? "token" : "text";
    const mat = this.qr.make(text, cfg.ec, cfg.border);
    const dots = this.dot.make(mat, cfg.scale, cfg.draw, cfg.edge);
    const code = this.brl.make(dots);
    const meta: Meta = {
      kind,
      chars: text.length,
      bytes: Buffer.byteLength(text, "utf8"),
      qr: mat.w,
      cols: code.cols,
      rows: code.rows,
    };
    const data = await this.make(cfg, text, code, meta);
    const path = await this.emit(cfg.fmt, cfg.out, data);

    this.log(text, meta, path);

    return path === undefined
      ? { data, meta, text }
      : { data, meta, text, path };
  }

  private async make(cfg: Cfg, text: string, code: Code, meta: Meta): Promise<string> {
    if (cfg.fmt === "html") return this.pg.make(code, cfg, meta);
    if (cfg.fmt === "embed") {
      return this.emb.make({
        text,
        scale: cfg.scale,
        ec: cfg.ec,
        draw: cfg.draw,
        edge: cfg.edge,
        theme: cfg.dark ? "dark" : "auto",
        src: cfg.embedSrc,
      });
    }
    return this.tty.make(code, cfg, cfg.out === undefined && process.stdout.isTTY === true);
  }

  private async emit(fmt: Fmt, path: string | undefined, data: string): Promise<string | undefined> {
    const dest = path ?? (fmt === "html" ? "output/braille-qr.html" : undefined);
    if (dest === undefined) {
      this.io.print(data);
      return undefined;
    }
    return this.io.save(dest, data);
  }

  private log(text: string, meta: Meta, path: string | undefined): void {
    const dest = path === undefined ? "stdout" : path;
    console.error(`Generated: ${dest}`);
    console.error(`Kind: ${meta.kind}`);
    console.error(`Payload: ${meta.chars} characters, ${meta.bytes} bytes`);
    console.error(`QR: ${meta.qr} × ${meta.qr} modules including quiet zone`);
    console.error(`Braille: ${meta.cols} columns × ${meta.rows} rows`);
    if (meta.kind === "token") console.error(`Token: ${text}`);
  }
}
