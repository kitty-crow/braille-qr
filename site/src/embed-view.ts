import { Tpl } from "../../src/embed/tpl.js";
import type { EmbedTpl, EmbedTheme } from "../../src/embed/types.js";
import type { Draw, Ec } from "../../src/types.js";

const tpl: EmbedTpl = { html: __EMBED_HTML__ };

interface MarkedApi {
  parse(src: string): string;
}

interface PurifyApi {
  sanitize(src: string): string;
}

interface HighlightApi {
  highlightElement(el: HTMLElement): void;
}

interface Libs {
  readonly marked: MarkedApi;
  readonly purify: PurifyApi;
  readonly highlight: HighlightApi;
}

class EmbedView {
  private readonly fill = new Tpl();
  private readonly text = this.el<HTMLTextAreaElement>("[data-text]");
  private readonly scale = this.el<HTMLSelectElement>("[data-scale]");
  private readonly ec = this.el<HTMLSelectElement>("[data-ec]");
  private readonly draw = this.el<HTMLSelectElement>("[data-draw]");
  private readonly dark = this.el<HTMLInputElement>("[data-output-dark]");
  private readonly view = this.el<HTMLElement>("[data-embed-view]");
  private readonly copy = this.el<HTMLButtonElement>("[data-copy-embed]");
  private readonly status = this.el<HTMLElement>("[data-status]");
  private raw = "";
  private timer: number | undefined;

  run(): void {
    const form = this.el<HTMLFormElement>("[data-gen-form]");
    form.addEventListener("input", () => this.queue());
    form.addEventListener("change", () => this.queue(0));
    form.addEventListener("reset", () => window.setTimeout(() => this.make()));
    window.addEventListener("braille-qr:theme", () => this.make());
    this.copy.addEventListener("click", (event) => void this.copyOut(event), {
      capture: true,
    });
    this.make();
  }

  private queue(delay = 90): void {
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      this.make();
    }, delay);
  }

  private make(): string {
    const text = this.text.value.trim();
    if (!text) {
      this.raw = "";
      this.render("");
      return "";
    }

    const html = this.fill.make({
      text,
      scale: Number(this.scale.value),
      ec: this.ecVal(this.ec.value),
      draw: this.drawVal(this.draw.value),
      edge: 1,
      theme: this.theme(),
      src: __EMBED_SRC__,
    }, tpl);

    this.raw = html;
    this.render(html);
    return html;
  }

  private render(html: string): void {
    this.view.replaceChildren();
    this.view.scrollLeft = 0;
    if (!html) return;

    const libs = this.libs();
    if (libs === null) {
      this.plain(html);
      return;
    }

    try {
      const md = `\`\`\`html\n${html}\n\`\`\``;
      const safe = libs.purify.sanitize(libs.marked.parse(md));
      this.view.innerHTML = safe;

      const blocks = this.view.querySelectorAll<HTMLElement>("pre code");
      if (blocks.length === 0) {
        this.plain(html);
        return;
      }

      blocks.forEach((block) => libs.highlight.highlightElement(block));
    } catch {
      this.plain(html);
    }
  }

  private plain(html: string): void {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = "language-html";
    code.textContent = html;
    pre.append(code);
    this.view.replaceChildren(pre);
  }

  private libs(): Libs | null {
    const win = window as unknown as {
      readonly marked?: MarkedApi;
      readonly DOMPurify?: PurifyApi;
      readonly hljs?: HighlightApi;
    };

    if (win.marked === undefined || win.DOMPurify === undefined || win.hljs === undefined) {
      return null;
    }

    return {
      marked: win.marked,
      purify: win.DOMPurify,
      highlight: win.hljs,
    };
  }

  private async copyOut(event: Event): Promise<void> {
    event.preventDefault();
    event.stopImmediatePropagation();

    const html = this.raw || this.make();
    if (!html.trim()) {
      this.status.textContent = "Nothing to copy.";
      return;
    }

    try {
      await this.clip(html);
      this.status.textContent = "Paste-ready embed div copied.";
    } catch (err: unknown) {
      this.status.textContent = err instanceof Error ? err.message : String(err);
    }
  }

  private async clip(text: string): Promise<void> {
    if (window.isSecureContext && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Fall through to selection-based copying.
      }
    }

    const area = document.createElement("textarea");
    area.value = text;
    area.readOnly = true;
    area.style.cssText = "position:fixed;inset:0 auto auto -9999px;opacity:0;pointer-events:none";
    document.body.append(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    const copied = document.execCommand("copy");
    area.remove();

    if (!copied) {
      throw new Error("Clipboard access was blocked. Select the displayed code and copy it manually.");
    }
  }

  private theme(): EmbedTheme {
    return this.dark.checked ? "dark" : "light";
  }

  private ecVal(raw: string): Ec {
    if (raw === "L" || raw === "M" || raw === "Q" || raw === "H") return raw;
    return "H";
  }

  private drawVal(raw: string): Draw {
    return raw === "edge" ? "edge" : "fill";
  }

  private el<T extends Element>(query: string): T {
    const el = document.querySelector<T>(query);
    if (!el) throw new Error(`Missing page element: ${query}`);
    return el;
  }
}

new EmbedView().run();
