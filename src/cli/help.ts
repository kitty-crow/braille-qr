export const HELP = `Usage: bun run qr [options]

Without --text, generates a random 64-byte token as uppercase hexadecimal.
Terminal output and fixed-width justification are enabled by default.

Options:
  --text <value>          Encode supplied text
  --token-bytes <n>       Random token size in bytes (default: 64)
  --scale <n>             Braille-dot scale per QR module (default: 8)
  --ec <L|M|Q|H>          Error correction (default: H)
  --border <n>            Quiet zone in QR modules (default: 4)
  --font-size <px>        HTML Braille font size (default: 2.5)
  --thicken <px>          HTML glyph thickening (default: 0.18)
  --dark                  White on black
  --edges                 Draw hollow module edges
  --edge-width <n>        Edge thickness in dots (default: 1)
  --html                  Write a self-contained HTML page
  --embed                 Write a paste-ready embeddable <div>
  --embed-src <url>       Override the published embed bundle URL
  --no-justify            Disable fixed-width row layout
  -o, --output <path>     Save output
  -h, --help              Show help

HTML preview:
  bun run serve [path] [--open]
`;
