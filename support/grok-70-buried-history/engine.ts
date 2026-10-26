import { CATALOG_BY_ID } from "./catalog/index.ts";
import type {
  ActionResult,
  EraId,
  EvidenceRecord,
  HistoryObject,
  ObjRuntime,
  PackAction,
  PackState,
} from "./types.ts";
import { ERAS } from "./types.ts";

const DESTRUCTIVE = new Set(["destroy", "discard", "burn", "wipe"]);

function blankRuntime(obj: HistoryObject): ObjRuntime {
  return {
    id: obj.id,
    phase: "in-situ",
    inspected: false,
    registered: false,
    restored: false,
    usedCount: 0,
    lineage: null,
    matchesLeft: obj.interaction.useRule === "matches-3" ? 3 : null,
    bellUsed: false,
    dentEased: false,
    initialed: false,
    usedEras: [],
    ephemeralMark: null,
    lastDetail: "",
  };
}

export function createInitialState(
  catalog: readonly HistoryObject[] = [...CATALOG_BY_ID.values()],
): PackState {
  const objects: Record<string, ObjRuntime> = {};
  for (const obj of catalog) objects[obj.id] = blankRuntime(obj);
  return { era: "return", objects, evidence: [], log: [], seq: 0 };
}

function fail(code: string, detail: string): ActionResult {
  return { ok: false, code, detail };
}

function ok(code: string, detail: string): ActionResult {
  return { ok: true, code, detail };
}

function log(state: PackState, action: string, objectId: string | null, result: ActionResult): PackState {
  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    log: [
      ...state.log,
      { at: seq, action, objectId, ok: result.ok, code: result.code, detail: result.detail },
    ],
  };
}

function patchObject(state: PackState, id: string, patch: Partial<ObjRuntime>): PackState {
  const current = state.objects[id];
  if (!current) return state;
  return {
    ...state,
    objects: { ...state.objects, [id]: { ...current, ...patch } },
  };
}

function hasSnapshot(state: PackState, evidenceId: string, snapshotOf: EvidenceRecord["snapshotOf"]): boolean {
  return state.evidence.some((row) => row.evidenceId === evidenceId && row.snapshotOf === snapshotOf);
}

function lock(
  state: PackState,
  obj: HistoryObject,
  snapshotOf: EvidenceRecord["snapshotOf"],
  readable: string,
): PackState {
  if (hasSnapshot(state, obj.evidence.evidenceId, snapshotOf)) return state;
  const row: EvidenceRecord = {
    evidenceId: obj.evidence.evidenceId,
    objectId: obj.id,
    readable,
    registeredOnEra: state.era,
    snapshotOf,
    locked: true,
  };
  return { ...state, evidence: [...state.evidence, row] };
}

function inscriptionIntact(before: PackState, after: PackState): boolean {
  const beforeRows = before.evidence.filter((row) => row.snapshotOf === "inscription");
  return beforeRows.every((row) =>
    after.evidence.some(
      (next) =>
        next.evidenceId === row.evidenceId &&
        next.snapshotOf === "inscription" &&
        next.readable === row.readable &&
        next.locked === true,
    ),
  );
}

export function applyAction(state: PackState, action: PackAction): { state: PackState; result: ActionResult } {
  if (action.action === "setEra") {
    if (!ERAS.includes(action.era)) {
      const result = fail("bad-era", "That is not an era this desk keeps.");
      return { state: log(state, action.action, null, result), result };
    }
    const next: PackState = { ...state, era: action.era as EraId };
    const result = ok("era-set", `The desk is now reading the ${action.era} era. Evidence stays locked.`);
    const logged = log(next, action.action, action.id ?? null, result);
    if (!inscriptionIntact(state, logged)) {
      const refused = fail("campaign-evidence-locked", "Era change tried to alter an inscription and was refused.");
      return { state: log(state, action.action, action.id ?? null, refused), result: refused };
    }
    return { state: logged, result };
  }

  const id = "id" in action ? action.id : "";
  const obj = CATALOG_BY_ID.get(id);
  const runtime = state.objects[id];
  if (!obj || !runtime) {
    const result = fail("unknown-object", "No buried-history object carries that id.");
    return { state: log(state, action.action, id || null, result), result };
  }

  if (DESTRUCTIVE.has(action.action)) {
    const result = fail(
      "campaign-evidence-locked",
      `${obj.evidence.evidenceId} is campaign evidence. ${action.action} will not destroy, discard, burn, or wipe it.`,
    );
    const logged = log(state, action.action, id, result);
    const sameObjects = logged.objects === state.objects;
    const sameEvidence = logged.evidence === state.evidence;
    if (!sameObjects || !sameEvidence) {
      const refused = fail("campaign-evidence-locked", "Destructive action mutated state and was rolled back.");
      return { state: log(state, action.action, id, refused), result: refused };
    }
    return { state: logged, result };
  }

  if (action.action === "eraseWorkingMark") {
    if (!runtime.ephemeralMark) {
      const result = ok("nothing-to-erase", "No working mark is on the slate. Inscriptions are not marks.");
      return { state: log(state, action.action, id, result), result };
    }
    const cleared = patchObject(state, id, { ephemeralMark: null });
    const result = ok("mark-erased", "The working mark is gone. The ferrule stamp and any registered copy remain.");
    return { state: log(cleared, action.action, id, result), result };
  }

  if (action.action === "excavate" || action.action === "recover") {
    if (runtime.phase === "in-hand") {
      const result = fail("already-in-hand", `${obj.name} is already in hand.`);
      return { state: log(state, action.action, id, result), result };
    }
    if (obj.binding !== action.action) {
      const result = fail(
        "wrong-binding",
        `${obj.name} is bound to ${obj.binding}, not ${action.action}.`,
      );
      return { state: log(state, action.action, id, result), result };
    }
    const lifted = patchObject(state, id, { phase: "in-hand" });
    const verb = action.action === "excavate" ? "Excavated" : "Recovered";
    const result = ok("in-hand", `${verb}. ${obj.discovery.authored}`);
    return { state: log(lifted, action.action, id, result), result };
  }

  if (runtime.phase !== "in-hand") {
    const result = fail("still-in-situ", `Use ${obj.binding} before ${action.action}.`);
    return { state: log(state, action.action, id, result), result };
  }

  if (action.action === "inspect") {
    const result = ok("inspected", obj.evidence.readable);
    if (runtime.inspected) {
      return { state: log(state, action.action, id, ok("already-inspected", obj.evidence.readable)), result: ok("already-inspected", obj.evidence.readable) };
    }
    const next = patchObject(state, id, { inspected: true, lastDetail: obj.evidence.readable });
    return { state: log(next, action.action, id, result), result };
  }

  if (!runtime.inspected && action.action !== "restore") {
    const result = fail("not-inspected", "Inspect the object before registering or using it.");
    return { state: log(state, action.action, id, result), result };
  }

  if (action.action === "register") {
    const locked = lock(state, obj, "inscription", obj.evidence.readable);
    const next = patchObject(locked, id, { registered: true });
    const code = hasSnapshot(state, obj.evidence.evidenceId, "inscription") ? "already-registered" : "registered";
    const result = ok(code, `${obj.evidence.evidenceId} is locked. The readable line cannot be removed.`);
    return { state: log(next, action.action, id, result), result };
  }

  if (action.action === "restore") {
    if (!obj.restoration) {
      const result = ok("not-needed", "Nothing on this object is damage. Restoration would only invent a repair.");
      return { state: log(state, action.action, id, result), result };
    }
    if (!obj.restoration.applies) {
      const result = ok("record-is-the-damage", obj.restoration.result);
      return { state: log(state, action.action, id, result), result };
    }
    let next = state;
    if (obj.priorPhysical) next = lock(next, obj, "prior-physical", obj.priorPhysical);
    next = patchObject(next, id, { restored: true, lastDetail: obj.restoration.result });
    const result = ok("restored", `${obj.restoration.method} ${obj.restoration.result}`);
    return { state: log(next, action.action, id, result), result };
  }

  if (action.action === "use") {
    if (obj.interaction.needsRestore && !runtime.restored) {
      const result = fail("restore-first", "This use needs the restoration first. The evidence is unread by the repair.");
      return { state: log(state, action.action, id, result), result };
    }

    let next = lock(state, obj, "inscription", obj.evidence.readable);
    if (obj.priorPhysical && (obj.interaction.useRule === "ease-dent" || obj.interaction.outcomeIfRestored)) {
      next = lock(next, obj, "prior-physical", obj.priorPhysical);
    }

    const rule = obj.interaction.useRule;
    if (rule === "matches-3") {
      const left = runtime.matchesLeft ?? 0;
      if (left <= 0) {
        const result = fail("matches-spent", "The safe is empty. The scratch still says kitchen, not the kiln.");
        return { state: log(next, action.action, id, result), result };
      }
      const now = left - 1;
      next = patchObject(next, id, {
        matchesLeft: now,
        usedCount: runtime.usedCount + 1,
        registered: true,
        lastDetail: `${obj.interaction.outcome} Matches left: ${now}.`,
      });
      const result = ok("match-lit", next.objects[id]?.lastDetail ?? obj.interaction.outcome);
      return { state: log(next, action.action, id, result), result };
    }

    if (rule === "bell-once") {
      if (runtime.bellUsed) {
        const detail = "The bell stays quiet. The name remains the inscription and does not need to be rung again.";
        const quiet = patchObject(next, id, { registered: true, lastDetail: detail });
        const result = ok("bell-quiet", detail);
        return { state: log(quiet, action.action, id, result), result };
      }
      next = patchObject(next, id, {
        bellUsed: true,
        usedCount: runtime.usedCount + 1,
        registered: true,
        lastDetail: obj.interaction.outcome,
      });
      const result = ok("bell-once", obj.interaction.outcome);
      return { state: log(next, action.action, id, result), result };
    }

    if (rule === "lineage-toggle") {
      const lineage = runtime.lineage === "pell" ? "voss" : "pell";
      const detail =
        lineage === "pell"
          ? "The bowl commits to June Pell’s reading: bean-pot herbs. Tomas Voss’s apple butter is not in the bowl. It remains on the tag."
          : "The bowl commits to Tomas Voss’s reading: apple butter. June Pell’s herbs are not in the bowl. The tag still carries both.";
      next = patchObject(next, id, {
        lineage,
        usedCount: runtime.usedCount + 1,
        registered: true,
        lastDetail: detail,
      });
      const result = ok("lineage-commit", detail);
      return { state: log(next, action.action, id, result), result };
    }

    if (rule === "per-era") {
      if (runtime.usedEras.includes(state.era)) {
        const result = ok("already-applied", "The pebble already steadied a crossing in this era. It does not stack.");
        return { state: log(next, action.action, id, result), result };
      }
      next = patchObject(next, id, {
        usedEras: [...runtime.usedEras, state.era],
        usedCount: runtime.usedCount + 1,
        registered: true,
        lastDetail: obj.interaction.outcome,
      });
      const result = ok("steady-step", obj.interaction.outcome);
      return { state: log(next, action.action, id, result), result };
    }

    if (rule === "ease-dent") {
      if (runtime.dentEased) {
        const result = ok("already-applied", "The dent has already eased. The first description stays in the register.");
        return { state: log(next, action.action, id, result), result };
      }
      next = patchObject(next, id, {
        dentEased: true,
        usedCount: runtime.usedCount + 1,
        registered: true,
        lastDetail: obj.interaction.outcome,
      });
      const result = ok("dent-eased", obj.interaction.outcome);
      return { state: log(next, action.action, id, result), result };
    }

    if (rule === "ephemeral-mark") {
      next = patchObject(next, id, {
        ephemeralMark: "RETURN",
        usedCount: runtime.usedCount + 1,
        registered: true,
        lastDetail: obj.interaction.outcome,
      });
      const result = ok("slate-marked", obj.interaction.outcome);
      return { state: log(next, action.action, id, result), result };
    }

    if (rule === "initial-persist") {
      next = patchObject(next, id, {
        initialed: true,
        usedCount: runtime.usedCount + 1,
        registered: true,
        lastDetail: obj.interaction.outcome,
      });
      const result = ok("chit-initialed", obj.interaction.outcome);
      return { state: log(next, action.action, id, result), result };
    }

    if (runtime.usedCount > 0 && !obj.interaction.outcomeIfRestored) {
      const result = ok("already-applied", runtime.lastDetail || obj.interaction.outcome);
      return { state: log(next, action.action, id, result), result };
    }

    let detail = obj.interaction.outcome;
    let code = obj.interaction.outcomeKey;
    if (runtime.restored && obj.interaction.outcomeIfRestored) {
      detail = obj.interaction.outcomeIfRestored;
    }
    if (code === "clapper-rings") {
      const crossingLocked = next.evidence.some((row) => {
        if (row.snapshotOf !== "inscription") return false;
        return CATALOG_BY_ID.get(row.objectId)?.siteKind === "vanished-crossing";
      });
      if (!crossingLocked) {
        detail = "The clapper hangs silent. No vanished-crossing inscription is in the register yet.";
        code = "clapper-silent";
      }
    }
    next = patchObject(next, id, {
      usedCount: runtime.usedCount + 1,
      registered: true,
      lastDetail: detail,
    });
    const result = ok(code, detail);
    return { state: log(next, action.action, id, result), result };
  }

  const result = fail("bad-action", "The desk does not know that action.");
  return { state: log(state, action.action, id, result), result };
}
