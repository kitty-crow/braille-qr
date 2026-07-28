import QRCode from "qrcode";

import { Mat } from "./mat.js";
import type { Ec } from "../types.js";

export class Qr {
  make(text: string, ec: Ec, border: number): Mat {
    if (!text) {
      throw new Error("Input text must not be empty.");
    }
    if (!Number.isInteger(border) || border < 4) {
      throw new Error("QR quiet zone must be at least 4 modules.");
    }

    const qr = QRCode.create(text, { errorCorrectionLevel: ec });
    const src = qr.modules.size;
    const size = src + border * 2;
    const mat = new Mat(size, size);

    for (let y = 0; y < src; y += 1) {
      for (let x = 0; x < src; x += 1) {
        if (qr.modules.get(x, y) === 1) {
          mat.set(x + border, y + border);
        }
      }
    }

    return mat;
  }
}
