import { CATALOG } from "./catalog/index.ts";
import { applyAction, createInitialState } from "./engine.ts";
import type { HistoryObject, PackAction, PackState } from "./types.ts";

export interface RecordStep {
  action: PackAction;
  expectOk: boolean;
  expectCode: string;
}

export interface ActionScript {
  id: string;
  steps: RecordStep[];
}

function otherBinding(obj: HistoryObject): "excavate" | "recover" {
  return obj.binding === "excavate" ? "recover" : "excavate";
}

function restoreCode(obj: HistoryObject): string {
  if (!obj.restoration) return "not-needed";
  if (!obj.restoration.applies) return "record-is-the-damage";
  return "restored";
}

export function buildActionRecords(catalog: readonly HistoryObject[] = CATALOG): ActionScript[] {
  return catalog.map((obj) => ({
    id: obj.id,
    steps: [
      { action: { action: otherBinding(obj), id: obj.id }, expectOk: false, expectCode: "wrong-binding" },
      { action: { action: obj.binding, id: obj.id }, expectOk: true, expectCode: "in-hand" },
      { action: { action: "inspect", id: obj.id }, expectOk: true, expectCode: "inspected" },
      { action: { action: "register", id: obj.id }, expectOk: true, expectCode: "registered" },
      { action: { action: "restore", id: obj.id }, expectOk: true, expectCode: restoreCode(obj) },
      { action: { action: "use", id: obj.id }, expectOk: true, expectCode: obj.interaction.outcomeKey },
      { action: { action: "destroy", id: obj.id }, expectOk: false, expectCode: "campaign-evidence-locked" },
      { action: { action: "setEra", era: "the-fourteen", id: obj.id }, expectOk: true, expectCode: "era-set" },
    ],
  }));
}

export interface RunFailure {
  id: string;
  step: number;
  detail: string;
}

export function runRecord(script: ActionScript, catalog: readonly HistoryObject[] = CATALOG): {
  ok: boolean;
  failures: RunFailure[];
  state: PackState;
} {
  let state = createInitialState(catalog);
  const failures: RunFailure[] = [];
  script.steps.forEach((step, index) => {
    const applied = applyAction(state, step.action);
    state = applied.state;
    if (applied.result.ok !== step.expectOk || applied.result.code !== step.expectCode) {
      failures.push({
        id: script.id,
        step: index,
        detail: `expected ${step.expectOk ? "ok" : "no"} ${step.expectCode}; got ${applied.result.ok ? "ok" : "no"} ${applied.result.code}: ${applied.result.detail}`,
      });
    }
  });
  const obj = catalog.find((row) => row.id === script.id);
  const inscription = state.evidence.find(
    (row) => row.objectId === script.id && row.snapshotOf === "inscription" && row.locked,
  );
  if (!obj || !inscription || inscription.readable !== obj.evidence.readable) {
    failures.push({ id: script.id, step: -1, detail: "inscription missing or altered after the record." });
  }
  const runtime = state.objects[script.id];
  if (!runtime || runtime.phase !== "in-hand") {
    failures.push({ id: script.id, step: -1, detail: "object did not stay in hand." });
  }
  if (state.era !== "the-fourteen") {
    failures.push({ id: script.id, step: -1, detail: "era did not persist." });
  }
  if (obj?.interaction.useRule === "initial-persist" && runtime && !runtime.initialed) {
    failures.push({ id: script.id, step: -1, detail: "initials did not survive the era change." });
  }
  return { ok: failures.length === 0, failures, state };
}

export function runAllRecords(catalog: readonly HistoryObject[] = CATALOG): {
  passed: number;
  failed: number;
  failures: RunFailure[];
} {
  const scripts = buildActionRecords(catalog);
  const failures: RunFailure[] = [];
  let passed = 0;
  for (const script of scripts) {
    const result = runRecord(script, catalog);
    if (result.ok) passed += 1;
    else failures.push(...result.failures);
  }
  return { passed, failed: scripts.length - passed, failures };
}
