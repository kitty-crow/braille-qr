import { expect, test } from "bun:test";
import { join } from "node:path";
import { staticEmbedHtml } from "../src/static-embed.ts";

const root = join(import.meta.dir, "..", "..");
const dist = join(root, "site", "dist");
const pagesPin = "b0e7a32e71d2fe1092bb78773f816139f4f10cbb";
const websitePin = "2331a54893fed5ec7c0bdbd3d8d1c9fef51794f5";
const repoUrl = "https://github.com/kitty-crow/unicode-qr-studio";
const pagesUrl = "https://kitty-crow.github.io/unicode-qr-studio";

const tree = async (path: string): Promise<string> => {
  const proc = Bun.spawn(["git", "ls-tree", "HEAD", path], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe"
  });
  const output = await new Response(proc.stdout).text();
  expect(await proc.exited).toBe(0);
  return output;
};

test("pins the shared Pages and website static UI dependencies", async () => {
  const modules = await Bun.file(join(root, ".gitmodules")).text();
  expect(modules).toContain("github-pages-template.git");
  expect(modules).toContain("kittyCrypto-gg/website.git");
  expect(await tree("vendor/pages")).toContain(pagesPin);
  expect(await tree("vendor/website")).toContain(websitePin);
});

test("builds the existing routes through the template", async () => {
  for (const path of [
    "index.html",
    "readme/index.html",
    "readme.html",
    "generate/index.html",
    "generate.html",
    "404.html",
    "version.json",
    "assets/app.js",
    "assets/embed-view.js",
    "assets/pages/boot.js",
    "assets/pages/runtime.js",
    "assets/pages/styles.css",
    "styles/styles.css",
    "styles/fixes.css",
    "styles/skin.css",
    "styles/content.css",
    "v1/embed.js",
    "v1/load.js",
    "v1/embed.css"
  ]) {
    expect(await Bun.file(join(dist, path)).exists()).toBe(true);
  }

  expect(await Bun.file(join(dist, "assets", "theme.js")).exists()).toBe(false);
  expect(await Bun.file(join(dist, "assets", "readme.js")).exists()).toBe(false);
  expect(await Bun.file(join(dist, "assets", "routes.js")).exists()).toBe(false);
});

test("keeps project layout and renamed application paths local", async () => {
  const home = await Bun.file(join(dist, "index.html")).text();
  const readme = await Bun.file(join(dist, "readme", "index.html")).text();
  const app = await Bun.file(join(dist, "assets", "app.js")).text();
  const embedView = await Bun.file(join(dist, "assets", "embed-view.js")).text();
  const runtime = await Bun.file(join(dist, "assets", "pages", "runtime.js")).text();

  expect(home).toContain("Unicode QR Studio");
  expect(home).toContain("QR codes,<br>rendered as text.");
  expect(home).toContain('href="./styles/styles.css"');
  expect(home).toContain('src="./assets/app.js"');
  expect(home).toContain('src="./assets/pages/runtime.js"');
  expect(home).toContain(repoUrl);
  expect(home).toContain("data-version");
  expect(readme).toContain("Unicode QR Studio documentation");
  expect(readme).toContain('href="../styles/styles.css"');
  expect(readme).toContain('src="../assets/pages/runtime.js"');
  expect(readme).toContain(repoUrl);
  expect(readme).toContain("data-version");
  expect(app).toContain(repoUrl);
  expect(embedView).toContain(`${pagesUrl}/v1/embed.js`);
  expect(embedView).toContain("No JavaScript");
  expect(embedView).toContain("Self-contained no-JavaScript HTML copied.");
  expect(runtime).toContain("/unicode-qr-studio/");

  for (const built of [home, readme, app, embedView, runtime]) {
    expect(built).not.toContain("kitty-crow.github.io/braille-qr");
    expect(built).not.toContain("github.com/kitty-crow/braille-qr");
  }
});

test("uses static TSX fragments without turning the authored HTML into a React app", async () => {
  const home = await Bun.file(join(root, "site", "index.html")).text();
  const fragments = await Bun.file(join(root, "site", "src", "ui", "fragments.tsx")).text();
  const app = await Bun.file(join(root, "site", "src", "app.ts")).text();
  const embedView = await Bun.file(join(root, "site", "src", "embed-view.ts")).text();

  expect(home).toContain('data-gen-form');
  expect(home).toContain('data-preview');
  expect(home).toContain('id="about"');
  expect(fragments).toContain('@kittycrypto/website/static-ui');
  expect(fragments).toContain("render2Frag");
  expect(app).toContain("gridFrag(");
  expect(app).toContain("metricsFrag(");
  expect(embedView).toContain("embedTabsFrag(");
  expect(embedView).toContain("plainCodeFrag(");

  for (const source of [fragments, app, embedView]) {
    expect(source).not.toContain("react-dom/client");
    expect(source).not.toContain("createRoot(");
    expect(source).not.toContain("hydrateRoot(");
    expect(source).not.toContain("useState(");
    expect(source).not.toContain("useEffect(");
  }
});

test("restores the self-loading Marked HTML colour renderer", async () => {
  const source = await Bun.file(join(root, "site", "src", "web", "rich-code.ts")).text();
  const embedView = await Bun.file(join(root, "site", "src", "embed-view.ts")).text();
  const built = await Bun.file(join(dist, "assets", "embed-view.js")).text();

  expect(source).toContain("marked@18.0.7");
  expect(source).toContain("dompurify@3.4.12");
  expect(source).toContain("@highlightjs/cdn-assets@11.11.1");
  expect(source).toContain("api.marked.parse");
  expect(source).toContain("api.purify.sanitize");
  expect(source).toContain("api.highlight.highlightElement");
  expect(embedView).toContain("richHtmlFrag(html)");
  expect(built).toContain("marked@18.0.7");
  expect(built).toContain("dompurify@3.4.12");
  expect(built).toContain("highlight.min.js");
});

test("keeps the public embed runtime and no-JavaScript output React-free", async () => {
  const embedSource = await Bun.file(join(root, "site", "src", "embed.ts")).text();
  const staticSource = await Bun.file(join(root, "site", "src", "static-embed.ts")).text();
  const built = await Bun.file(join(dist, "v1", "embed.js")).text();

  for (const source of [embedSource, staticSource, built]) {
    expect(source).not.toContain("@kittycrypto/website");
    expect(source).not.toContain("react-dom");
    expect(source).not.toContain("render2Frag");
    expect(source).not.toContain("createRoot(");
  }
});

test("CLI embeds use the renamed Pages CDN", async () => {
  const proc = Bun.spawn([
    "bun",
    "run",
    "qr",
    "--text",
    "https://kittycrow.dev",
    "--embed"
  ], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe"
  });
  const output = await new Response(proc.stdout).text();
  const error = await new Response(proc.stderr).text();

  expect(await proc.exited).toBe(0);
  expect(error).toContain("Generated: stdout");
  expect(output).toContain(`${pagesUrl}/v1/embed.js`);
  expect(output).not.toContain("kitty-crow.github.io/braille-qr");
});

test("no-JavaScript embed is formatted literal self-contained HTML with compact-matching geometry", () => {
  const html = staticEmbedHtml({
    text: "https://kittycrow.dev",
    scale: 4,
    ec: "H",
    draw: "fill",
    dark: false,
  });
  expect(html).toContain('role="img"');
  expect(html).toContain("Unicode QR code");
  expect(html).toContain("container-type:inline-size");
  expect(html).toContain("width:min(100%,24rem);aspect-ratio:1");
  expect(html).toContain("place-items:center");
  expect(html).toContain(">\n  <div style=");
  expect(html).toContain("\n    <div style=");
  expect(html.endsWith("\n</div>")).toBe(true);
  expect(html).not.toContain("32rem");
  expect(html).not.toMatch(/<script\b/iu);
  expect(html).not.toMatch(/<link\b/iu);
  expect(html).not.toMatch(/\bsrc=/iu);
  expect(html).not.toMatch(/\bhref=/iu);
  expect(html).not.toMatch(/url\s*\(/iu);
  expect(html).not.toMatch(/https?:/iu);
});

test("keeps package and footer versions aligned", async () => {
  const pkg = await Bun.file(join(root, "package.json")).json() as { readonly version: string };
  const source = await Bun.file(join(root, "version.json")).json() as { readonly version: string };
  const built = await Bun.file(join(dist, "version.json")).json() as { readonly version: string };

  expect(source.version).toBe(pkg.version);
  expect(built.version).toBe(pkg.version);
});
