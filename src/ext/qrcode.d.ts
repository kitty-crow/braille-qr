declare module "qrcode" {
  interface Mods {
    readonly size: number;
    get(x: number, y: number): number;
  }

  interface Sym {
    readonly modules: Mods;
  }

  interface Opts {
    readonly errorCorrectionLevel: "L" | "M" | "Q" | "H";
  }

  interface Api {
    create(text: string, opts: Opts): Sym;
  }

  const qr: Api;
  export default qr;
}
