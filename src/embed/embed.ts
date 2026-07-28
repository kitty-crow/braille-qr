import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { Tpl } from "./tpl.js";
import type { EmbedCfg, EmbedTpl } from "./types.js";

const path = new URL("../../templates/embed/embed.html", import.meta.url);

export class Embed {
  private readonly fill = new Tpl();
  private tpl: Promise<EmbedTpl> | undefined;

  async make(cfg: EmbedCfg): Promise<string> {
    return this.fill.make(cfg, await this.load());
  }

  private load(): Promise<EmbedTpl> {
    this.tpl ??= readFile(fileURLToPath(path), "utf8").then((html) => ({ html }));
    return this.tpl;
  }
}
