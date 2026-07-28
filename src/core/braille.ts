import { Code } from "./code.js";
import { Mat } from "./mat.js";

const BASE = 0x2800;
const MASKS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
] as const;

export class Braille {
  make(mat: Mat): Code {
    const w = Math.ceil(mat.w / 2) * 2;
    const h = Math.ceil(mat.h / 4) * 4;
    const lines: string[] = [];

    for (let top = 0; top < h; top += 4) {
      let line = "";

      for (let left = 0; left < w; left += 2) {
        line += String.fromCodePoint(BASE + this.bits(mat, left, top));
      }

      lines.push(line);
    }

    return new Code(lines);
  }

  private bits(mat: Mat, left: number, top: number): number {
    let bits = 0;

    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 2; x += 1) {
        const px = left + x;
        const py = top + y;

        const row = MASKS[y];
        const mask = row?.[x];

        if (mask !== undefined && px < mat.w && py < mat.h && mat.get(px, py)) {
          bits |= mask;
        }
      }
    }

    return bits;
  }
}
