# Usage

## Install and check

```bash
bun install
bun run check
```

## Terminal

```bash
bun run qr --text "https://kittycrow.dev"
```

Without `--text`, the CLI creates a random 64-byte token and encodes its uppercase hexadecimal representation.

## HTML

```bash
bun run qr --text "https://kittycrow.dev" --html --dark
bun run preview
```

## Embed div

```bash
bun run qr --text "https://kittycrow.dev" --embed
```

## Web app

```bash
bun run site:check
bun run site:build
bun run site:test
```
