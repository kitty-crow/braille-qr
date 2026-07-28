# Braille QR

A strongly typed TypeScript CLI that renders dense Unicode Braille QR codes as either self-contained HTML or terminal text.

With no `--text` argument it creates a cryptographically random 64-byte session token, converts it to uppercase hexadecimal so the QR encoder can use alphanumeric mode, and encodes it with high error correction.

## Requirements

- Node.js 20 or newer
- npm

## Install

```bash
npm install
npm run build
```

## HTML output

HTML is the default. Without `-o`, it writes `output/braille-qr.html`.

```bash
npm run dev -- --dark --justify
```

Encode supplied text:

```bash
npm run dev -- \
  --text "https://kittycrow.dev" \
  --html \
  --dark \
  --justify \
  -o output/site.html
```

The HTML measures the active Braille glyph at runtime. It sets each Braille cell to twice its measured width in height, preserving the underlying 2-by-4 dot geometry and square QR modules.

`--justify` uses a fixed CSS grid with one explicit cell per Braille character. This prevents browsers and embedded views from splitting, wrapping or unevenly reflowing individual rows.

## Terminal output

Terminal mode prints only the QR to standard output. Status and generated-token details go to standard error, so they cannot corrupt the code.

```bash
npm run dev -- --term --justify
```

Save terminal text instead:

```bash
npm run dev -- \
  --text "https://kittycrow.dev" \
  --term \
  --justify \
  -o output/site.txt
```

In an interactive ANSI terminal, `--justify` disables automatic line wrapping while the QR is printed, then restores it. Every row is padded with Unicode Braille blanks to the same character width. Redirected or saved output contains no ANSI control sequences.

## Options

```text
--text <value>          Encode supplied text
--token-bytes <n>       Random token size in bytes, default 64
--scale <n>             Braille-dot scale per QR module, default 8
--ec <L|M|Q|H>          Error correction, default H
--border <n>            Quiet zone in modules, default 4
--font-size <px>        HTML Braille font size, default 2.5
--thicken <px>          HTML glyph thickening, default 0.18
--dark                  White on black in HTML or ANSI terminal output
--edges                 Draw hollow module edges
--edge-width <n>        Edge thickness in dots, default 1
--format <html|term>    Output format, default html
--html                  Alias for --format html
--term                  Alias for --format term
--justify               Force fixed-width rows and disable terminal wrapping
--no-justify            Disable forced row layout
-o, --output <path>     Save output instead of the format default
```

## Source layout

```text
src/
  cli/      argument parsing and help
  core/     token, QR matrix, scaling and Braille encoding
  html/     HTML escaping, CSS and fixed-cell page rendering
  term/     terminal rendering and ANSI wrapping control
  io/       file and stdout output
  app.ts    application flow
  main.ts   executable entry point
  types.ts  shared types
```

The code uses short names that remain clear in local context. Comments carry the uncommon detail instead of bloating identifiers.

Authored by [Kitty Crow](https://kittycrow.dev).

## Documentation

- [Documentation index](docs/README.md)
- [Usage](docs/usage.md)
- [Output formats](docs/output.md)
- [Architecture](docs/architecture.md)
- [Security](docs/security.md)

## Licence

Released under the [MIT Licence](LICENSE).
