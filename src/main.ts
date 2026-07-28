#!/usr/bin/env node

import { App } from "./app.js";

new App().run(process.argv.slice(2)).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${msg}`);
  process.exitCode = 1;
});
