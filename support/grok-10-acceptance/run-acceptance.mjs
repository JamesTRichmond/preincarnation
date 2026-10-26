import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scenarios } from "./scenarios/catalog.mjs";
import { collectInventory } from "./lib/inventory.mjs";
import { collectRevision } from "./lib/revision.mjs";
import { probeHttp } from "./lib/http-probe.mjs";
import { classifyScenario } from "./lib/classify.mjs";
import { closeInspection, inspectPage, runScenario } from "./lib/adapter.mjs";
import { writeReports } from "./lib/report.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(here, "../..");
const outDir = here;

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

async function platformNote() {
  const logPath = path.join(outDir, "evidence", "platform-npm-test.log");
  try {
    const text = await readFile(logPath, "utf8");
    const blocks = [...text.matchAll(/# tests (\d+)\n# suites \d+\n# pass (\d+)\n# fail (\d+)/g)];
    const totals = blocks.reduce(
      (sum, match) => ({
        tests: sum.tests + Number(match[1]),
        pass: sum.pass + Number(match[2]),
        fail: sum.fail + Number(match[3]),
      }),
      { tests: 0, pass: 0, fail: 0 },
    );
    return `Workspace \`npm test\` log at evidence/platform-npm-test.log: ${blocks.length} TAP runs, ${totals.tests} tests, ${totals.pass} pass, ${totals.fail} fail. The suite covers scaffold scripts (brand, auth invariant, preview path), not PREINCARNATION.`;
  } catch {
    return "No platform npm test log was copied into evidence/. Scaffold tests were not treated as game results.";
  }
}

export async function runAcceptance({ baseUrl = "http://127.0.0.1:8080/" } = {}) {
  const revision = await collectRevision(workspace);
  const inventory = await collectInventory(workspace);
  const http = await probeHttp(baseUrl);
  let inspection = null;
  if (http.ok) {
    await mkdir(path.join(outDir, "evidence", "screenshots"), { recursive: true });
    inspection = await inspectPage(baseUrl, path.join(outDir, "evidence", "screenshots"));
  }
  const playable = Boolean(http.ok && inspection?.playable);
  const probeSummary = playable
    ? `Playable PREINCARNATION surface at ${baseUrl}. Title: ${inspection.title || "(none)"}. Seam v1: ${inspection.seam}.`
    : http.ok
      ? `HTTP ${http.status} from ${baseUrl} did not identify PREINCARNATION (title ${JSON.stringify(inspection?.title || "")}, markers ${inspection?.markers}, seam ${inspection?.seam}). Source marker hits: ${inventory.markerTotal}. routesDir=${inventory.routesDir}.`
      : `No playable client. Probe ${baseUrl} failed (${http.error}, HTTP ${http.status}). src/routes exists: ${inventory.routesDir}. startup.sh exists: ${inventory.startupScript}. Game-marker occurrences in src, public, and package.json: ${inventory.markerTotal}.`;

  const discovery = {
    playable,
    seam: Boolean(inspection?.seam),
    probeSummary,
    signalHits: inventory.signalHits,
    evidence: [
      "support/grok-10-acceptance/evidence/inventory.json",
      "support/grok-10-acceptance/evidence/http-probe.json",
      "support/grok-10-acceptance/evidence/revision.json",
      "support/grok-10-acceptance/evidence/browser.json",
    ],
  };

  const rows = [];
  try {
    for (const scenario of scenarios) {
      let execution = null;
      if (playable && inspection?.page) {
        execution = await runScenario(inspection.page, scenario);
        discovery.evidence = [
          ...new Set([
            ...discovery.evidence,
            inspection.screenshot
              ? path.relative(workspace, inspection.screenshot)
              : "support/grok-10-acceptance/evidence/screenshots/README.txt",
          ]),
        ];
      }
      const classified = classifyScenario(scenario, discovery, execution);
      rows.push({
        scenario,
        ...classified,
        evidence: [
          ...new Set([
            ...classified.evidence,
            `support/grok-10-acceptance/evidence/results/${scenario.id}.json`,
          ]),
        ],
      });
    }
  } finally {
    await closeInspection(inspection);
  }

  const written = await writeReports({
    outDir,
    revision,
    inventory,
    http,
    inspection,
    discovery,
    rows,
    platformNote: await platformNote(),
  });
  return { revision, inventory, http, playable, rows, ...written };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const baseUrl = argValue("--base-url", "http://127.0.0.1:8080/");
  const outcome = await runAcceptance({ baseUrl });
  const { byStatus } = outcome.summary;
  console.log(
    JSON.stringify(
      {
        revision: outcome.revision.contentSha256,
        playable: outcome.playable,
        byStatus,
        defects: outcome.defects.map((defect) => defect.id),
      },
      null,
      2,
    ),
  );
  if ((byStatus.FAIL || 0) > 0) process.exit(1);
  if ((byStatus.BLOCKED || 0) > 0 || (byStatus["NOT IMPLEMENTED"] || 0) > 0) process.exit(2);
  process.exit(0);
}
