import { Code } from "../core/code.js";
import type { Cfg } from "../types.js";

const NOWRAP = "\u001B[?7l";
const WRAP = "\u001B[?7h";
const DARK = "\u001B[97;40m";
const RESET = "\u001B[0m";

export class Term {
  make(code: Code, cfg: Cfg, ansi: boolean): string {
    const text = code.text();
    const open = ansi && cfg.justify ? NOWRAP : "";
    const colour = ansi && cfg.dark ? DARK : "";
    const reset = colour ? RESET : "";
    const close = open ? WRAP : "";

    return `${open}${colour}${text}${reset}${close}\n`;
  }
}
