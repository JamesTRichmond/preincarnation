import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { requirements } from "../requirements/requirements.mjs";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;");
}

function countBy(results, key) {
  const counts = {};
  for (const result of results) {
    const value = result[key];
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

export async function writeReports({ outDir, revision, inventory, http, inspection, discovery, rows, platformNote }) {
  const evidenceDir = path.join(outDir, "evidence");
  const reportDir = path.join(outDir, "reports");
  const resultDir = path.join(evidenceDir, "results");
  const defectDir = path.join(evidenceDir, "defects");
  const shotDir = path.join(evidenceDir, "screenshots");
  const historyDir = path.join(evidenceDir, "history");
  await mkdir(resultDir, { recursive: true });
  await mkdir(defectDir, { recursive: true });
  await mkdir(shotDir, { recursive: true });
  await mkdir(reportDir, { recursive: true });
  await mkdir(historyDir, { recursive: true });

  let previous = null;
  try {
    previous = JSON.parse(await readFile(path.join(evidenceDir, "summary.json"), "utf8"));
    const stamp = String(previous.executedAt || "previous").replace(/[:.]/g, "-");
    await writeFile(path.join(historyDir, `${stamp}.json`), JSON.stringify(previous, null, 2));
  } catch {
    previous = null;
  }

  const byStatus = countBy(rows, "status");
  const byImplementation = countBy(rows, "implementation");
  const areas = countAreas(rows);
  const defects = [];
  let defectNumber = 1;
  for (const row of rows) {
    if (row.status !== "FAIL") continue;
    const id = `DEF-${String(defectNumber).padStart(3, "0")}`;
    defectNumber += 1;
    defects.push({
      id,
      scenarioId: row.scenario.id,
      title: row.scenario.id === "ACC-001" ? "Playable PREINCARNATION client is not available" : row.scenario.title,
      severity: row.scenario.severity || "major",
      area: row.scenario.area,
      revision: revision.contentSha256,
      gitHead: revision.gitHead,
      prerequisites: row.scenario.prerequisites,
      steps: row.scenario.steps,
      expected: row.scenario.expected,
      observed: row.observed,
      evidence: [
        ...new Set([
          ...row.evidence,
          `support/grok-10-acceptance/evidence/results/${row.scenario.id}.json`,
          `support/grok-10-acceptance/evidence/defects/${id}.json`,
        ]),
      ],
    });
    row.defectId = id;
  }

  await writeFile(path.join(evidenceDir, "revision.json"), JSON.stringify(revision, null, 2));
  await writeFile(path.join(evidenceDir, "inventory.json"), JSON.stringify(inventory, null, 2));
  await writeFile(path.join(evidenceDir, "http-probe.json"), JSON.stringify(http, null, 2));
  await writeFile(
    path.join(evidenceDir, "browser.json"),
    JSON.stringify(
      {
        launched: Boolean(inspection?.launched),
        playable: Boolean(inspection?.playable),
        seam: Boolean(inspection?.seam),
        markers: Boolean(inspection?.markers),
        title: inspection?.title || null,
        error: inspection?.error || null,
        consoleErrors: inspection?.consoleErrors || [],
        screenshot: inspection?.screenshot || null,
        physicalDevice: false,
        emulation: inspection?.emulation || "Browser was not launched. No phone and no emulated viewport was used as a test result.",
      },
      null,
      2,
    ),
  );
  if (!inspection?.screenshot) {
    await writeFile(
      path.join(shotDir, "README.txt"),
      [
        "No screenshot was captured.",
        "The browser was not launched because no playable PREINCARNATION URL responded.",
        "Chromium viewport emulation is not physical-phone testing and was not used as a substitute.",
        "",
      ].join("\n"),
    );
  }

  const summary = {
    executedAt: revision.capturedAt,
    revision: revision.contentSha256,
    gitHead: revision.gitHead,
    executionMode: "live-probe",
    simulatedGameplayIncluded: false,
    physicalDevice: false,
    total: rows.length,
    byStatus,
    byImplementation,
    byArea: areas,
    comparedWith: previous?.executedAt || null,
    statusDelta: diffCounts(previous?.byStatus, byStatus),
    defects: defects.map((defect) => defect.id),
    platformNote,
    staticObservations: {
      note: inventory.forbiddenNote,
      forbiddenHits: inventory.forbiddenHits || {},
    },
  };
  await writeFile(path.join(evidenceDir, "summary.json"), JSON.stringify(summary, null, 2));

  for (const row of rows) {
    const artifact = {
      id: row.scenario.id,
      title: row.scenario.title,
      area: row.scenario.area,
      requirementIds: row.scenario.requirementIds,
      status: row.status,
      implementation: row.implementation,
      severity: row.scenario.severity,
      prerequisites: row.scenario.prerequisites,
      steps: row.scenario.steps,
      expected: row.scenario.expected,
      observed: row.observed,
      notes: row.scenario.notes,
      blockedBy: row.blockedBy,
      defectId: row.defectId || null,
      evidence: row.evidence,
      failures: row.failures || [],
    };
    await writeFile(path.join(resultDir, `${row.scenario.id}.json`), JSON.stringify(artifact, null, 2));
  }
  for (const defect of defects) {
    await writeFile(path.join(defectDir, `${defect.id}.json`), JSON.stringify(defect, null, 2));
  }

  const report = {
    summary,
    probe: discoveryPublic(discovery, http, inventory),
    results: rows.map((row) => ({
      id: row.scenario.id,
      title: row.scenario.title,
      area: row.scenario.area,
      requirementIds: row.scenario.requirementIds,
      status: row.status,
      implementation: row.implementation,
      prerequisites: row.scenario.prerequisites,
      steps: row.scenario.steps,
      expected: row.scenario.expected,
      observed: row.observed,
      notes: row.scenario.notes,
      blockedBy: row.blockedBy,
      defectId: row.defectId || null,
      evidence: row.evidence,
    })),
    defects,
  };
  await writeFile(path.join(reportDir, "acceptance-report.json"), JSON.stringify(report, null, 2));
  await writeFile(path.join(reportDir, "verdict.md"), renderVerdict(report, platformNote));
  await writeFile(path.join(reportDir, "acceptance-report.md"), renderMarkdown(report, platformNote));
  await writeFile(path.join(reportDir, "requirement-matrix.md"), renderMatrix(report));
  await writeFile(path.join(reportDir, "defects.md"), renderDefects(defects, revision));
  await writeFile(path.join(reportDir, "acceptance.junit.xml"), renderJUnit(rows));
  return { summary, defects };
}

function diffCounts(before = {}, after = {}) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const delta = {};
  for (const key of keys) delta[key] = (after[key] || 0) - (before[key] || 0);
  return delta;
}

function countAreas(rows) {
  const areas = {};
  for (const row of rows) {
    const area = row.scenario.area;
    if (!areas[area]) areas[area] = { PASS: 0, FAIL: 0, BLOCKED: 0, "NOT IMPLEMENTED": 0 };
    areas[area][row.status] = (areas[area][row.status] || 0) + 1;
  }
  return areas;
}

function renderVerdict(report, platformNote) {
  const lines = ["# PREINCARNATION verdict", ""];
  const failed = report.summary.byStatus.FAIL || 0;
  const blocked = report.summary.byStatus.BLOCKED || 0;
  const passed = report.summary.byStatus.PASS || 0;
  lines.push(
    passed === 0 && !report.probe.playable
      ? "No playable client was found. Nothing in this run is a gameplay pass."
      : `Playable surface: ${report.probe.playable}. Pass ${passed}, fail ${failed}, blocked ${blocked}.`,
  );
  lines.push("");
  lines.push(`Revision \`${report.summary.revision}\`. Git: ${report.summary.gitHead || "none"}. Captured ${report.summary.executedAt}.`);
  lines.push("Live probe only. Simulated gameplay is not included. No physical phone was used.");
  lines.push("");
  lines.push("| Runtime status | Count | Change vs previous |");
  lines.push("| --- | ---: | ---: |");
  for (const status of ["PASS", "FAIL", "BLOCKED"]) {
    const delta = report.summary.statusDelta?.[status] || 0;
    const change = report.summary.comparedWith ? (delta > 0 ? `+${delta}` : String(delta)) : "n/a";
    lines.push(`| ${status} | ${report.summary.byStatus[status] || 0} | ${change} |`);
  }
  lines.push("");
  lines.push("| Implementation | Count |");
  lines.push("| --- | ---: |");
  for (const [key, value] of Object.entries(report.summary.byImplementation || {})) {
    lines.push(`| ${key} | ${value} |`);
  }
  lines.push("");
  lines.push("Every blocked row is also NOT IMPLEMENTED in the source scan. That is not a pass.");
  lines.push("");
  lines.push("## By area");
  lines.push("");
  lines.push("| Area | PASS | FAIL | BLOCKED |");
  lines.push("| --- | ---: | ---: | ---: |");
  for (const [area, counts] of Object.entries(report.summary.byArea || {})) {
    lines.push(`| ${area} | ${counts.PASS || 0} | ${counts.FAIL || 0} | ${counts.BLOCKED || 0} |`);
  }
  lines.push("");
  lines.push("## Defects");
  lines.push("");
  if (!report.defects.length) lines.push("No FAIL results.");
  for (const defect of report.defects) {
    lines.push(`- **${defect.id}** (${defect.severity}): ${defect.title}. Observed: ${defect.observed}`);
  }
  lines.push("");
  lines.push("## Static observations");
  lines.push("");
  lines.push(report.summary.staticObservations?.note || "");
  lines.push("");
  for (const [token, count] of Object.entries(report.summary.staticObservations?.forbiddenHits || {})) {
    lines.push(`- \`${token}\`: ${count}`);
  }
  lines.push("");
  lines.push("## Other suites");
  lines.push("");
  lines.push(platformNote);
  lines.push("");
  lines.push("Full steps, expected results, and observed results: [acceptance-report.md](acceptance-report.md).");
  lines.push("Requirement map: [requirement-matrix.md](requirement-matrix.md).");
  lines.push("");
  return lines.join("\n");
}

function discoveryPublic(discovery, http, inventory) {
  return {
    playable: discovery.playable,
    seam: discovery.seam,
    probeSummary: discovery.probeSummary,
    httpStatus: http.status,
    httpError: http.error,
    routesDir: inventory.routesDir,
    startupScript: inventory.startupScript,
    markerTotal: inventory.markerTotal,
    signalHits: inventory.signalHits,
  };
}

function renderMarkdown(report, platformNote) {
  const lines = [];
  lines.push("# PREINCARNATION acceptance report");
  lines.push("");
  lines.push(`Revision \`${report.summary.revision}\`. Git: ${report.summary.gitHead || "none"}.`);
  lines.push(`Executed: ${report.summary.executedAt}. Mode: live probe. Simulated gameplay results are not included.`);
  lines.push("Browser emulation was not used as a phone test. No physical device was attached.");
  lines.push("One-page result: [verdict.md](verdict.md).");
  lines.push("");
  lines.push("## By area");
  lines.push("");
  lines.push("| Area | PASS | FAIL | BLOCKED |");
  lines.push("| --- | ---: | ---: | ---: |");
  for (const [area, counts] of Object.entries(report.summary.byArea || {})) {
    lines.push(`| ${area} | ${counts.PASS || 0} | ${counts.FAIL || 0} | ${counts.BLOCKED || 0} |`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Status | Count |");
  lines.push("| --- | ---: |");
  for (const status of ["PASS", "FAIL", "BLOCKED"]) {
    lines.push(`| ${status} | ${report.summary.byStatus[status] || 0} |`);
  }
  lines.push("");
  lines.push("| Implementation | Count |");
  lines.push("| --- | ---: |");
  for (const [key, value] of Object.entries(report.summary.byImplementation)) {
    lines.push(`| ${key} | ${value} |`);
  }
  lines.push("");
  lines.push("## Probe");
  lines.push("");
  lines.push(report.probe.probeSummary);
  lines.push("");
  lines.push(`Routes directory: ${report.probe.routesDir}. startup.sh: ${report.probe.startupScript}. Marker hits: ${report.probe.markerTotal}.`);
  lines.push("");
  lines.push("## Platform tests");
  lines.push("");
  lines.push(platformNote);
  lines.push("");
  lines.push("These platform tests are not PREINCARNATION scenarios and are not counted above.");
  lines.push("");
  lines.push("## Scenarios");
  lines.push("");
  for (const row of report.results) {
    lines.push(`### ${row.id} ${row.title}`);
    lines.push("");
    lines.push(`- Status: **${row.status}**`);
    lines.push(`- Implementation: **${row.implementation}**`);
    lines.push(`- Area: ${row.area}`);
    lines.push(`- Requirements: ${row.requirementIds.join(", ")}`);
    if (row.defectId) lines.push(`- Defect: ${row.defectId}`);
    if (row.blockedBy) lines.push(`- Blocked by: ${row.blockedBy}`);
    lines.push(`- Prerequisites: ${row.prerequisites.join(" ")}`);
    lines.push("- Steps:");
    row.steps.forEach((step, index) => lines.push(`  ${index + 1}. ${step}`));
    lines.push(`- Expected: ${row.expected}`);
    lines.push(`- Observed: ${row.observed}`);
    if (row.notes) lines.push(`- Notes: ${row.notes}`);
    lines.push(`- Evidence: ${row.evidence.join(", ")}`);
    lines.push("");
  }
  return lines.join("\n");
}

function renderMatrix(report) {
  const byRequirement = new Map();
  for (const row of report.results) {
    for (const requirementId of row.requirementIds) {
      if (!byRequirement.has(requirementId)) byRequirement.set(requirementId, []);
      byRequirement.get(requirementId).push(row);
    }
  }
  const statements = new Map(requirements.map((requirement) => [requirement.id, requirement.statement]));
  const lines = ["# Requirement to evidence", ""];
  lines.push("| Requirement | Statement | Scenarios | Runtime status | Implementation | Evidence |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const [requirementId, rows] of byRequirement) {
    const statuses = [...new Set(rows.map((row) => row.status))].join(", ");
    const implementation = [...new Set(rows.map((row) => row.implementation))].join(", ");
    const evidence = rows.map((row) => `evidence/results/${row.id}.json`).join(", ");
    lines.push(
      `| ${requirementId} | ${statements.get(requirementId) || ""} | ${rows.map((row) => row.id).join(", ")} | ${statuses} | ${implementation} | ${evidence} |`,
    );
  }
  lines.push("");
  lines.push("Per-scenario prerequisites, steps, expected result, and observed result are in [acceptance-report.md](acceptance-report.md).");
  lines.push("");
  return lines.join("\n");
}

function renderDefects(defects, revision) {
  if (!defects.length) {
    return "# Defects\n\nNo FAIL results. BLOCKED and NOT IMPLEMENTED rows are gaps, not additional defect tickets.\n";
  }
  const lines = ["# Defects", ""];
  for (const defect of defects) {
    lines.push(`## ${defect.id} ${defect.title}`);
    lines.push("");
    lines.push(`- Severity: ${defect.severity}`);
    lines.push(`- Scenario: ${defect.scenarioId}`);
    lines.push(`- Area: ${defect.area}`);
    lines.push(`- Build revision: \`${revision.contentSha256}\``);
    lines.push(`- Git HEAD: ${revision.gitHead || "none (no repository)"}`);
    lines.push(`- Captured: ${revision.capturedAt}`);
    lines.push("- Prerequisites:");
    for (const item of defect.prerequisites) lines.push(`  - ${item}`);
    lines.push("- Reproduction:");
    defect.steps.forEach((step, index) => lines.push(`  ${index + 1}. ${step}`));
    lines.push(`- Expected: ${defect.expected}`);
    lines.push(`- Observed: ${defect.observed}`);
    lines.push(`- Evidence: ${defect.evidence.join(", ")}`);
    lines.push("");
  }
  return lines.join("\n");
}

function renderJUnit(rows) {
  const failures = rows.filter((row) => row.status === "FAIL").length;
  const skipped = rows.filter((row) => row.status === "BLOCKED" || row.status === "NOT IMPLEMENTED").length;
  const cases = rows
    .map((row) => {
      const inner =
        row.status === "FAIL"
          ? `<failure message="${escapeXml(row.observed)}"></failure>`
          : row.status === "PASS"
            ? ""
            : `<skipped message="${escapeXml(row.status + ": " + row.observed)}"></skipped>`;
      return `<testcase name="${escapeXml(row.scenario.id + " " + row.scenario.title)}" classname="preincarnation.acceptance">${inner}</testcase>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><testsuite name="preincarnation-acceptance" tests="${rows.length}" failures="${failures}" skipped="${skipped}">${cases}</testsuite>\n`;
}
