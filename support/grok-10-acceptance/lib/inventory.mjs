import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const FORBIDDEN = ["spotify", "soundcloud", "navigator.geolocation", "getcurrentposition", "watchposition"];
const TEXT_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".css", ".html", ".md", ".svg", ".txt"]);

export const SIGNAL_DICTIONARY = [
  "preincarnation",
  "ellis perch",
  "addison",
  "reincarnation",
  "shrine",
  "dungeon",
  "strange device",
  "off-hand",
  "offhand",
  "quest compass",
  "geolocation",
];

const SKIP_DIR = new Set(["node_modules", ".git", "support", "artifacts", "screenshots"]);

async function walk(dir, files) {
  if (!existsSync(dir)) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIR.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__grok") continue;
      await walk(full, files);
    } else if (TEXT_EXT.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
}

async function htmlTitle(file) {
  try {
    const text = await readFile(file, "utf8");
    const match = text.match(/<title>([^<]*)<\/title>/i);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

export async function collectInventory(workspace) {
  const files = [];
  await walk(path.join(workspace, "src"), files);
  await walk(path.join(workspace, "public"), files);
  const packagePath = path.join(workspace, "package.json");
  if (existsSync(packagePath)) files.push(packagePath);

  const signalHits = Object.fromEntries(SIGNAL_DICTIONARY.map((signal) => [signal, 0]));
  const signalFiles = Object.fromEntries(SIGNAL_DICTIONARY.map((signal) => [signal, []]));
  const forbiddenHits = Object.fromEntries(FORBIDDEN.map((token) => [token, 0]));
  for (const file of files) {
    let text = "";
    try {
      const info = await stat(file);
      if (info.size > 1_000_000) continue;
      text = (await readFile(file, "utf8")).toLowerCase();
    } catch {
      continue;
    }
    for (const signal of SIGNAL_DICTIONARY) {
      const count = text.split(signal).length - 1;
      if (count > 0) {
        signalHits[signal] += count;
        signalFiles[signal].push(path.relative(workspace, file));
      }
    }
    for (const token of FORBIDDEN) {
      const count = text.split(token).length - 1;
      if (count > 0) forbiddenHits[token] += count;
    }
  }

  let packageJson = {};
  try {
    packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  } catch {
    packageJson = {};
  }
  const depNames = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
  ];
  const engineDeps = ["phaser", "pixi.js", "three", "howler", "kaboom"].filter((name) => depNames.includes(name));

  let tanstack = null;
  try {
    tanstack = JSON.parse(
      await readFile(path.join(workspace, "node_modules/@tanstack/react-start/package.json"), "utf8"),
    ).version;
  } catch {
    tanstack = null;
  }

  const artifactNotes = [];
  const artifactDir = path.join(workspace, "artifacts");
  if (existsSync(artifactDir)) {
    const entries = await readdir(artifactDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(artifactDir, entry.name);
      if (entry.isFile() && entry.name.endsWith(".html")) {
        artifactNotes.push({
          path: path.relative(workspace, full),
          title: await htmlTitle(full),
          treatedAsGame: false,
        });
      } else if (entry.isDirectory()) {
        const nested = await readdir(full);
        artifactNotes.push({
          path: path.relative(workspace, full),
          files: nested.length,
          treatedAsGame: false,
        });
      }
    }
  }

  const routesDir = existsSync(path.join(workspace, "src/routes"));
  const startup = existsSync(path.join(workspace, "startup.sh"));
  const markerTotal = Object.values(signalHits).reduce((sum, count) => sum + count, 0);

  return {
    workspace,
    routesDir,
    startupScript: startup,
    scannedFiles: files.map((file) => path.relative(workspace, file)).sort(),
    signalHits,
    signalFiles,
    forbiddenHits,
    forbiddenNote:
      "Forbidden-token counts are source observations only. Zero hits are not a pass of the no-stream, no-geolocation, or no-upload requirements.",
    markerTotal,
    sourceLooksLikeGame: markerTotal > 0,
    dependencies: {
      enginesPresent: engineDeps,
      tanstackReactStart: tanstack,
    },
    artifacts: artifactNotes,
    gameTestFiles: files
      .map((file) => path.relative(workspace, file))
      .filter((file) => /\.(test|spec)\./.test(file) && /game|dungeon|ellis|preincarn/i.test(file)),
  };
}
