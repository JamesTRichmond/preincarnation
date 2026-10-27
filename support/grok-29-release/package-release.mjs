#!/usr/bin/env node
/**
 * Package the pinned PREINCARNATION commit as a web release.
 * Does not deploy, sign, or publish.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { bootGuardSource } from "./lib/boot-guard.mjs";
import { applyVercelOutputHeaders, auditAssetReferences, rewriteTreeAssetUrls } from "./lib/cache-policy.mjs";
import { SOURCE, defaultEngineRoot } from "./lib/engine.mjs";
import { emitSaveContract } from "./lib/emit-save-contract.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE = defaultEngineRoot();
const BUILD_ID = "web-c737e42eb188-save8";
const PACK_NAME = `preincarnation-${BUILD_ID}`;
const STAGE = join(HERE, "dist", PACK_NAME);
const EVIDENCE = join(HERE, "evidence");

function sh(command, args, opts = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...opts });
  return result;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function sha256File(path) {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function requireCommit() {
  const result = sh("git", ["rev-parse", "HEAD"], { cwd: ENGINE });
  const sha = (result.stdout || "").trim();
  if (result.status !== 0 || sha !== SOURCE.commit) {
    throw new Error(`engine commit is ${sha || result.stderr}, expected ${SOURCE.commit}`);
  }
  return sha;
}

function olderThan(version, floor) {
  const left = version.split(".").map((part) => Number(part));
  const right = floor.split(".").map((part) => Number(part));
  for (let i = 0; i < 3; i++) {
    const a = left[i] || 0;
    const b = right[i] || 0;
    if (a !== b) return a < b;
  }
  return false;
}

function readTanstack() {
  const pkg = JSON.parse(
    readFileSync(join(ENGINE, "node_modules/@tanstack/react-start/package.json"), "utf8"),
  );
  return pkg.version;
}

function assertTanstack(version) {
  if (olderThan(version, "1.168.60")) {
    throw new Error(`refusing to package @tanstack/react-start ${version}; need >= 1.168.60`);
  }
}

function applyBootOverlay() {
  const rootFile = join(ENGINE, "src/routes/__root.tsx");
  const text = readFileSync(rootFile, "utf8");
  if (text.includes("preincarnation-boot-guard")) return false;
  const source = bootGuardSource(8);
  const snippet = `<script id="preincarnation-boot-guard" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(source)} }} />`;
  if (!text.includes("<head>")) throw new Error("__root.tsx has no <head>");
  writeFileSync(rootFile, text.replace("<head>", `<head>\n        ${snippet}`));
  return true;
}

function stageStaticPlayerFiles() {
  const releaseDir = join(ENGINE, "public/release");
  mkdirSync(releaseDir, { recursive: true });
  writeFileSync(join(releaseDir, "boot-guard.js"), bootGuardSource(8) + "\n");
  const html = readFileSync(join(HERE, "player/save-desk.html"), "utf8").replaceAll("__BUILD_ID__", BUILD_ID);
  writeFileSync(join(releaseDir, "save-desk.html"), html);
  cpSync(join(HERE, "lib/player-data.mjs"), join(releaseDir, "player-data.mjs"));
  emitSaveContract(ENGINE, join(releaseDir, "engine"));
}

function findOutput(root) {
  const candidates = [join(root, ".vercel/output"), join(root, ".output"), join(root, "dist")];
  return candidates.find((path) => existsSync(path)) ?? null;
}

function findStatic(output) {
  const candidates = [join(output, "static"), join(output, "public"), output];
  return candidates.find((path) => existsSync(path)) ?? output;
}

function scanSourceCache() {
  const roots = ["src", "public", "server", "scripts"].map((dir) => join(ENGINE, dir));
  const workers = [];
  const sheets = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const path of walk(root)) {
      if (path.includes(`${join("node_modules")}`)) continue;
      if (!/\.(mjs|js|ts|tsx|html|json)$/.test(path)) continue;
      if (statSync(path).size > 2_000_000) continue;
      const text = readFileSync(path, "utf8");
      if (/serviceWorker\.register|navigator\.serviceWorker/.test(text)) {
        workers.push(relative(ENGINE, path));
      }
      for (const match of text.matchAll(/["'`](\/game\/[^"'`]+\.(?:png|gif|jpg|webp))(?:\?[^"'`]*)?/g)) {
        sheets.push({ file: relative(ENGINE, path), url: match[0].slice(1, -1) });
      }
    }
  }
  return {
    serviceWorkerRegistrations: workers,
    pwa: "manifest and install tutorial only; cache-control no-cache on those responses; no precache",
    spriteUrls: sheets,
  };
}

function writeChecksums(root) {
  const files = walk(root)
    .map((path) => relative(root, path))
    .filter((path) => path !== "SHA256SUMS")
    .sort();
  const lines = files.map((path) => `${sha256File(join(root, path))}  ${path}`);
  writeFileSync(join(root, "SHA256SUMS"), lines.join("\n") + "\n");
}

function main() {
  mkdirSync(EVIDENCE, { recursive: true });
  const sha = requireCommit();
  const tanstack = readTanstack();
  assertTanstack(tanstack);
  const cacheBefore = scanSourceCache();
  writeFileSync(join(EVIDENCE, "cache-inspection-source.json"), JSON.stringify(cacheBefore, null, 2) + "\n");
  if (cacheBefore.serviceWorkerRegistrations.length) {
    throw new Error("service worker found in engine; packaging would need a different cache plan");
  }

  const overlay = applyBootOverlay();
  stageStaticPlayerFiles();
  const diff = sh("git", ["diff", "--", "src/routes/__root.tsx"], { cwd: ENGINE });
  writeFileSync(join(EVIDENCE, "boot-overlay.diff"), diff.stdout || "");

  const buildLog = join(EVIDENCE, "build.log");
  const build = sh("npm", ["run", "build"], {
    cwd: ENGINE,
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
    maxBuffer: 64 * 1024 * 1024,
  });
  writeFileSync(buildLog, `${build.stdout || ""}\n${build.stderr || ""}`);
  if (build.status !== 0) {
    writeFileSync(
      join(EVIDENCE, "package-result.json"),
      JSON.stringify({ ok: false, step: "build", status: build.status, tanstack, sha }, null, 2) + "\n",
    );
    throw new Error(`build failed with status ${build.status}; see evidence/build.log`);
  }

  const output = findOutput(ENGINE);
  if (!output) throw new Error("build produced no .vercel/output, .output, or dist");
  rmSync(STAGE, { recursive: true, force: true });
  mkdirSync(STAGE, { recursive: true });
  const stagedOutput = join(STAGE, "web-output");
  cpSync(output, stagedOutput, { recursive: true });

  const rewritten = rewriteTreeAssetUrls(stagedOutput, BUILD_ID);
  const audit = auditAssetReferences(stagedOutput, BUILD_ID);
  writeFileSync(join(EVIDENCE, "cache-audit.json"), JSON.stringify({ rewritten, audit }, null, 2) + "\n");
  if (audit.workers.length || audit.stale.length) {
    throw new Error("packaged output still has a service worker or unversioned /game asset URL");
  }

  const config = join(stagedOutput, "config.json");
  if (existsSync(config)) applyVercelOutputHeaders(config, BUILD_ID);

  const staticDir = findStatic(stagedOutput);
  const manifest = {
    product: "PREINCARNATION",
    channel: "web",
    buildId: BUILD_ID,
    packagedFromCommitDate: SOURCE.commitDate,
    source: SOURCE,
    nitroPreset: "vercel",
    serviceWorker: false,
    offlineShell: false,
    save: {
      key: "preincarnation.save.v1",
      backupKey: "preincarnation.save.v1.bak",
      version: 8,
      minReadable: 1,
      maxReadable: 8,
      deckDatabase: "preincarnation.deck.v1",
      deckStore: "files",
      rescueKey: "preincarnation.release.rescue",
      premigrationKey: "preincarnation.save.v1.premigration",
      futureKey: "preincarnation.save.v1.future",
    },
    assetQuery: `b=${BUILD_ID}`,
    securityOverlay: {
      "@tanstack/react-start": tanstack,
      upstreamLock: "1.168.50",
      reason: "Committed lock resolves 1.168.50, which is below 1.168.60 (CVE-2026-102989). This package used the patched toolchain already installed for the build. npm ci cannot apply the committed lock on npm 10.9.9.",
    },
    bootOverlayApplied: overlay,
    output: relative(STAGE, stagedOutput),
  };
  const manifestText = JSON.stringify(manifest, null, 2) + "\n";
  writeFileSync(join(STAGE, "release-manifest.json"), manifestText);
  writeFileSync(join(staticDir, "release-manifest.json"), manifestText);
  const buildJson = {
    product: "PREINCARNATION",
    buildId: BUILD_ID,
    commit: sha,
    saveVersion: 8,
    channel: "web",
  };
  writeFileSync(join(STAGE, "BUILD.json"), JSON.stringify(buildJson, null, 2) + "\n");
  writeFileSync(join(staticDir, "BUILD.json"), JSON.stringify(buildJson, null, 2) + "\n");
  cpSync(join(HERE, "PLAYER.md"), join(STAGE, "PLAYER.md"));
  cpSync(join(HERE, "UNSUPPORTED.md"), join(STAGE, "UNSUPPORTED.md"));
  writeChecksums(STAGE);

  const tarPath = join(HERE, "dist", `${PACK_NAME}.tar.gz`);
  rmSync(tarPath, { force: true });
  const tar = sh("tar", [
    "--sort=name",
    "--mtime=2026-09-11 20:48:09",
    "--owner=0",
    "--group=0",
    "--numeric-owner",
    "-C",
    join(HERE, "dist"),
    "-czf",
    tarPath,
    PACK_NAME,
  ]);
  if (tar.status !== 0) throw new Error(tar.stderr || "tar failed");
  const tarHash = sha256File(tarPath);
  writeFileSync(join(HERE, "dist", `${PACK_NAME}.tar.gz.sha256`), `${tarHash}  ${PACK_NAME}.tar.gz\n`);
  writeFileSync(
    join(EVIDENCE, "package-result.json"),
    JSON.stringify(
      {
        ok: true,
        buildId: BUILD_ID,
        commit: sha,
        tanstack,
        output,
        tar: tarPath,
        tarSha256: tarHash,
        rewritten,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify({ ok: true, tar: tarPath, tarSha256: tarHash, buildId: BUILD_ID }));
}

main();
