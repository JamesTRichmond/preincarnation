import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { GADGETS } from "./catalog.ts";
import { validatePack } from "./validate.ts";

const SKIP = new Set(["node_modules", ".git", "dist", "artifacts"]);

function walk(dir: string, out: string[]): void {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP.has(name) || name.startsWith(".")) continue;
    const path = join(dir, name);
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (path.includes("grok-68-gadgets")) continue;
      walk(path, out);
      continue;
    }
    if (/\.(json|md|ts|txt)$/.test(name) && /(loot|catalog|item)/i.test(name)) out.push(path);
  }
}

export type DuplicateReport = {
  searched: string[];
  externalCatalogs: string[];
  conclusion: string;
  internal: ReturnType<typeof validatePack>;
  nameCollisionsWithExternal: { gadget: string; file: string; term: string }[];
  note: string;
};

export function scanDuplicates(roots: string[]): DuplicateReport {
  const files: string[] = [];
  for (const root of roots) walk(root, files);
  const external = files.filter((f) => !f.includes("grok-68-gadgets"));
  const hits: DuplicateReport["nameCollisionsWithExternal"] = [];
  for (const file of external) {
    let text = "";
    try {
      text = readFileSync(file, "utf8").toLowerCase();
    } catch {
      continue;
    }
    if (text.length > 2_000_000) continue;
    for (const g of GADGETS) {
      if (text.includes(g.name.toLowerCase())) {
        hits.push({ gadget: g.id, file, term: g.name });
      }
    }
  }
  return {
    searched: roots,
    externalCatalogs: external,
    conclusion: external.length
      ? "EXTERNAL_FILES_FOUND"
      : "NO_EXTERNAL_CATALOG",
    internal: validatePack(),
    nameCollisionsWithExternal: hits,
    note: external.length
      ? "External files with loot-like names were read for name collisions only. This is not the planned 768-item catalog unless one of those files is that catalog."
      : "No loot catalog, item list, or loot JSON was found outside this pack. Comparison with the planned 768-item catalog could not be run. Internal ids, names, and effect signatures were compared. Matching ids were not treated as distinct content.",
  };
}
