# Embedding

GitHub Pages publishes the browser assets at:

```text
https://kitty-crow.github.io/unicode-qr-studio/v1/embed.js
https://kitty-crow.github.io/unicode-qr-studio/v1/embed.css
https://kitty-crow.github.io/unicode-qr-studio/v1/load.js
```

`embed.js` contains the QR dependency and runs entirely in the visitor's browser. No application server is required.

## Paste-ready div

The generator and CLI return one host `<div>` containing:

- the payload and QR settings as `data-*` attributes
- a shadow-DOM HTML template
- links to the versioned stylesheet, loader and bundled API

The consuming website may size and position the outer div. The repository styles the internal contents inside shadow DOM.

```bash
bun run qr \
  --text "https://kittycrow.dev" \
  --embed
```

Save the fragment:

```bash
bun run qr \
  --text "https://kittycrow.dev" \
  --embed \
  -o output/embed.html
```

Use a different published API location:

```bash
bun run qr \
  --text "https://kittycrow.dev" \
  --embed \
  --embed-src "https://example.com/unicode-qr-studio/embed.js"
```

The CLI derives sibling `embed.css` and `load.js` URLs from the supplied API URL.

## Generated route

```text
https://kitty-crow.github.io/unicode-qr-studio/generate?text=Hello
```

Supported parameters:

```text
text
scale
ec
draw
edge
theme
```

Fragment parameters take precedence and keep the payload out of the HTTP request:

```text
https://kitty-crow.github.io/unicode-qr-studio/generate#text=SECRET
```

## Templates

The fragment is assembled from real source files:

```text
templates/embed/embed.html
templates/embed/embed.css
templates/embed/embed.js
```

The TypeScript generator loads the templates, substitutes the requested values and returns the completed div.
