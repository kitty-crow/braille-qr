# Security

The browser generator runs locally. Payload text is not submitted to a Unicode QR Studio application server.

Query-string payloads appear in browser history and may appear in logs. Use the fragment form for sensitive values:

```text
https://kitty-crow.github.io/braille-qr/generate#text=SECRET
```

A generated session token is a bearer credential. Anyone who obtains it can use it wherever that token is accepted.

The highlighted embed preview is rendered through pinned Marked and Highlight.js releases and sanitised with DOMPurify. Sites embedding the CDN bundle may need to permit `kitty-crow.github.io` in their Content Security Policy.

Hollow-edge distance sensitivity is a visual behaviour, not a security boundary.
