import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initialState, playerFacingText, reduce } from "./logic.ts";
import { runChecks } from "./measure.ts";
import { SECRET_STRINGS } from "./secrets.ts";

const root = dirname(fileURLToPath(import.meta.url));

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else if (/\.(ts|tsx|css)$/.test(entry)) files.push(path);
  }
  return files;
}

const checks = runChecks();
for (const check of checks) {
  assert.equal(check.pass, true, `${check.name}: ${check.detail}`);
}

let state = initialState();
let facing = playerFacingText(state);
for (const inst of state.instances) {
  state = reduce(state, { type: "inspect", id: inst.instanceId }).state;
}
facing += `\n${playerFacingText(state)}`;
for (const secret of SECRET_STRINGS) {
  assert.equal(facing.includes(secret), false, `player text leaked: ${secret}`);
}

for (const file of walk(root)) {
  if (file.endsWith(`${join("support", "grok-54-inventory", "secrets.ts")}`) || file.endsWith("secrets.ts")) {
    continue;
  }
  const source = readFileSync(file, "utf8");
  for (const secret of SECRET_STRINGS) {
    assert.equal(source.includes(secret), false, `${file} contains a withheld line`);
  }
}

console.log(
  checks
    .map((check) => `${check.pass ? "pass" : "fail"}\t${check.name}\t${check.detail}`)
    .join("\n"),
);
