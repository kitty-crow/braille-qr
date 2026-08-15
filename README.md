# Braille QR

A strongly typed Bun and TypeScript utility that renders genuine QR matrices as dense Unicode Braille. It supports terminal text, self-contained HTML, a browser generator and paste-ready website embeds.

Without `--text`, the CLI creates a random 64-byte token and encodes its uppercase hexadecimal representation.

## Install

```bash
git submodule update --init --recursive
bun install
bun run check
```

## Terminal output

Terminal output and fixed-width justification are the defaults.

```bash
bun run qr
bun run qr --text "https://kittycrow.dev"
```

Save the output:

```bash
bun run qr \
  --text "https://kittycrow.dev" \
  -o output/site.txt
```

Disable fixed-width rows:

```bash
bun run qr --no-justify
```

## HTML output

```bash
bun run qr \
  --text "https://kittycrow.dev" \
  --html \
  --dark \
  -o output/site.html
```

Serve and open the default generated page:

```bash
bun run preview
```

## Embeddable div

```bash
bun run qr \
  --text "https://kittycrow.dev" \
  --embed
```

The result is one paste-ready host div. It links to the versioned GitHub Pages CSS, loader and bundled browser API, while the consuming website controls the size and position of the outer div.

The web generator's embed panel has **Compact** and **No JavaScript** tabs. Compact shows and copies the existing runtime-backed fragment. No JavaScript expands the current QR into literal Braille plus inline CSS only, with no script, external stylesheet, external asset or network fetch; the same copy button copies whichever tab is selected. The static form is deliberately much more verbose and cannot perform the compact runtime's font-metric calibration.

See the [embedding guide](docs/embed.md).

## Browser app

```bash
bun run site:check
bun run site:build
bun run site:test
bun run site:dev
```

The Pages app provides:

- live QR generation while text or settings change
- operating-system light and dark theme detection
- a persistent theme override stored in `localStorage`
- text, HTML and embed exports
- a direct `/generate?text=...` route
- clean extensionless navigation
- experimental hollow-edge, distance-sensitive rendering

The pinned `vendor/pages` submodule supplies the GitHub Pages route compiler, early theme boot, persisted theme state, Ko-fi behaviour, footer version loading and README renderer. Braille QR keeps its current page markup, application code, embed API and project CSS locally.

`site/build.ts` bundles the Braille QR browser code and embed API into a temporary Pages source tree, then delegates route and shared-runtime generation to `pages.config.ts`. Generated artefacts remain ignored.

GitHub workflows:

- [CI](.github/workflows/ci.yml) validates pull requests without deploying them.
- [Pages](.github/workflows/pages.yml) checks, builds and deploys `site/dist` from `main`.
- [Chore version](.github/workflows/version.yml) increments `package.json` and `version.json`, tags the release and deploys the matching footer version.

## Versioning

`package.json` and `version.json` must contain the same semantic version. The Pages footer reads the deployed `version.json` at runtime.

```bash
bun run version:check
```

## Hollow edges

Hollow edges may scan more reliably from a distance while failing close up. This can produce a useful “step back to scan” effect for signage, exhibits or projected installations. It is not a security mechanism.

```bash
bun run qr --text "https://kittycrow.dev" --edges
```

## Main options

```text
--text <value>          Encode supplied text
--token-bytes <n>       Random token size in bytes, default 64
--scale <n>             Braille-dot scale per QR module, default 8
--ec <L|M|Q|H>          Error correction, default H
--border <n>            Quiet zone in modules, default 4
--font-size <px>        HTML Braille font size, default 2.5
--thicken <px>          HTML glyph thickening, default 0.18
--dark                  White on black
--edges                 Draw hollow module edges
--edge-width <n>        Edge thickness in dots, default 1
--html                  Generate self-contained HTML
--embed                 Generate a paste-ready embed div
--embed-src <url>       Override the published embed API URL
--no-justify            Disable fixed-width row layout
-o, --output <path>     Save output
```

## Documentation

- [Documentation index](docs/README.md)
- [Usage](docs/usage.md)
- [Output formats](docs/output.md)
- [Embedding](docs/embed.md)
- [Architecture](docs/architecture.md)
- [Security](docs/security.md)

## Author

Kitty Crow  
https://kittycrow.dev

## Licence

Released under the [MIT Licence](LICENSE).
