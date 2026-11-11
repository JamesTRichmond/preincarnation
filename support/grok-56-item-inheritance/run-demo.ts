import { audit } from "./src/read.ts";
import { playThrough, runRepeatedDeaths } from "./src/simulator.ts";
import { STORIES } from "./src/stories.ts";
import { simulateStory } from "./src/apply.ts";

const played = playThrough();
const repeated = runRepeatedDeaths();
const storyNotes = STORIES.map((story) => {
  const sim = simulateStory(story);
  return `${story.storyId} owner=${sim.final?.ownership.ownerId ?? "missing"} denied=${sim.denied.length}`;
});

const checked = audit(played.world);
console.log("Return Ledger demonstration");
console.log(`year ${played.world.calendarYear} · lives completed ${played.world.lives.length} · audit ${checked.ok ? "ok" : "FAILED"}`);
for (const entry of played.log) {
  console.log(`\n${entry.title}`);
  for (const line of entry.lines) console.log(`  ${line}`);
}
console.log("\nRepeated deaths");
for (const report of repeated.reports) {
  console.log(
    `  death ${report.deathYear} → ${report.returnYear} era ${report.eraIndex} principal ${report.principalEra} erased ${report.erasedInstanceIds.length}`,
  );
}
console.log(`\n${STORIES.length} stories`);
for (const line of storyNotes) console.log(`  ${line}`);
if (!checked.ok) {
  console.error(checked.errors.join("\n"));
  process.exitCode = 1;
}
