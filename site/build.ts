import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Tpl } from "../src/embed/tpl.js";
import type { EmbedTpl } from "../src/embed/types.js";

const root = import.meta.dir;
const repo = join(root, "..");
const src = join(root, "src");
const out = join(root, "dist");
const assets = join(out, "assets");
const api = join(out, "v1");
const tplDir = join(repo, "templates", "embed");
const cdn = "https://kitty-crow.github.io/braille-qr/v1/embed.js";

await rm(out, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
await mkdir(api, { recursive: true });

const tpl: EmbedTpl = {
  html: await readFile(join(tplDir, "embed.html"), "utf8"),
};

const boot = await Bun.build({
  entrypoints: [join(src, "boot.ts")],
  outdir: assets,
  target: "browser",
  format: "iife",
  minify: true,
  sourcemap: "none",
  naming: "boot.js",
});

const app = await Bun.build({
  entrypoints: [
    join(src, "app.ts"),
    join(src, "embed-view.ts"),
    join(src, "readme.ts"),
    join(src, "routes.ts"),
    join(src, "theme.ts"),
  ],
  outdir: assets,
  target: "browser",
  minify: true,
  sourcemap: "none",
  define: {
    __EMBED_HTML__: JSON.stringify(tpl.html),
    __EMBED_CSS__: '""',
    __EMBED_JS__: '""',
    __EMBED_SRC__: JSON.stringify(cdn),
  },
});

const embed = await Bun.build({
  entrypoints: [join(src, "embed.ts")],
  outdir: api,
  target: "browser",
  format: "iife",
  minify: true,
  sourcemap: "none",
  naming: "embed.js",
});

for (const res of [boot, app, embed]) {
  if (!res.success) {
    for (const log of res.logs) console.error(log);
    throw new Error("Site bundle failed.");
  }
}

await cp(join(tplDir, "embed.css"), join(api, "embed.css"));
await cp(join(tplDir, "embed.js"), join(api, "load.js"));

await cp(join(src, "styles.css"), join(out, "styles.css"));
await cp(join(src, "fixes.css"), join(out, "fixes.css"));
await cp(join(src, "skin.css"), join(out, "skin.css"));
await cp(join(src, "content.css"), join(out, "content.css"));
await cp(join(src, "logo.svg"), join(out, "logo.svg"));
await cp(join(src, "index.html"), join(out, "index.html"));

const readme = await readFile(join(src, "readme.html"), "utf8");
await writeFile(join(out, "readme.html"), readme, "utf8");
await mkdir(join(out, "readme"), { recursive: true });
await writeFile(
  join(out, "readme", "index.html"),
  readme
    .replaceAll('href="./logo.svg"', 'href="../logo.svg"')
    .replaceAll('href="./styles.css"', 'href="../styles.css"')
    .replaceAll('href="./skin.css"', 'href="../skin.css"')
    .replaceAll('href="./content.css"', 'href="../content.css"')
    .replaceAll('src="./assets/', 'src="../assets/'),
  "utf8",
);

const pageTpl = await readFile(join(src, "generate.html"), "utf8");
const fill = new Tpl();
const gen = (srcPath: string) => fill.make({
  text: "https://kittycrow.dev",
  scale: 8,
  ec: "H",
  draw: "fill",
  edge: 1,
  theme: "auto",
  src: srcPath,
  query: true,
  style: "display:block;width:min(100%,40rem);height:min(100dvh,40rem);aspect-ratio:1",
}, tpl);
const genRoot = pageTpl.replace("{{EMBED}}", gen("./v1/embed.js"));
const genDir = pageTpl.replace("{{EMBED}}", gen("../v1/embed.js"));

await writeFile(join(out, "generate.html"), genRoot, "utf8");
await mkdir(join(out, "generate"), { recursive: true });
await writeFile(join(out, "generate", "index.html"), genDir, "utf8");

const notFound = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Not found · Braille QR</title><link rel="stylesheet" href="./styles.css"><link rel="stylesheet" href="./skin.css"><link rel="stylesheet" href="./content.css"></head><body><main class="main"><section class="about-hero"><p class="eyebrow">404</p><h1>That page is not here.</h1><p class="lead">Return to the Braille QR generator.</p><p><a class="button button--primary" href="./">Return to generator</a></p></section></main></body></html>`;
await writeFile(join(out, "404.html"), notFound, "utf8");
await writeFile(join(out, ".nojekyll"), "", "utf8");

console.log(`Built site: ${out}`);
