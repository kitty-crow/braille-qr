import { randomBytes } from "node:crypto";

export class Token {
  make(bytes: number): string {
    if (!Number.isInteger(bytes) || bytes < 1) {
      throw new Error("Token size must be a positive integer.");
    }

    // Uppercase hexadecimal permits QR alphanumeric mode.
    return randomBytes(bytes).toString("hex").toUpperCase();
  }
}
