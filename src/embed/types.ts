import type { Draw, Ec } from "../types.js";

export type EmbedTheme = "auto" | "light" | "dark";

export interface EmbedCfg {
  readonly text: string;
  readonly scale: number;
  readonly ec: Ec;
  readonly draw: Draw;
  readonly edge: number;
  readonly theme: EmbedTheme;
  readonly src: string;
  readonly cssSrc?: string;
  readonly loadSrc?: string;
  readonly style?: string;
  readonly query?: boolean;
}

export interface EmbedTpl {
  readonly html: string;
  readonly css?: string;
  readonly js?: string;
}
