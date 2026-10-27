import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

async function walkFiles(dir, out) {
  if (!existsSync(dir)) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "support") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkFiles(full, out);
    else out.push(full);
  }
}

export async function collectRevision(workspace) {
  const files = [];
  for (const root of ["src", "public", "scripts", "server"]) {
    await walkFiles(path.join(workspace, root), files);
  }
  for (const file of ["package.json", "package-lock.json", "vite.config.ts", "tsconfig.json", "AGENTS.project.md"]) {
    const full = path.join(workspace, file);
    if (existsSync(full)) files.push(full);
  }
  files.sort();
  const hash = createHash("sha256");
  for (const file of files) {
    const relative = path.relative(workspace, file);
    const info = await stat(file);
    hash.update(relative);
    hash.update(String(info.size));
    if (info.size <= 2_000_000) hash.update(await readFile(file));
  }
  let git = null;
  try {
    git = execSync("git rev-parse HEAD", { cwd: workspace, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    git = null;
  }
  return {
    capturedAt: new Date().toISOString(),
    gitHead: git,
    contentSha256: hash.digest("hex"),
    hashedFiles: files.length,
    hostname: os.hostname(),
    node: process.version,
    note: git
      ? "git HEAD plus content hash"
      : "No git repository. contentSha256 is the build revision for this workspace snapshot.",
  };
}
