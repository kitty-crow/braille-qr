#!/usr/bin/env bun

import { extname, join, normalize } from "node:path";

const root = join(import.meta.dir, "dist");
const routes = new Map<string, string>([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/about", "about.html"],
  ["/about/", "about.html"],
  ["/about.html", "about.html"],
  ["/generate", "generate.html"],
  ["/generate/", "generate.html"],
  ["/generate.html", "generate.html"],
]);

function filePath(path: string): string | null {
  const route = routes.get(path);
  if (route) return join(root, route);
  const clean = normalize(path).replace(/^[/\\]+/, "");
  return !clean || clean.startsWith("..") ? null : join(root, clean);
}

function type(path: string): string {
  switch (extname(path)) {
    case ".css": return "text/css; charset=utf-8";
    case ".js": return "text/javascript; charset=utf-8";
    case ".svg": return "image/svg+xml";
    case ".html": return "text/html; charset=utf-8";
    default: return "application/octet-stream";
  }
}

const srv = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(req) {
    const path = filePath(new URL(req.url).pathname);
    if (!path) return new Response("Not found", { status: 404 });
    const file = Bun.file(path);
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    return new Response(file, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": type(path),
      },
    });
  },
});

console.log(`Braille QR site: ${srv.url}`);
