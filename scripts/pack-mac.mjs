import { execFileSync } from "node:child_process";
import { createWriteStream, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const electronPackage = JSON.parse(readFileSync(path.join(root, "node_modules/electron/package.json"), "utf8"));
const appPackage = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const version = electronPackage.version;
const release = path.join(root, "release");
const cache = path.join(release, "cache");

mkdirSync(cache, { recursive: true });

async function download(url, destination) {
  if (existsSync(destination)) return;
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
}

function rewritePlist(plist, appVersion) {
  return plist
    .replace(
      /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
      "$1Hardware Patriots$2",
    )
    .replace(/(<key>CFBundleName<\/key>\s*<string>)[^<]*(<\/string>)/, "$1Hardware Patriots$2")
    .replace(/(<key>CFBundleExecutable<\/key>\s*<string>)[^<]*(<\/string>)/, "$1Hardware Patriots$2")
    .replace(
      /(<key>CFBundleIdentifier<\/key>\s*<string>)[^<]*(<\/string>)/,
      "$1com.hardwarepatriots.spoolshelf$2",
    )
    .replace(
      /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
      `$1${appVersion}$2`,
    )
    .replace(/(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${appVersion}$2`);
}

for (const arch of ["x64", "arm64"]) {
  const zipName = `electron-v${version}-darwin-${arch}.zip`;
  const zipPath = path.join(cache, zipName);
  const url = `https://github.com/electron/electron/releases/download/v${version}/${zipName}`;
  process.stdout.write(`Fetching ${zipName}\n`);
  await download(url, zipPath);

  const stage = path.join(release, `mac-stage-${arch}`);
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage);
  execFileSync("unzip", ["-q", zipPath, "-d", stage]);

  const appPath = path.join(stage, "Hardware Patriots.app");
  execFileSync("mv", [path.join(stage, "Electron.app"), appPath]);
  execFileSync("mv", [
    path.join(appPath, "Contents", "MacOS", "Electron"),
    path.join(appPath, "Contents", "MacOS", "Hardware Patriots"),
  ]);

  const resources = path.join(appPath, "Contents", "Resources");
  rmSync(path.join(resources, "default_app.asar"), { force: true });
  const bundled = path.join(resources, "app");
  mkdirSync(path.join(bundled, "electron"), { recursive: true });
  cpSync(path.join(root, "electron"), path.join(bundled, "electron"), { recursive: true });
  cpSync(path.join(root, "out"), path.join(bundled, "out"), { recursive: true });
  writeFileSync(
    path.join(bundled, "package.json"),
    JSON.stringify({ name: appPackage.name, version: appPackage.version, main: "electron/main.cjs" }, null, 2),
  );

  const icns = path.join(root, "assets", "icon.icns");
  if (existsSync(icns)) cpSync(icns, path.join(resources, "electron.icns"));

  const plistPath = path.join(appPath, "Contents", "Info.plist");
  writeFileSync(plistPath, rewritePlist(readFileSync(plistPath, "utf8"), appPackage.version));

  const outZip = path.join(release, `Hardware-Patriots-${appPackage.version}-mac-${arch}.zip`);
  rmSync(outZip, { force: true });
  execFileSync("zip", ["-qry", outZip, "Hardware Patriots.app"], { cwd: stage });
  rmSync(stage, { recursive: true, force: true });
  process.stdout.write(`Wrote ${outZip}\n`);
}
