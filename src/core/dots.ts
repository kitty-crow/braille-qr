import { Mat } from "./mat.js";
import type { Draw } from "../types.js";

export class Dots {
  make(src: Mat, scale: number, draw: Draw, edge: number): Mat {
    this.chk(scale, draw, edge);

    const out = new Mat(src.w * scale, src.h * scale);

    for (let y = 0; y < src.h; y += 1) {
      for (let x = 0; x < src.w; x += 1) {
        if (src.get(x, y)) {
          this.draw(out, x * scale, y * scale, scale, draw, edge);
        }
      }
    }

    return out;
  }

  private draw(
    out: Mat,
    left: number,
    top: number,
    scale: number,
    draw: Draw,
    edge: number,
  ): void {
    for (let y = 0; y < scale; y += 1) {
      for (let x = 0; x < scale; x += 1) {
        const on =
          draw === "fill" ||
          y < edge ||
          y >= scale - edge ||
          x < edge ||
          x >= scale - edge;

        if (on) {
          out.set(left + x, top + y);
        }
      }
    }
  }

  private chk(scale: number, draw: Draw, edge: number): void {
    if (!Number.isInteger(scale) || scale < 1) {
      throw new Error("Scale must be a positive integer.");
    }
    if (!Number.isInteger(edge) || edge < 1) {
      throw new Error("Edge width must be a positive integer.");
    }
    if (draw === "edge" && scale <= edge * 2) {
      throw new Error("Edge mode needs scale greater than twice the edge width.");
    }
  }
}
