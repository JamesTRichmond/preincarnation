import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectInventory } from "./lib/inventory.mjs";
import { probeHttp } from "./lib/http-probe.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(here, "../..");
const baseUrl = process.argv.includes("--base-url")
  ? process.argv[process.argv.indexOf("--base-url") + 1]
  : "http://127.0.0.1:8080/";

const inventory = await collectInventory(workspace);
const http = await probeHttp(baseUrl);
const playable = Boolean(http.ok && inventory.sourceLooksLikeGame);
const report = {
  playable,
  baseUrl,
  http,
  routesDir: inventory.routesDir,
  startupScript: inventory.startupScript,
  markerTotal: inventory.markerTotal,
  signalHits: inventory.signalHits,
  startedDevServer: false,
  reason: playable
    ? "A responding origin and game markers were found. Run run-acceptance.mjs to exercise scenarios."
    : "Refusing to start the shared dev server. No PREINCARNATION client is in src/ or public/, and this launcher must not scaffold or modify the app.",
};
await mkdir(path.join(here, "evidence"), { recursive: true });
await writeFile(path.join(here, "evidence", "launch-probe.json"), JSON.stringify(report, null, 2));
console.log(report.reason);
console.log(`playable=${playable} http=${http.status} error=${http.error} markers=${inventory.markerTotal}`);
process.exit(playable ? 0 : 1);
