import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { auditLoose } from "./audit.ts";
import type { Failure } from "./types.ts";

export const EXPECTED_PACKS = [
  "external:objects",
  "external:equipment",
  "external:relics",
  "external:provisions",
  "external:cards",
  "external:food",
  "external:decorations",
  "external:evidence",
] as const;

const SKIP = new Set(["node_modules", "fixtures", "generated", "patches", "dist", ".git"]);

export interface FoundPack {
  packId: string;
  path: string;
  items: number;
  failures: Failure[];
}

export interface ScanResult {
  importedItems: number;
  importedPacks: { packId: string; path: string; items: number }[];
  missingPacks: string[];
  scannedPaths: string[];
  extraFailures: Failure[];
  filesSeen: string[];
}

function walk(dir: string, depth: number, out: string[]): void {
  if (depth < 0) return;
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, depth - 1, out);
    else if (entry.endsWith(".json")) out.push(full);
  }
}

export function scanPacks(root = process.cwd()): ScanResult {
  const files: string[] = [];
  const scannedPaths = [join(root, "support"), join(root, "artifacts"), join(root, "src")];
  for (const dir of scannedPaths) walk(dir, 5, files);
  const importedPacks: ScanResult["importedPacks"] = [];
  const extraFailures: Failure[] = [];
  const foundIds = new Set<string>();
  for (const file of files) {
    if (file.includes(`${join("support", "grok-57-loot-validation", "fixtures")}`)) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object" || !("packId" in parsed) || !("items" in parsed))
      continue;
    const pack = parsed as { packId?: unknown; items?: unknown };
    if (typeof pack.packId !== "string" || !Array.isArray(pack.items)) continue;
    if (pack.packId === "fixture:broken") continue;
    foundIds.add(pack.packId);
    const failures: Failure[] = [];
    for (const item of pack.items) failures.push(...auditLoose(item));
    importedPacks.push({
      packId: pack.packId,
      path: relative(root, file),
      items: pack.items.length,
    });
    extraFailures.push(...failures);
  }
  return {
    importedItems: importedPacks.reduce((sum, pack) => sum + pack.items, 0),
    importedPacks,
    missingPacks: EXPECTED_PACKS.filter((id) => !foundIds.has(id)),
    scannedPaths,
    extraFailures,
    filesSeen: files.map((file) => relative(root, file)),
  };
}
