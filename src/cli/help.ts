export const HELP = `Usage: braille-qr [options]

Without --text, generates a random 64-byte token as uppercase hexadecimal.
HTML is the default output format. Terminal mode prints the QR to stdout.

Options:
  --text <value>          Encode supplied text
  --token-bytes <n>       Random token size in bytes (default: 64)
  --scale <n>             Braille-dot scale per QR module (default: 8)
  --ec <L|M|Q|H>          Error correction (default: H)
  --border <n>            Quiet zone in modules (default: 4)
  --font-size <px>        HTML Braille font size (default: 2.5)
  --thicken <px>          HTML glyph thickening (default: 0.18)
  --dark                  White on black in HTML or ANSI terminal output
  --edges                 Draw hollow module edges
  --edge-width <n>        Edge thickness in dots (default: 1)
  --format <html|term>    Output format (default: html)
  --html                  Alias for --format html
  --term                  Alias for --format term
  --justify               Force fixed-width rows and disable terminal wrapping
  --no-justify            Disable forced row layout
  -o, --output <path>     Save output instead of the format default
  -h, --help              Show help
`;
