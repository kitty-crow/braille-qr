export type Ec = "L" | "M" | "Q" | "H";

export type Draw = "fill" | "edge";

export type Fmt = "html" | "term";

export interface Cfg {
  readonly text?: string;
  readonly bytes: number;
  readonly scale: number;
  readonly ec: Ec;
  readonly border: number;
  readonly font: number;
  readonly thick: number;
  readonly dark: boolean;
  readonly draw: Draw;
  readonly edge: number;
  readonly fmt: Fmt;
  readonly justify: boolean;
  readonly out?: string;
}

export interface Meta {
  readonly kind: "text" | "token";
  readonly chars: number;
  readonly bytes: number;
  readonly qr: number;
  readonly cols: number;
  readonly rows: number;
}

export interface Res {
  readonly data: string;
  readonly meta: Meta;
  readonly text: string;
  readonly path?: string;
}
