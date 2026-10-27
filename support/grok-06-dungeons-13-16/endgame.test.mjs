import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

test("DG13–DG16 graph, endings, and death recovery", () => {
  const result = spawnSync(process.execPath, [join(root, "validate.mjs"), "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /30 passed, 0 failed, 85 rooms/);
  assert.equal(result.stdout.includes("FAIL "), false);
});
