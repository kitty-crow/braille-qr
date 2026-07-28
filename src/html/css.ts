export class Css {
  shadow(px: number): string {
    if (px === 0) {
      return "none";
    }

    const pts = [
      [-px, 0],
      [px, 0],
      [0, -px],
      [0, px],
      [-px, -px],
      [px, -px],
      [-px, px],
      [px, px],
    ] as const;

    return pts
      .map(([x, y]) => `${x.toFixed(3)}px ${y.toFixed(3)}px 0 currentColor`)
      .join(", ");
  }
}
