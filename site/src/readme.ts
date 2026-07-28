interface MarkedApi {
  parse(src: string): string | Promise<string>;
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

const rawUrl = "https://raw.githubusercontent.com/kitty-crow/braille-qr/main/README.md";
const blobBase = "https://github.com/kitty-crow/braille-qr/blob/main/";
const rawBase = "https://raw.githubusercontent.com/kitty-crow/braille-qr/main/";
const repoUrl = "https://github.com/kitty-crow/braille-qr";
const content = el<HTMLElement>("#readme-content");
const status = el<HTMLElement>("#readme-status");

void load();

async function load(): Promise<void> {
  try {
    const res = await fetch(rawUrl, {
      headers: { Accept: "text/markdown,text/plain;q=0.9,*/*;q=0.1" },
      cache: "no-cache",
    });
    if (!res.ok) throw new Error(`GitHub returned ${res.status} ${res.statusText}`);

    const markdown = await res.text();
    const libs = getLibs();
    const rendered = await libs.marked.parse(markdown);
    content.innerHTML = libs.purify.sanitize(rendered);
    rewriteLinks();
    content.querySelectorAll<HTMLElement>("pre code").forEach((block) => {
      libs.highlight.highlightElement(block);
    });
    status.textContent = "README loaded.";
  } catch (err: unknown) {
    status.textContent = err instanceof Error ? err.message : String(err);
    const p = document.createElement("p");
    p.append("The README could not be loaded. Open it in the ");
    const link = document.createElement("a");
    link.href = repoUrl;
    link.textContent = "GitHub repository";
    p.append(link, ".");
    content.replaceChildren(p);
  }
}

function rewriteLinks(): void {
  content.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    const raw = link.getAttribute("href") ?? "";
    if (!raw || raw.startsWith("#")) return;
    link.href = resolve(raw, blobBase);
    if (link.origin !== window.location.origin) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });

  content.querySelectorAll<HTMLImageElement>("img[src]").forEach((image) => {
    const raw = image.getAttribute("src") ?? "";
    if (!raw) return;
    image.src = resolve(raw, rawBase);
    image.loading = "lazy";
  });
}

function resolve(value: string, base: string): string {
  try {
    return new URL(value, base).href;
  } catch {
    return repoUrl;
  }
}

function getLibs(): Libs {
  const win = window as unknown as {
    readonly marked?: MarkedApi;
    readonly DOMPurify?: PurifyApi;
    readonly hljs?: HighlightApi;
  };

  if (win.marked === undefined || win.DOMPurify === undefined || win.hljs === undefined) {
    throw new Error("README rendering libraries did not load.");
  }

  return {
    marked: win.marked,
    purify: win.DOMPurify,
    highlight: win.hljs,
  };
}

function el<T extends Element>(query: string): T {
  const found = document.querySelector<T>(query);
  if (!found) throw new Error(`Missing page element: ${query}`);
  return found;
}

export {};
