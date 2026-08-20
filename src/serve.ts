#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { platform } from "node:os";
import { resolve } from "node:path";

interface Cfg {
  readonly path: string;
  readonly open: boolean;
}

class Args {
  parse(argv: readonly string[]): Cfg {
    let path = "output/unicode-qr-studio.html";
    let open = false;

    for (const arg of argv) {
      if (arg === "--open") {
        open = true;
      } else if (arg === "-h" || arg === "--help") {
        this.help();
      } else if (arg.startsWith("-")) {
        throw new Error(`Unknown option: ${arg}`);
      } else {
        path = arg;
      }
    }

    return { path, open };
  }

  private help(): never {
    console.log(`Usage: bun run serve [path] [--open]

Serves a generated HTML QR page on a random available local port.

Arguments:
  path       HTML file to serve (default: output/unicode-qr-studio.html)

Options:
  --open     Open the page in the default browser
  -h         Show help
`);
    process.exit(0);
  }
}

class Web {
  async run(cfg: Cfg): Promise<void> {
    const path = resolve(cfg.path);
    const file = Bun.file(path);

    if (!(await file.exists())) {
      throw new Error(`HTML file not found: ${path}`);
    }

    const srv = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(req) {
        const url = new URL(req.url);

        if (url.pathname !== "/" && url.pathname !== "/index.html") {
          return new Response("Not found", { status: 404 });
        }

        return new Response(file, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      },
    });

    const url = srv.url.href;
    console.log(`Serving: ${path}`);
    console.log(`Open: ${url}`);

    if (cfg.open) {
      this.open(url);
    }
  }

  private open(url: string): void {
    const os = platform();
    const cmd = os === "win32"
      ? ["cmd", "/c", "start", "", url]
      : os === "darwin"
        ? ["open", url]
        : ["xdg-open", url];

    const child = spawn(cmd[0] ?? "", cmd.slice(1), {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  }
}

const cfg = new Args().parse(process.argv.slice(2));

new Web().run(cfg).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${msg}`);
  process.exitCode = 1;
});
