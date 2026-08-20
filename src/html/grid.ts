import { Code } from "../core/code.js";
import { Esc } from "./esc.js";

export class Grid {
  constructor(private readonly esc = new Esc()) {}

  make(code: Code, justify: boolean): string {
    if (!justify) {
      return `<pre class="qr plain" aria-label="Unicode QR code">${this.esc.html(code.text())}</pre>`;
    }

    const rows = code
      .chars()
      .map((row) => {
        const cells = row
          .map((char) => `<span class="cell">${this.esc.html(char)}</span>`)
          .join("");
        return `<span class="row">${cells}</span>`;
      })
      .join("\n");

    return `<div class="qr fixed" role="img" aria-label="Unicode QR code">${rows}</div>`;
  }
}
