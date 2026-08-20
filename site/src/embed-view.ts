import { Tpl } from "../../src/embed/tpl.js";
import type { EmbedTpl, EmbedTheme } from "../../src/embed/types.js";
import type { Draw, Ec } from "../../src/types.js";
import { staticEmbedHtml } from "./static-embed.js";
import { embedTabsFrag, plainCodeFrag } from "./ui/fragments.tsx";
import { richHtmlFrag } from "./web/rich-code.ts";

const tpl: EmbedTpl = { html: __EMBED_HTML__ };
type Mode = "compact" | "static";

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
  private staticRaw = "";
  private mode: Mode = "compact";
  private timer: number | undefined;
  private renderGeneration = 0;
  private compactTab: HTMLButtonElement | null = null;
  private staticTab: HTMLButtonElement | null = null;

  run(): void {
    const form = this.el<HTMLFormElement>("[data-gen-form]");
    this.mountTabs();
    form.addEventListener("input", () => this.queue());
    form.addEventListener("change", () => this.queue(0));
    form.addEventListener("reset", () => window.setTimeout(() => this.make()));
    window.addEventListener("braille-qr:theme", () => this.make());
    this.copy.addEventListener("click", (event) => void this.copyOut(event), {
      capture: true,
    });
    this.make();
  }

  private mountTabs(): void {
    const frag = embedTabsFrag();
    const tabs = frag.firstElementChild;
    if (!(tabs instanceof HTMLElement)) throw new Error("Embed tab fragment is missing its root element.");

    this.compactTab = tabs.querySelector<HTMLButtonElement>('[data-embed-mode="compact"]');
    this.staticTab = tabs.querySelector<HTMLButtonElement>('[data-embed-mode="static"]');
    if (!this.compactTab || !this.staticTab) throw new Error("Embed format tabs are incomplete.");

    this.compactTab.addEventListener("click", () => this.select("compact"));
    this.staticTab.addEventListener("click", () => this.select("static"));
    this.view.before(frag);
  }

  private select(mode: Mode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.syncTabs();
    if (!this.raw) {
      this.make();
      return;
    }
    this.render(mode === "compact" ? this.raw : this.staticHtml());
  }

  private syncTabs(): void {
    const compact = this.mode === "compact";
    this.compactTab?.setAttribute("aria-selected", String(compact));
    this.staticTab?.setAttribute("aria-selected", String(!compact));
    this.compactTab?.classList.toggle("button--primary", compact);
    this.compactTab?.classList.toggle("button--secondary", !compact);
    this.staticTab?.classList.toggle("button--primary", !compact);
    this.staticTab?.classList.toggle("button--secondary", compact);
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
      this.staticRaw = "";
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
    this.staticRaw = "";
    this.render(this.mode === "compact" ? html : this.staticHtml());
    return html;
  }

  private staticHtml(): string {
    if (this.staticRaw) return this.staticRaw;
    const text = this.text.value.trim();
    if (!text) return "";
    this.staticRaw = staticEmbedHtml({
      text,
      scale: Number(this.scale.value),
      ec: this.ecVal(this.ec.value),
      draw: this.drawVal(this.draw.value),
      dark: this.dark.checked,
    });
    return this.staticRaw;
  }

  private render(html: string): void {
    const generation = ++this.renderGeneration;
    this.view.replaceChildren();
    this.view.scrollLeft = 0;
    if (!html) return;
    void this.renderRich(html, generation);
  }

  private async renderRich(html: string, generation: number): Promise<void> {
    try {
      const frag = await richHtmlFrag(html);
      if (generation !== this.renderGeneration) return;
      this.view.replaceChildren(frag);
    } catch {
      if (generation === this.renderGeneration) this.plain(html);
    }
  }

  private plain(html: string): void {
    this.view.replaceChildren(plainCodeFrag(html));
  }

  private async copyOut(event: Event): Promise<void> {
    event.preventDefault();
    event.stopImmediatePropagation();

    const html = this.mode === "static" ? this.staticHtml() : (this.raw || this.make());
    if (!html.trim()) {
      this.status.textContent = "Nothing to copy.";
      return;
    }

    try {
      await this.clip(html);
      this.status.textContent = this.mode === "static"
        ? "Self-contained no-JavaScript HTML copied."
        : "Paste-ready embed div copied.";
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
