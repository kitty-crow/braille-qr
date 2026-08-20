const BLANK = "\u2800";

export class Code {
  readonly lines: readonly string[];
  readonly cols: number;
  readonly rows: number;

  constructor(lines: readonly string[]) {
    if (lines.length === 0) {
      throw new Error("Unicode QR code must contain at least one row.");
    }

    this.cols = Math.max(...lines.map((line) => [...line].length));
    this.rows = lines.length;
    this.lines = lines.map((line) => this.pad(line));
  }

  text(): string {
    return this.lines.join("\n");
  }

  chars(): readonly (readonly string[])[] {
    return this.lines.map((line) => [...line]);
  }

  private pad(line: string): string {
    const len = [...line].length;
    return len === this.cols ? line : line + BLANK.repeat(this.cols - len);
  }
}
