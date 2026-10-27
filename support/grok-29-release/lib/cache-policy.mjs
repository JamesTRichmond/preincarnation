import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ASSET_RE = /\/game\/[A-Za-z0-9_./-]+\.(?:png|gif|jpg|webp|json)(?:\?[A-Za-z0-9_.=&%-]*)?/g;

export function rewriteAssetUrls(text, buildId) {
  if (!/^[A-Za-z0-9._-]+$/.test(buildId)) throw new Error("buildId has unsafe characters");
  return text.replace(ASSET_RE, (match) => {
    const path = match.split("?")[0];
    return `${path}?b=${buildId}`;
  });
}

const TEXT_EXT = new Set([".js", ".mjs", ".cjs", ".html", ".css", ".json", ".txt", ".webmanifest"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

export function rewriteTreeAssetUrls(root, buildId) {
  let files = 0;
  let replacements = 0;
  for (const path of walk(root)) {
    const ext = path.slice(path.lastIndexOf("."));
    if (!TEXT_EXT.has(ext)) continue;
    if (statSync(path).size > 20_000_000) continue;
    const before = readFileSync(path, "utf8");
    const after = rewriteAssetUrls(before, buildId);
    if (after !== before) {
      replacements += (before.match(ASSET_RE) || []).length;
      writeFileSync(path, after);
      files += 1;
    }
  }
  return { files, replacements };
}

export function isKnownShellRegistration(text) {
  const calls = [...text.matchAll(/serviceWorker\.register\(\s*["'`]([^"'`]+)["'`]/g)].map((match) => match[1]);
  return calls.length > 0 && calls.every((url) => url === "/sw.js");
}

export function auditAssetReferences(root, buildId) {
  const stale = [];
  const workers = [];
  for (const path of walk(root)) {
    const ext = path.slice(path.lastIndexOf("."));
    if (!TEXT_EXT.has(ext)) continue;
    if (statSync(path).size > 20_000_000) continue;
    const text = readFileSync(path, "utf8");
    if (/serviceWorker\.register|navigator\.serviceWorker/.test(text)) {
      workers.push(relative(root, path));
    }
    const matches = text.match(ASSET_RE) || [];
    for (const match of matches) {
      if (!match.endsWith(`?b=${buildId}`)) stale.push({ file: relative(root, path), match });
    }
  }
  return { stale, workers };
}

export function cacheHeaderRoutes(buildId) {
  const immutable = "public, max-age=31536000, immutable";
  const fresh = "no-cache, no-store, must-revalidate";
  return [
    { src: "/release-manifest.json", headers: { "cache-control": fresh }, continue: true },
    { src: "/BUILD.json", headers: { "cache-control": fresh }, continue: true },
    { src: "/release/(.*)", headers: { "cache-control": fresh }, continue: true },
    { src: "/assets/(.*)", headers: { "cache-control": immutable }, continue: true },
    {
      src: "/game/(.*)",
      headers: { "cache-control": immutable },
      continue: true,
      note: `Art URLs in this build are suffixed ?b=${buildId}. Immutable applies per full URL including the query.`,
    },
    { src: "/", headers: { "cache-control": fresh }, continue: true },
  ];
}

export function mergeVercelOutputHeaders(config, buildId) {
  const extra = cacheHeaderRoutes(buildId).map(({ note: _note, ...route }) => route);
  const next = { ...config, routes: [...extra, ...(config.routes || [])] };
  return next;
}

export function applyVercelOutputHeaders(configPath, buildId) {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const next = mergeVercelOutputHeaders(config, buildId);
  writeFileSync(configPath, JSON.stringify(next, null, 2) + "\n");
  return next;
}
