import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

export function renderCeoStatus({ sha, saveVersion, when }) {
  return `# PREINCARNATION: CEO Status

_Updated ${when}. Main at \`${sha}\`._

## Health of main (\`${sha}\`)

| Gate | Result |
|---|---|
| SAVE_VERSION | ${saveVersion} |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is ${saveVersion}.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.

## Open work

Player-facing pulls that still conflict with main are not in this tip. Status-only pulls do not change the walk.

This file is rewritten by \`node scripts/write-ceo-status.mjs\`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.
`;
}

function readSaveVersion(root) {
  const src = readFileSync(`${root}/src/game/types.ts`, "utf8");
  const match = src.match(/SAVE_VERSION = (\d+)/);
  if (!match) throw new Error("SAVE_VERSION missing");
  return Number(match[1]);
}

function main() {
  const root = new URL("..", import.meta.url).pathname;
  const sha = execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim();
  const when = new Date().toISOString();
  const body = renderCeoStatus({ sha, saveVersion: readSaveVersion(root), when });
  const path = `${root}/support/ceo/STATUS.md`;
  if (process.argv.includes("--check")) {
    const current = readFileSync(path, "utf8");
    if (!current.includes(`\`${sha}\``) || !current.includes(`SAVE_VERSION | ${readSaveVersion(root)}`)) {
      console.error(`STATUS.md does not match ${sha}`);
      process.exit(1);
    }
    return;
  }
  writeFileSync(path, body);
  console.log(sha);
}

if (process.argv[1] && process.argv[1].endsWith("write-ceo-status.mjs")) main();
