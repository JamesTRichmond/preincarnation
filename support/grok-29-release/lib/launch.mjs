/** Package launch journal. Interrupted launches do not migrate or delete saves. */

export function freshJournal(buildId) {
  return {
    active: buildId,
    previous: null,
    launch: "ready",
    interrupted: 0,
  };
}

export function beginLaunch(journal) {
  if (journal.launch === "starting") {
    journal.interrupted += 1;
    return {
      ok: false,
      code: "interrupted",
      message: "Previous launch did not finish. Saves were not migrated or deleted.",
    };
  }
  journal.launch = "starting";
  return { ok: true, code: "starting" };
}

export function completeLaunch(journal) {
  if (journal.launch !== "starting") return { ok: false, code: "not-starting" };
  journal.launch = "ready";
  return { ok: true, code: "ready" };
}

export function acknowledgeInterruption(journal) {
  if (journal.launch !== "starting" || journal.interrupted < 1) {
    return { ok: false, code: "not-interrupted" };
  }
  journal.launch = "ready";
  return { ok: true, code: "acknowledged" };
}

/** Point the journal at the next package. Copies the raw save aside before the engine migrates it. */
export function stageUpdate(journal, storage, saveKey, nextBuildId) {
  if (journal.launch === "starting") return { ok: false, code: "interrupted" };
  if (!nextBuildId || nextBuildId === journal.active) return { ok: false, code: "same-build" };
  const raw = storage.getItem(saveKey);
  if (raw) storage.setItem(saveKey + ".premigration", raw);
  journal.previous = journal.active;
  journal.active = nextBuildId;
  journal.launch = "ready";
  return { ok: true, code: "staged", backedUp: Boolean(raw) };
}

/**
 * Roll back to the previous package. A save newer than that package is restored from the
 * pre-migration snapshot taken by stageUpdate. Without that snapshot the rollback is refused.
 */
export function rollback(journal, storage, saveKey, packages) {
  if (!journal.previous) return { ok: false, code: "no-previous" };
  const target = packages[journal.previous];
  if (!target) return { ok: false, code: "unknown-package" };
  const raw = storage.getItem(saveKey);
  let version = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      version = parsed && typeof parsed.version === "number" ? parsed.version : 1;
    } catch {
      return { ok: false, code: "damaged-live-save" };
    }
  }
  if (version != null && version > target.saveMax) {
    const pre = storage.getItem(saveKey + ".premigration");
    if (!pre) {
      return {
        ok: false,
        code: "incompatible-rollback",
        saveVersion: version,
        supportedMax: target.saveMax,
      };
    }
    let preVersion;
    try {
      const parsed = JSON.parse(pre);
      preVersion = parsed && typeof parsed.version === "number" ? parsed.version : 1;
    } catch {
      return { ok: false, code: "damaged-premigration" };
    }
    if (preVersion > target.saveMax) {
      return {
        ok: false,
        code: "incompatible-rollback",
        saveVersion: preVersion,
        supportedMax: target.saveMax,
      };
    }
    storage.setItem(saveKey + ".forward", raw);
    storage.setItem(saveKey, pre);
  }
  const from = journal.active;
  journal.active = journal.previous;
  journal.previous = from;
  journal.launch = "ready";
  return { ok: true, code: "rolled-back", active: journal.active };
}
