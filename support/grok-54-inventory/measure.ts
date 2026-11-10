import { AUTHORED_CORE, RECIPES } from "./catalog.ts";
import { FIXTURE_TOTAL, LONG_FIXTURE_ID } from "./fixtures.ts";
import {
  buildSearchIndex,
  census,
  defOf,
  dismantlePlan,
  initialState,
  playerFacingText,
  project,
  recipeViews,
  reduce,
  searchPrepared,
  visibleIds,
  type PreparedIndex,
} from "./logic.ts";
import type { InventoryState } from "./types.ts";

export type CheckResult = {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
  ms?: number;
};

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index] ?? 0;
}

function round(ms: number): number {
  return Math.round(ms * 1000) / 1000;
}

function qtyOf(state: InventoryState, defId: string): number {
  return state.instances.filter((inst) => inst.defId === defId).reduce((sum, inst) => sum + inst.qty, 0);
}

export function runChecks(): CheckResult[] {
  const checks: CheckResult[] = [];
  const push = (id: string, name: string, pass: boolean, detail: string, ms?: number) => {
    checks.push({ id, name, pass, detail, ms });
  };

  const state = initialState();
  const counts = census(state);
  push(
    "fixtures",
    "Fixture index",
    FIXTURE_TOTAL >= 500 && counts.fixture >= 500 && AUTHORED_CORE.length === 30,
    `${FIXTURE_TOTAL} fixture definitions, ${counts.fixture} fixture records in storage, ${AUTHORED_CORE.length} authored items.`,
  );

  const labeled = state.instances
    .filter((inst) => defOf(inst.defId).contentClass === "fixture")
    .every((inst) => defOf(inst.defId).name.startsWith("[Fixture]"));
  push("labels", "Fixture labels", labeled, "Every fixture name starts with [Fixture].");

  const index: PreparedIndex = buildSearchIndex(state);
  const queries = [
    "rye",
    "quilt",
    "bead",
    "unreasonable label",
    "sealed sample",
    "[fixture] cedar",
    "journal roads",
    "zzzz-missing",
  ];
  const samples: number[] = [];
  for (let roundIndex = 0; roundIndex < 40; roundIndex++) {
    for (const query of queries) {
      const start = performance.now();
      searchPrepared(index, query);
      samples.push(performance.now() - start);
    }
  }
  samples.sort((a, b) => a - b);
  const p50 = pct(samples, 0.5);
  const p95 = pct(samples, 0.95);
  const longHits = searchPrepared(index, "unreasonable label");
  push(
    "search",
    "Search",
    p95 < 20 && longHits.includes(LONG_FIXTURE_ID) && searchPrepared(index, "zzzz-missing").length === 0,
    `Prepared search over ${index.ids.length} records. p50 ${round(p50)} ms, p95 ${round(p95)} ms. Long-name hit ${longHits.length}.`,
    p95,
  );

  const beadHits = searchPrepared(index, "blue glass bead");
  const beadEras = new Set(
    beadHits.map((id) => state.instances.find((inst) => inst.instanceId === id)?.provenance.era),
  );
  push(
    "duplicates",
    "Duplicate instances",
    beadHits.length >= 2 && beadEras.size >= 2,
    `${beadHits.length} blue glass beads, eras ${[...beadEras].join(", ")}.`,
  );

  const dup = searchPrepared(index, "second sample of the same fixture");
  push(
    "dup-fixtures",
    "Duplicate fixture samples",
    dup.length >= 12,
    `${dup.length} second samples share a definition and keep their own instance.`,
  );

  const rye = state.instances.filter((inst) => inst.defId === "rye-loaf");
  push(
    "stacks",
    "Stacked quantities",
    rye.length === 1 && (rye[0]?.qty ?? 0) >= 3,
    `Rye loaf is one stack of ${rye[0]?.qty ?? 0}, not split into single crumbs.`,
  );

  let listed: InventoryState = { ...state, view: "hearth", content: "fixture", query: "" };
  const ids = visibleIds(listed);
  const pureStart = performance.now();
  let cursor = 0;
  for (let step = 0; step < 2000; step++) cursor = Math.min(ids.length - 1, cursor + 1);
  const pureMs = performance.now() - pureStart;
  listed = { ...listed, focusedId: ids[0] ?? null, cursor: 0 };
  const navStart = performance.now();
  const steps = 40;
  for (let step = 0; step < steps; step++) listed = reduce(listed, { type: "move", dir: 1 }).state;
  const navMs = performance.now() - navStart;
  const expected = ids[Math.min(steps, Math.max(0, ids.length - 1))] ?? null;
  push(
    "navigate",
    "Keyboard navigation",
    ids.length >= 500 && listed.focusedId === expected && cursor === Math.min(2000, ids.length - 1),
    `${ids.length} fixture rows. 40 focus moves in ${round(navMs)} ms. 2000 cursor steps in ${round(pureMs)} ms. Landed on ${listed.focusedId}.`,
    navMs,
  );

  let kept = reduce(state, { type: "focus", id: "inst-journal" }).state;
  kept = reduce(kept, { type: "sort", sort: "heft" }).state;
  kept = reduce(kept, { type: "content", content: "fixture" }).state;
  push(
    "focus",
    "Focus retention",
    kept.focusedId === "inst-journal",
    "Sort and a filter that hides the journal leave the same item open.",
  );

  const before = state.instances.find((inst) => inst.instanceId === "inst-stick")?.condition;
  let modified = reduce(state, { type: "begin-modify", id: "inst-stick" }).state;
  modified = reduce(modified, { type: "view", view: "hearth" }).state;
  const afterInterrupt = modified.instances.find((inst) => inst.instanceId === "inst-stick")?.condition;
  push(
    "interrupt",
    "Interrupted modify",
    modified.pending === null && before === afterInterrupt && before === 64,
    `Stick condition stayed ${afterInterrupt}. Pending action cleared.`,
  );

  let honed = reduce(state, { type: "begin-modify", id: "inst-stick" }).state;
  honed = reduce(honed, { type: "confirm-pending" }).state;
  const honedCondition = honed.instances.find((inst) => inst.instanceId === "inst-stick")?.condition;
  push(
    "hone",
    "Confirmed modify",
    honed.pending === null && honedCondition === 82,
    `Confirming the hone moves condition ${before} to ${honedCondition}.`,
  );

  let worn = reduce(state, { type: "focus", id: "inst-wool" }).state;
  worn = reduce(worn, { type: "equip", id: "inst-wool" }).state;
  const wool = worn.instances.find((inst) => inst.instanceId === "inst-wool");
  const mended = worn.instances.find((inst) => inst.instanceId === "inst-mended");
  push(
    "loadout",
    "Changed loadout",
    worn.focusedId === "inst-wool" && wool?.container === "equipped" && mended?.container !== "equipped",
    "Wool coat is worn. Focus stays on it. The mended coat is set aside.",
  );

  const junk = "fx-006";
  const favorite = "fx-004";
  const sealed = "fx-040";
  const letter = "inst-letter";
  const plan = dismantlePlan(state, [junk, favorite, sealed, letter]);
  let batch: InventoryState = {
    ...state,
    selected: [junk, favorite, sealed, letter],
    batch: true,
    content: "all",
  };
  batch = reduce(batch, { type: "begin-dismantle", ids: [junk, favorite, sealed, letter] }).state;
  batch = reduce(batch, { type: "confirm-pending" }).state;
  const still = (id: string) => batch.instances.some((inst) => inst.instanceId === id);
  push(
    "batch",
    "Batch dismantle guard",
    !still(junk) &&
      still(favorite) &&
      still(sealed) &&
      still(letter) &&
      plan.ok.length === 1 &&
      plan.skipped.some((row) => row.reason === "Protected"),
    `Removed the open fixture only. Protected ${plan.skipped.filter((row) => row.reason === "Protected").length}, favorite kept, authored letter kept.`,
  );

  const full = {
    ...state,
    caps: { pack: 0, hearth: 0, display: 0 },
  };
  const scrap = reduce(full, { type: "pickup", groundId: "ground-scrap" });
  const sealedPickup = reduce(full, { type: "pickup", groundId: "ground-sealed" });
  push(
    "full",
    "Full storage",
    scrap.state.ground.some((row) => row.groundId === "ground-scrap") &&
      !sealedPickup.state.ground.some((row) => row.groundId === "ground-sealed") &&
      sealedPickup.state.instances.some((inst) => inst.defId === "fx-040" && inst.provenance.era === "after"),
    "An ordinary scrap stays on the ground. A protected fixture is kept at the hearth anyway.",
  );

  const picked = reduce(state, { type: "pickup", groundId: "ground-apples" }).state;
  const appleStacks = picked.instances.filter((inst) => inst.defId === "apple-rings");
  push(
    "pickup",
    "Fast pickup",
    !picked.ground.some((row) => row.groundId === "ground-apples") && appleStacks.length >= 2,
    "Ground apples are in hand as their own stack, not folded into the older rings.",
  );

  const away = reduce({ ...state, atHearth: false }, { type: "craft", recipeId: "porridge" }).state;
  const made = reduce(state, { type: "craft", recipeId: "porridge" }).state;
  push(
    "recipe",
    "Recipe lookup and craft",
    !recipeViews(state).some((recipe) => recipe.name === "Unlisted preparation") &&
      qtyOf(away, "rye-loaf") === qtyOf(state, "rye-loaf") &&
      qtyOf(made, "rye-loaf") === qtyOf(state, "rye-loaf") - 1 &&
      made.instances.some((inst) => inst.defId === "rye-porridge") &&
      made.instances.some((inst) => inst.defId === "skillet"),
    "Known porridge can be made at the hearth. Away from it, nothing is spent. The unlisted preparation is absent.",
  );

  let read = state;
  for (const inst of state.instances) {
    if (defOf(inst.defId).contentClass !== "authored") continue;
    read = reduce(read, { type: "inspect", id: inst.instanceId }).state;
  }
  const journal = project(read, "inst-journal");
  const facing = playerFacingText(read);
  push(
    "secrets",
    "Unread story stays unlabeled",
    (journal?.storyWithheld ?? 0) > 0 &&
      journal?.uses.some((use) => use.label === "Read the index of roads already walked") === true &&
      !facing.includes("Unlisted preparation") &&
      !facing.toLowerCase().includes("millpond") &&
      !facing.toLowerCase().includes("cellar stair"),
    "Inspect confirms a practical index. Withheld lines are only marked unread.",
  );

  const knownRecipes = RECIPES.filter((recipe) => recipe.known).length;
  push(
    "recipes-known",
    "Known recipes only",
    recipeViews(state).length === knownRecipes && knownRecipes === 3,
    `${recipeViews(state).length} known preparations are listed.`,
  );

  return checks;
}
