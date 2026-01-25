import fs from "node:fs/promises";

export async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}
