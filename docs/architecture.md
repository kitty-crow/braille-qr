# Architecture

The repository has one TypeScript QR core shared by the CLI, generated HTML and browser app.

- `src/core/` builds the QR matrix, supersamples modules and packs dots into Unicode Braille Patterns characters.
- `src/cli/` parses command-line arguments.
- `src/html/` creates self-contained HTML output.
- `src/embed/` fills the real embed templates from `templates/embed/`.
- `site/*.html` contains the static page glue.
- `site/styles/` contains project styles.
- `site/src/` contains browser TypeScript.
- `site/build.ts` bundles browser TypeScript and the `qrcode` dependency with Bun.

The only authored JavaScript file is `templates/embed/embed.js`, a loader template copied to the Pages bundle as `v1/load.js`. Compiled JavaScript under `build/` and `site/dist/` is ignored and marked as generated for GitHub Linguist.
