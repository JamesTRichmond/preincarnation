export const PAGE_OPS = new Set(["metricGte", "metricLte", "metricEquals", "metricOneOf", "textAbsent"]);

export function needsSeam(scenario) {
  return (scenario.assertions || []).some((assertion) => !PAGE_OPS.has(assertion.op));
}

export function releaseSeamBlock(execution, scenario) {
  if (execution?.blockedReason && !needsSeam(scenario)) {
    execution.seamNote = execution.blockedReason;
    execution.blockedReason = null;
  }
  return execution;
}

