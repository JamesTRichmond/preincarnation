/**
 * Entry point. Runs the model — not a playtest — and writes results/.
 *   node support/grok-09-combat/sim/index.js
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runValidation, writeReport } from "./validate.js";

const report = runValidation();
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "results");
const paths = writeReport(report, dir);
console.log(report.label);
console.log(report.unit_source);
console.log(
  `trials ${report.enemy_trials.ok}/${report.counts.enemy_trials} minibosses ${report.minibosses.ok}/${report.counts.minibosses} encounters ${report.encounters.ok}/${report.counts.encounters}`,
);
if (report.failures.length) {
  console.log(JSON.stringify(report.failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(paths.mdPath);
}
