import { createReadStream, createWriteStream, mkdirSync, readdirSync, rmSync, chmodSync } from "node:fs";
import path from "node:path";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const partsDir = path.join(root, "installers", "parts");
const outDir = path.join(root, "release");

mkdirSync(outDir, { recursive: true });

const groups = new Map();
for (const name of readdirSync(partsDir)) {
  const match = name.match(/^(.*)\.part-\d+$/);
  if (!match) continue;
  const list = groups.get(match[1]) ?? [];
  list.push(name);
  groups.set(match[1], list);
}

for (const [base, parts] of groups) {
  const destination = path.join(outDir, base);
  rmSync(destination, { force: true });
  for (const part of parts.sort()) {
    const output = createWriteStream(destination, { flags: "a" });
    createReadStream(path.join(partsDir, part)).pipe(output);
    await finished(output);
  }
  if (base.endsWith(".AppImage")) chmodSync(destination, 0o755);
  process.stdout.write(`Wrote ${destination}\n`);
}
