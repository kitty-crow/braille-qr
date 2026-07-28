import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export class Out {
  async save(path: string, data: string): Promise<string> {
    const abs = resolve(path);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, data, "utf8");
    return abs;
  }

  print(data: string): void {
    process.stdout.write(data);
  }
}
