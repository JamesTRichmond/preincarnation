function read(obj, path) {
  if (obj == null) return undefined;
  return String(path)
    .split(".")
    .reduce((current, key) => (current == null ? undefined : current[key]), obj);
}

function targetFor(assertion, execution) {
  if (assertion.at?.sample != null) {
    return execution.samples?.find((sample) => sample.step === assertion.at.sample)?.state;
  }
  if (assertion.at?.checkpoint) return execution.checkpoints?.[assertion.at.checkpoint];
  return execution.after;
}

function check(assertion, execution) {
  if (assertion.op === "delta") {
    const before = read(execution.before, assertion.path);
    const after = read(execution.after, assertion.path);
    if (typeof before !== "number" || typeof after !== "number") {
      return `${assertion.path} delta needs numbers (before=${before}, after=${after})`;
    }
    const delta = after - before;
    if (assertion.equals !== undefined && delta !== assertion.equals) {
      return `${assertion.path} delta ${delta} !== ${assertion.equals}`;
    }
    if (assertion.gte !== undefined && !(delta >= assertion.gte)) {
      return `${assertion.path} delta ${delta} < ${assertion.gte}`;
    }
    if (assertion.lte !== undefined && !(delta <= assertion.lte)) {
      return `${assertion.path} delta ${delta} > ${assertion.lte}`;
    }
    return null;
  }

  if (assertion.op === "equalsCheckpoint" || assertion.op === "gtCheckpoint") {
    const actual = read(execution.after, assertion.path);
    const expected = read(execution.checkpoints?.[assertion.checkpoint], assertion.path);
    if (assertion.op === "gtCheckpoint") {
      if (typeof actual !== "number" || typeof expected !== "number" || !(actual > expected)) {
        return `${assertion.path} ${actual} is not greater than checkpoint ${assertion.checkpoint} ${expected}`;
      }
      return null;
    }
    if (actual !== expected) {
      return `${assertion.path} ${JSON.stringify(actual)} !== checkpoint ${assertion.checkpoint} ${JSON.stringify(expected)}`;
    }
    return null;
  }

  if (assertion.op === "honestCampaign") {
    const dungeons = read(execution.after, "content.dungeons");
    const districts = read(execution.after, "content.districts");
    const eras = read(execution.after, "content.eras");
    const endings = read(execution.after, "content.endings");
    const idLengths = {
      dungeons: read(execution.after, "content.dungeonIds")?.length,
      districts: read(execution.after, "content.districtIds")?.length,
      eras: read(execution.after, "content.eraIds")?.length,
      endings: read(execution.after, "content.endingIds")?.length,
    };
    if (
      dungeons !== idLengths.dungeons ||
      districts !== idLengths.districts ||
      eras !== idLengths.eras ||
      endings !== idLengths.endings
    ) {
      return `content counts do not match id lists (dungeons ${dungeons}/${idLengths.dungeons}, districts ${districts}/${idLengths.districts}, eras ${eras}/${idLengths.eras}, endings ${endings}/${idLengths.endings})`;
    }
    const full = dungeons >= 16 && districts >= 12 && eras >= 6 && endings >= 4;
    const claims = read(execution.after, "ui.claimsFullCampaign");
    if (!full && claims !== false) {
      return `partial campaign presents itself as the full 16/12/6/4 scope (claimsFullCampaign=${JSON.stringify(claims)})`;
    }
    return null;
  }

  const source =
    assertion.op === "metricGte" ||
    assertion.op === "metricLte" ||
    assertion.op === "metricEquals" ||
    assertion.op === "metricOneOf"
      ? execution.metrics || {}
      : targetFor(assertion, execution);
  const actual = read(source, assertion.path);
  if (source == null) return `no state for ${assertion.path}`;

  switch (assertion.op) {
    case "equals":
    case "metricEquals":
      return actual === assertion.value ? null : `${assertion.path} ${JSON.stringify(actual)} !== ${JSON.stringify(assertion.value)}`;
    case "metricOneOf":
      return assertion.values.includes(actual)
        ? null
        : `${assertion.path} ${JSON.stringify(actual)} not in ${JSON.stringify(assertion.values)}`;
    case "notEquals":
      return actual !== assertion.value ? null : `${assertion.path} unexpectedly ${JSON.stringify(actual)}`;
    case "gte":
    case "metricGte":
      return typeof actual === "number" && actual >= assertion.value
        ? null
        : `${assertion.path} ${actual} < ${assertion.value}`;
    case "lte":
    case "metricLte":
      return typeof actual === "number" && actual <= assertion.value
        ? null
        : `${assertion.path} ${actual} > ${assertion.value}`;
    case "close":
      return typeof actual === "number" && Math.abs(actual - assertion.value) <= (assertion.tolerance ?? 0)
        ? null
        : `${assertion.path} ${actual} not within ${assertion.tolerance} of ${assertion.value}`;
    case "unchanged": {
      const before = read(execution.before, assertion.path);
      return actual === before ? null : `${assertion.path} changed from ${JSON.stringify(before)} to ${JSON.stringify(actual)}`;
    }
    case "truthy":
      return actual ? null : `${assertion.path} is not truthy (${JSON.stringify(actual)})`;
    case "falsy":
      return !actual ? null : `${assertion.path} is not falsy (${JSON.stringify(actual)})`;
    case "oneOf":
      return assertion.values.includes(actual)
        ? null
        : `${assertion.path} ${JSON.stringify(actual)} not in ${JSON.stringify(assertion.values)}`;
    case "lengthEquals":
      return actual?.length === assertion.value
        ? null
        : `${assertion.path} length ${actual?.length} !== ${assertion.value}`;
    case "textAbsent": {
      const haystack = String(read(execution.metrics || {}, assertion.path) ?? "");
      return haystack.toLowerCase().includes(String(assertion.value).toLowerCase())
        ? `metrics.${assertion.path} contains ${JSON.stringify(assertion.value)}`
        : null;
    }
    default:
      return `unknown assertion op ${assertion.op}`;
  }
}

export function judge(scenario, execution) {
  if (!execution) {
    return { status: "BLOCKED", observed: "No execution result.", failures: [] };
  }
  if (execution.blockedReason && !execution.error) {
    return { status: "BLOCKED", observed: execution.blockedReason, failures: [] };
  }
  if (execution.error) {
    return { status: "FAIL", observed: String(execution.error), failures: [String(execution.error)] };
  }
  for (const assertion of scenario.assertions || []) {
    if (assertion.op !== "absentWhen") continue;
    if (read(execution.after, assertion.path) === assertion.equals) {
      return {
        status: "NOT IMPLEMENTED",
        observed: `Build reports ${assertion.path}=${JSON.stringify(assertion.equals)}. Feature is not implemented. Not scored as a pass.`,
        failures: [],
      };
    }
  }
  const failures = [];
  for (const assertion of scenario.assertions || []) {
    if (assertion.op === "absentWhen") continue;
    const failure = check(assertion, execution);
    if (failure) failures.push(failure);
  }
  if (failures.length) {
    return { status: "FAIL", observed: failures.join("; "), failures };
  }
  return { status: "PASS", observed: "All assertions held on the live seam state.", failures: [] };
}
