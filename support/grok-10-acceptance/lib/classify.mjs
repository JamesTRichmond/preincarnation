import { judge } from "./assertions.mjs";

export function implementationStatus(scenario, signalHits = {}) {
  const signals = scenario.signals || [];
  const hits = signals.filter((signal) => (signalHits[signal] || 0) > 0);
  if (hits.length === 0) return "NOT IMPLEMENTED";
  return "PRESENT_UNVERIFIED";
}

export function classifyScenario(scenario, discovery, execution = null) {
  const implementation = implementationStatus(scenario, discovery.signalHits);
  const evidence = discovery.evidence || [];
  if (scenario.kind === "availability") {
    if (!discovery.playable) {
      return {
        status: "FAIL",
        implementation: "NOT IMPLEMENTED",
        observed: discovery.probeSummary,
        defect: true,
        blockedBy: null,
        evidence,
      };
    }
    return {
      status: "PASS",
      implementation: "PRESENT",
      observed: discovery.probeSummary,
      defect: false,
      blockedBy: null,
      evidence,
    };
  }
  if (!discovery.playable) {
    return {
      status: "BLOCKED",
      implementation,
      observed: `BLOCKED ${scenario.id} (${scenario.title}): not executed. ${discovery.probeSummary} Source implementation: ${implementation}. Not a pass.`,
      defect: false,
      blockedBy: "DEF-001",
      evidence,
    };
  }
  const judged = judge(scenario, execution);
  return {
    status: judged.status,
    implementation: judged.status === "NOT IMPLEMENTED" ? "NOT IMPLEMENTED" : judged.status === "BLOCKED" ? implementation : "PRESENT",
    observed: judged.observed,
    defect: judged.status === "FAIL",
    blockedBy: judged.status === "BLOCKED" ? "DEF-SEAM" : null,
    evidence,
    failures: judged.failures,
  };
}
