# Output formats

Braille QR supports terminal text, self-contained HTML and paste-ready embeds.

## Terminal

Terminal text is the default. Each Unicode Braille character carries a two-dot-wide by four-dot-high region of the supersampled QR matrix. Fixed-width justification is enabled by default.

```bash
bun run qr --text "https://kittycrow.dev"
```

## HTML

```bash
bun run qr --text "https://kittycrow.dev" --html
```

The HTML renderer measures the selected Braille font and preserves the native two-by-four cell ratio so the underlying QR modules remain square.

## Dark mode

```bash
bun run qr --text "https://kittycrow.dev" --html --dark
```

Dark mode uses white Braille dots on a black background.

## Hollow edges

`--edges` draws the outline of each dark QR module instead of filling it completely.

This mode is experimentally distance-sensitive. Depending on the display, size, camera and lighting, it may scan from farther away while failing when the camera is very close. That can create a useful “step back to scan” effect for large signs, projected displays, exhibits or installations intended to be viewed from a set distance.

It is not an access-control or security mechanism. Zooming, resizing, photographing or redisplaying the code may bypass the distance effect.

```bash
bun run qr --text "https://kittycrow.dev" --edges
```

## Justification

Disable fixed-width rows only when required:

```bash
bun run qr --no-justify
```
