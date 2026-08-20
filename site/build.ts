import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Tpl } from "../src/embed/tpl.js";
import type { EmbedTpl } from "../src/embed/types.js";
import { build as buildPages, load } from "../vendor/pages/src/index.ts";

const root = import.meta.dir;
const repo = join(root, "..");
const browser = join(root, "src");
const styles = join(root, "styles");
const stage = join(root, ".pages-src");
const out = join(root, "dist");
const assets = join(stage, "assets");
const api = join(stage, "v1");
const tplDir = join(repo, "templates", "embed");
const cdn = "https://kitty-crow.github.io/braille-qr/v1/embed.js";

await rm(stage, { recursive: true, force: true });
await rm(out, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
await mkdir(api, { recursive: true });

try {
  const tpl: EmbedTpl = {
    html: await readFile(join(tplDir, "embed.html"), "utf8")
  };

  const app = await Bun.build({
    entrypoints: [
      join(browser, "app.ts"),
      join(browser, "embed-view.ts")
    ],
    outdir: assets,
    target: "browser",
    minify: true,
    sourcemap: "none",
    define: {
      __EMBED_HTML__: JSON.stringify(tpl.html),
      __EMBED_CSS__: '""',
      __EMBED_JS__: '""',
      __EMBED_SRC__: JSON.stringify(cdn)
    }
  });

  const embed = await Bun.build({
    entrypoints: [join(browser, "embed.ts")],
    outdir: api,
    target: "browser",
    format: "iife",
    minify: true,
    sourcemap: "none",
    naming: "embed.js"
  });

  for (const result of [app, embed]) {
    if (result.success) continue;
    for (const log of result.logs) console.error(log);
    throw new Error("Site bundle failed.");
  }

  await cp(join(tplDir, "embed.css"), join(api, "embed.css"));
  await cp(join(tplDir, "embed.js"), join(api, "load.js"));
  await cp(styles, join(stage, "styles"), { recursive: true });
  await cp(join(root, "logo.svg"), join(stage, "logo.svg"));

  for (const file of ["index.html", "readme.html", "404.html"]) {
    await cp(join(root, file), join(stage, file));
  }

  const pageTpl = await readFile(join(root, "generate.html"), "utf8");
  const fill = new Tpl();
  const generated = fill.make({
    text: "https://kittycrow.dev",
    scale: 8,
    ec: "H",
    draw: "fill",
    edge: 1,
    theme: "auto",
    src: "../v1/embed.js",
    query: true,
    style: "display:block;width:min(100%,40rem);height:min(100dvh,40rem);aspect-ratio:1"
  }, tpl);
  await writeFile(join(stage, "generate.html"), pageTpl.replace("{{EMBED}}", generated), "utf8");

  const config = await load(join(repo, "pages.config.ts"));
  await buildPages(config);
  console.log(`Built site: ${out}`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
