export class Mat {
  readonly w: number;
  readonly h: number;

  private readonly buf: Uint8Array;

  constructor(w: number, h: number) {
    if (!Number.isInteger(w) || w < 1 || !Number.isInteger(h) || h < 1) {
      throw new Error("Matrix dimensions must be positive integers.");
    }

    this.w = w;
    this.h = h;
    this.buf = new Uint8Array(w * h);
  }

  get(x: number, y: number): boolean {
    this.chk(x, y);
    return this.buf[this.idx(x, y)] === 1;
  }

  set(x: number, y: number, val = true): void {
    this.chk(x, y);
    this.buf[this.idx(x, y)] = val ? 1 : 0;
  }

  private idx(x: number, y: number): number {
    return y * this.w + x;
  }

  private chk(x: number, y: number): void {
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= this.w ||
      y >= this.h
    ) {
      throw new RangeError(`Matrix coordinate out of range: ${x},${y}`);
    }
  }
}
