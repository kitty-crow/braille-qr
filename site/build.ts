import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = import.meta.dir;
const src = join(root, "src");
const out = join(root, "dist");
const assets = join(out, "assets");

await rm(out, { recursive: true, force: true });
await mkdir(assets, { recursive: true });

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
  entrypoints: [join(src, "app.ts"), join(src, "routes.ts"), join(src, "theme.ts")],
  outdir: assets,
  target: "browser",
  minify: true,
  sourcemap: "none",
});

for (const res of [boot, app]) {
  if (!res.success) {
    for (const log of res.logs) console.error(log);
    throw new Error("Site bundle failed.");
  }
}

await cp(join(src, "styles.css"), join(out, "styles.css"));
await cp(join(src, "fixes.css"), join(out, "fixes.css"));
await cp(join(src, "logo.svg"), join(out, "logo.svg"));
await cp(join(src, "index.html"), join(out, "index.html"));

const about = await readFile(join(src, "about.html"), "utf8");
await writeFile(join(out, "about.html"), about, "utf8");
await mkdir(join(out, "about"), { recursive: true });
await writeFile(
  join(out, "about", "index.html"),
  about
    .replaceAll('href="./logo.svg"', 'href="../logo.svg"')
    .replaceAll('href="./styles.css"', 'href="../styles.css"')
    .replaceAll('src="./assets/', 'src="../assets/'),
  "utf8",
);

await writeFile(join(out, ".nojekyll"), "", "utf8");
console.log(`Built site: ${out}`);
