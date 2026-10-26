import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG } from "../catalog/index.ts";
import { applyAction, createInitialState } from "../engine.ts";
import { EXTERNAL_CORPUS, overlapReport } from "../overlap.ts";
import { allPreviews } from "../preview.ts";
import { buildActionRecords, runAllRecords } from "../records.ts";
import { FEATURED_IDS, SCENES } from "../scenes.ts";
import { FICTION_NOTE } from "../types.ts";
import { validatePack } from "../validate.ts";

describe("buried history pack", () => {
  it("validates the catalog, scenes, and dedupe report", () => {
    const checks = validatePack();
    const failed = checks.filter((check) => !check.ok);
    assert.deepEqual(
      failed.map((check) => `${check.id}: ${check.detail}`),
      [],
    );
    const overlap = overlapReport(CATALOG);
    assert.equal(overlap.unresolved.length, 0);
    assert.equal(overlap.external.length, 0);
    assert.equal(EXTERNAL_CORPUS.relicCount, 14);
    assert.match(overlap.note, /Grave shovel/);
  });

  it("runs an action record for every object", () => {
    const scripts = buildActionRecords();
    assert.equal(scripts.length, 80);
    const summary = runAllRecords();
    assert.deepEqual(
      summary.failures.map((failure) => `${failure.id}#${failure.step} ${failure.detail}`),
      [],
    );
    assert.equal(summary.passed, 80);
    assert.equal(summary.failed, 0);
  });

  it("refuses every destructive verb without touching evidence", () => {
    for (const obj of CATALOG) {
      let state = createInitialState();
      for (const action of ["excavate", "recover", "inspect", "register"] as const) {
        const step = action === "excavate" || action === "recover" ? obj.binding : action;
        if (action === "excavate" || action === "recover") {
          state = applyAction(state, { action: obj.binding, id: obj.id }).state;
        } else {
          state = applyAction(state, { action: step, id: obj.id }).state;
        }
      }
      const locked = state.evidence.length;
      for (const verb of ["destroy", "discard", "burn", "wipe"] as const) {
        const next = applyAction(state, { action: verb, id: obj.id });
        assert.equal(next.result.ok, false);
        assert.equal(next.result.code, "campaign-evidence-locked");
        assert.equal(next.state.evidence.length, locked);
        assert.equal(next.state.evidence[0]?.readable, state.evidence[0]?.readable);
        assert.equal(next.state.objects[obj.id]?.phase, "in-hand");
        assert.equal(next.state.era, state.era);
      }
    }
  });

  it("snapshots the bottle’s first dent before the metal eases", () => {
    const id = "loot.expansion.history.076";
    let state = createInitialState();
    state = applyAction(state, { action: "recover", id }).state;
    state = applyAction(state, { action: "inspect", id }).state;
    const used = applyAction(state, { action: "use", id });
    assert.equal(used.result.code, "dent-eased");
    const prior = used.state.evidence.find((row) => row.snapshotOf === "prior-physical");
    const inscription = used.state.evidence.find((row) => row.snapshotOf === "inscription");
    assert.ok(prior);
    assert.match(prior?.readable ?? "", /smaller than any crew glove/);
    assert.match(inscription?.readable ?? "", /AY12/);
    const wiped = applyAction(used.state, { action: "wipe", id });
    assert.equal(wiped.state.evidence.length, used.state.evidence.length);
    assert.equal(wiped.state.objects[id]?.dentEased, true);
  });

  it("keeps working pencil marks erasable and the stamp locked", () => {
    const id = "loot.expansion.history.077";
    let state = createInitialState();
    state = applyAction(state, { action: "recover", id }).state;
    state = applyAction(state, { action: "inspect", id }).state;
    state = applyAction(state, { action: "register", id }).state;
    state = applyAction(state, { action: "use", id }).state;
    assert.equal(state.objects[id]?.ephemeralMark, "RETURN");
    const erased = applyAction(state, { action: "eraseWorkingMark", id });
    assert.equal(erased.result.code, "mark-erased");
    assert.equal(erased.state.objects[id]?.ephemeralMark, null);
    assert.match(erased.state.evidence[0]?.readable ?? "", /NYE/);
  });

  it("toggles the ladle without erasing either lineage", () => {
    const id = "loot.expansion.history.017";
    let state = createInitialState();
    state = applyAction(state, { action: "recover", id }).state;
    state = applyAction(state, { action: "inspect", id }).state;
    const first = applyAction(state, { action: "use", id });
    const second = applyAction(first.state, { action: "use", id });
    assert.match(first.result.detail, /bean-pot/);
    assert.match(second.result.detail, /apple butter/);
    assert.match(second.state.evidence[0]?.readable ?? "", /bean-pot/);
    assert.match(second.state.evidence[0]?.readable ?? "", /apple butter/);
  });

  it("lets the picker’s bell ring only once", () => {
    const id = "loot.expansion.history.055";
    let state = createInitialState();
    state = applyAction(state, { action: "recover", id }).state;
    state = applyAction(state, { action: "inspect", id }).state;
    const first = applyAction(state, { action: "use", id });
    const second = applyAction(first.state, { action: "use", id });
    assert.equal(first.result.code, "bell-once");
    assert.equal(second.result.code, "bell-quiet");
    assert.match(second.state.evidence.find((row) => row.snapshotOf === "inscription")?.readable ?? "", /SADIE QUILL/);
  });

  it("spends the match safe and still keeps its warning", () => {
    const id = "loot.expansion.history.024";
    let state = createInitialState();
    state = applyAction(state, { action: "recover", id }).state;
    state = applyAction(state, { action: "inspect", id }).state;
    for (let n = 0; n < 3; n += 1) {
      const lit = applyAction(state, { action: "use", id });
      assert.equal(lit.result.ok, true);
      state = lit.state;
    }
    const empty = applyAction(state, { action: "use", id });
    assert.equal(empty.result.code, "matches-spent");
    assert.match(empty.state.evidence[0]?.readable ?? "", /not the kiln/);
  });

  it("previews every object and scene as campaign fiction", () => {
    const sheets = allPreviews();
    assert.equal(sheets.length, 92);
    for (const sheet of sheets) {
      assert.match(sheet.body, /not county history/);
      assert.ok(sheet.title.length > 0);
    }
    assert.equal(SCENES.length, 12);
    assert.equal(new Set(FEATURED_IDS).size, 20);
    assert.match(FICTION_NOTE, /Addison County/);
  });
});
