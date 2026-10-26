import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const unpacked = path.join(root, "release", "win-unpacked", "Hardware Patriots.exe");
const setup = path.join(root, "release", "Hardware-Patriots-Setup-0.1.0-win-x64.exe");

if (!existsSync(unpacked)) {
  throw new Error("Windows app is missing. Run electron-builder before packing the setup.");
}

rmSync(setup, { force: true });
execFileSync("makensis", [path.join(root, "scripts", "windows-setup.nsi")], {
  cwd: path.join(root, "scripts"),
  stdio: "inherit",
});

if (!existsSync(setup)) {
  throw new Error("Windows setup was not written.");
}

process.stdout.write(`Wrote ${setup}\n`);
