/**
 * Seam runner shared by unit tests and the in-page adapter.
 * Must stay free of imports so it can be evaluated inside the page.
 */
export async function executeAgainstSeam(api, script, sleep) {
  const wait = sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  if (!api || typeof api.getState !== "function" || typeof api.dispatch !== "function") {
    return {
      error: null,
      blockedReason: "Test seam window.__PREINCARNATION_TEST__ is not available.",
      before: null,
      after: null,
      samples: [],
      checkpoints: {},
      metrics: {},
    };
  }
  if (api.version !== 1) {
    return {
      error: `seam version ${api.version} is not supported (expected 1)`,
      before: null,
      after: null,
      samples: [],
      checkpoints: {},
      metrics: {},
    };
  }
  const samples = [];
  const checkpoints = {};
  let before = await api.getState();
  for (let i = 0; i < script.length; i++) {
    const step = script[i];
    if (step.type === "wait") {
      await wait(step.ms ?? 0);
    } else if (step.type === "checkpoint") {
      checkpoints[step.name] = await api.getState();
    } else if (step.type === "baseline") {
      before = await api.getState();
    } else {
      const result = await api.dispatch(step);
      if (result && result.error) {
        const after = await api.getState();
        samples.push({ step: i, state: after });
        return { error: result.error, before, after, samples, checkpoints, metrics: {} };
      }
    }
    samples.push({ step: i, state: await api.getState() });
  }
  return {
    error: null,
    before,
    after: await api.getState(),
    samples,
    checkpoints,
    metrics: {},
  };
}
