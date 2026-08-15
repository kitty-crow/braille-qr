import { expect, test } from "bun:test";
import { join } from "node:path";
import { staticEmbedHtml } from "../src/static-embed.ts";

const root = join(import.meta.dir, "..", "..");
const dist = join(root, "site", "dist");
const pin = "7f8266bfa146476784a4435ca5f8d8fac29c223e";

test("pins the shared Pages dependency", async () => {
  const modules = await Bun.file(join(root, ".gitmodules")).text();
  expect(modules).toContain("github-pages-template.git");

  const proc = Bun.spawn(["git", "ls-tree", "HEAD", "vendor/pages"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe"
  });
  const output = await new Response(proc.stdout).text();
  expect(await proc.exited).toBe(0);
  expect(output).toContain(pin);
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

test("keeps project layout and application assets local", async () => {
  const home = await Bun.file(join(dist, "index.html")).text();
  const readme = await Bun.file(join(dist, "readme", "index.html")).text();
  const embedView = await Bun.file(join(dist, "assets", "embed-view.js")).text();

  expect(home).toContain("QR codes,<br>rendered as text.");
  expect(home).toContain('src="./assets/app.js"');
  expect(home).toContain('src="./assets/pages/runtime.js"');
  expect(home).toContain("data-version");
  expect(readme).toContain("Braille QR documentation");
  expect(readme).toContain('href="../styles.css"');
  expect(readme).toContain('src="../assets/pages/runtime.js"');
  expect(readme).toContain("data-version");
  expect(embedView).toContain("No JavaScript");
  expect(embedView).toContain("Self-contained no-JavaScript HTML copied.");
});

test("no-JavaScript embed is literal self-contained HTML with compact-matching geometry", () => {
  const html = staticEmbedHtml({
    text: "https://kittycrow.dev",
    scale: 4,
    ec: "H",
    draw: "fill",
    dark: false,
  });
  expect(html).toContain('role="img"');
  expect(html).toContain("Braille QR code");
  expect(html).toContain("container-type:inline-size");
  expect(html).toContain("width:min(100%,24rem);aspect-ratio:1");
  expect(html).toContain("place-items:center");
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
