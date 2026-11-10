import { advance, createRun, dispatch, kegTotal, rewardCopies } from "./engine.ts";
import type { Result, RunState } from "./types.ts";

export const TECHNIQUE_IDS = [
  "root-and-return",
  "fuse-garden",
  "candy-span",
  "current-opening",
  "witness-bridge",
  "pin-and-transfer",
  "cinder-line",
  "dark-catch",
  "pendulum-cut",
  "specimen-lamp",
  "ash-stake-row",
  "shaped-breach",
  "glass-debt",
  "eddy-fuse",
  "sugar-procession",
  "bell-shatter-return",
  "smugglers-tide",
  "officers-seat",
  "void-memory-span",
  "cache-honesty",
  "interruption-stack",
  "bow-net-relay",
  "lockbar-dive",
  "last-lamp",
] as const;

export type TechniqueId = (typeof TECHNIQUE_IDS)[number];

function need(r: Result, code?: string): Result {
  if (!r.ok) return r;
  if (code && r.code !== code) return { ok: false, code: "unexpected", detail: `wanted ${code}, got ${r.code}: ${r.detail}` };
  return r;
}

export function runTechnique(id: TechniqueId, s: RunState = createRun()): Result {
  switch (id) {
    case "root-and-return":
      return rootAndReturn(s);
    case "fuse-garden":
      return fuseGarden(s);
    case "candy-span":
      return candySpan(s);
    case "current-opening":
      return currentOpening(s);
    case "witness-bridge":
      return witnessBridge(s);
    case "pin-and-transfer":
      return pinAndTransfer(s);
    case "cinder-line":
      return cinderLine(s);
    case "dark-catch":
      return darkCatch(s);
    case "pendulum-cut":
      return pendulum(s);
    case "specimen-lamp":
      return specimenLamp(s);
    case "ash-stake-row":
      return ashStake(s);
    case "shaped-breach":
      return shapedBreach(s);
    case "glass-debt":
      return glassDebt(s);
    case "eddy-fuse":
      return eddyFuse(s);
    case "sugar-procession":
      return procession(s);
    case "bell-shatter-return":
      return bellShatter(s);
    case "smugglers-tide":
      return tide(s);
    case "officers-seat":
      return officerSeat(s);
    case "void-memory-span":
      return voidMemory(s);
    case "cache-honesty":
      return cacheHonesty(s);
    case "interruption-stack":
      return interruptStack(s);
    case "bow-net-relay":
      return bowNet(s);
    case "lockbar-dive":
      return lockbarDive(s);
    case "last-lamp":
      return lastLamp(s);
    default:
      return { ok: false, code: "unknown-technique", detail: id };
  }
}

function rootAndReturn(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["shovel", "net", "boots"] });
  s.x = 14;
  const rooted = need(dispatch(s, { type: "root" }), "roots");
  if (!rooted.ok) return rooted;
  const bare = createRun();
  bare.x = 14;
  bare.equipped = ["net", "shovel", "boots"];
  dispatch(bare, { type: "spawn-projectile", id: "seed-bare", cls: "organic", x: 14.4 });
  dispatch(bare, { type: "catch", projectileId: "seed-bare" });
  const plain = dispatch(bare, { type: "return-shot", targetId: "crawler" });
  if (plain.code === "pin-bloom") return { ok: false, code: "bloom-without-root", detail: "Return alone must not bloom." };
  dispatch(s, { type: "spawn-projectile", id: "seed", cls: "organic", x: 14.4 });
  const caught = need(dispatch(s, { type: "catch", projectileId: "seed" }), "caught");
  if (!caught.ok) return caught;
  const bloom = dispatch(s, { type: "return-shot", targetId: "crawler" });
  if (bloom.code !== "pin-bloom" || !s.pinBloom) return { ok: false, code: "no-bloom", detail: bloom.detail };
  return { ok: true, code: "root-and-return", detail: "Roots plus a returned seed bloom. The return without roots does not." };
}

function fuseGarden(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["shovel", "keg", "bow"] });
  s.x = 15;
  const buried = need(dispatch(s, { type: "bury-keg" }));
  if (!buried.ok) return buried;
  const id = s.buriedKegs[0]?.id;
  if (!id) return { ok: false, code: "no-cache", detail: "Keg did not bury." };
  dispatch(s, { type: "equip", tools: ["bow", "lamp", "shovel"] });
  dispatch(s, { type: "light-lamp" });
  const denied = dispatch(s, { type: "cinder", targetId: id });
  if (denied.ok || denied.code !== "buried-fuse") return { ok: false, code: "underground-lit", detail: denied.detail };
  const up = need(dispatch(s, { type: "unearth", id }));
  if (!up.ok) return up;
  dispatch(s, { type: "equip", tools: ["keg", "lamp", "shovel"] });
  const placed = need(dispatch(s, { type: "place-keg", atX: 15 }));
  if (!placed.ok) return placed;
  const keg = s.kegs[0];
  if (!keg) return { ok: false, code: "no-keg", detail: "Unearthed keg did not place." };
  const lit = need(dispatch(s, { type: "brand", targetId: keg.id }));
  if (!lit.ok) return lit;
  advance(s, 3.1);
  if (s.blasts.length !== 1) return { ok: false, code: "no-blast", detail: "Fuse garden should detonate once." };
  if (kegTotal(s) !== 1) return { ok: false, code: "keg-dup", detail: `keg total ${kegTotal(s)}` };
  return { ok: true, code: "fuse-garden", detail: "Buried kegs ignore cinders. Unearthed, a lamp brand commits one fuse." };
}

function candySpan(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["sugar", "lamp", "boots"] });
  s.x = 18;
  dispatch(s, { type: "light-lamp" });
  const cast = need(dispatch(s, { type: "lay-sugar" }));
  if (!cast.ok) return cast;
  const candy = need(dispatch(s, { type: "crystallize", heat: "lamp" }), "candy");
  if (!candy.ok || !s.candy?.alive) return candy;
  const officer = createRun({ form: "officer", x: 19.2 });
  officer.equipped = ["sugar", "lamp", "boots"];
  officer.lineCast = true;
  officer.lampLit = true;
  officer.candy = { x0: 20, x1: 28, alive: true };
  const crushed = dispatch(officer, { type: "move", dir: 1, dt: 0.4 });
  if (crushed.code !== "crushed-bridge" || officer.candy?.alive) {
    return { ok: false, code: "officer-should-crush", detail: crushed.detail };
  }
  if (officer.x >= 20) return { ok: false, code: "officer-crossed", detail: "Crush must leave the officer on the last ground." };
  return { ok: true, code: "candy-span", detail: "Lamp heat hardens a lip-cast sugar line. Officer mass breaks it and does not cross." };
}

function currentOpening(s: RunState): Result {
  dispatch(s, { type: "set-form", form: "smuggler" });
  dispatch(s, { type: "equip", tools: ["fins", "boots", "lamp"] });
  s.x = 43;
  s.medium = "water";
  s.waterSpeed = 0.4;
  const dry = dispatch(s, { type: "leap", toX: 37 });
  if (dry.ok) return { ok: false, code: "dry-leap", detail: "Dead water must not yield a boot leap." };
  s.waterSpeed = 2.2;
  const wet = dispatch(s, { type: "leap", toX: 37 });
  if (!wet.ok || s.medium === "water") return { ok: false, code: "no-opening", detail: wet.detail };
  if (Math.abs(s.x - 37) > 0.2) return { ok: false, code: "bad-landing", detail: `landed ${s.x}` };
  return { ok: true, code: "current-opening", detail: "Fins bring the speed. Boots spend it as a leap off the water. Neither works alone from dead water." };
}

function witnessBridge(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["lamp", "glass", "boots"] });
  s.x = 28;
  dispatch(s, { type: "light-lamp" });
  const direct = dispatch(s, { type: "witness", lockId: "ink-lock" });
  if (direct.ok) return { ok: false, code: "direct-should-fail", detail: direct.detail };
  const mirror = need(dispatch(s, { type: "mirror", x: 28 }));
  if (!mirror.ok) return mirror;
  const bounced = need(dispatch(s, { type: "witness", lockId: "ink-lock" }), "witness");
  if (!bounced.ok) return bounced;
  dispatch(s, { type: "equip", tools: ["hammer", "glass", "lamp"] });
  s.x = 34;
  const belled = need(dispatch(s, { type: "bell" }));
  if (!belled.ok || s.mirror?.alive) return { ok: false, code: "mirror-survived", detail: belled.detail };
  s.x = 28;
  dispatch(s, { type: "equip", tools: ["lamp", "glass", "hammer"] });
  dispatch(s, { type: "light-lamp" });
  const after = dispatch(s, { type: "witness", lockId: "ink-lock" });
  if (after.ok) return { ok: false, code: "bell-should-break-bounce", detail: "A broken mirror must not keep bouncing light from out of range." };
  return { ok: true, code: "witness-bridge", detail: "The mirror reaches a lock the lamp cannot see from your feet. A bell note ends that bounce." };
}

function pinAndTransfer(s: RunState): Result {
  s.anchors = s.anchors.filter((a) => a.id === "post");
  s.stripPilings = true;
  dispatch(s, { type: "equip", tools: ["rod", "hammer", "boots"] });
  const early = dispatch(s, { type: "transfer", fromId: "post", toId: "pin-monument", amount: 1 });
  if (early.ok) return { ok: false, code: "one-anchor", detail: "A transfer cannot invent the second seat." };
  s.x = 38;
  const seated = need(dispatch(s, { type: "pin", seamId: "monument" }), "pin-seated");
  if (!seated.ok) return seated;
  const moved = need(dispatch(s, { type: "transfer", fromId: "post", toId: "pin-monument", amount: 2 }));
  if (!moved.ok) return moved;
  const post = s.anchors.find((a) => a.id === "post");
  const pin = s.anchors.find((a) => a.id === "pin-monument");
  if (!post || !pin || post.weight !== 0 || pin.weight !== 2) {
    return { ok: false, code: "weight-not-conserved", detail: `${post?.weight}/${pin?.weight}` };
  }
  return { ok: true, code: "pin-and-transfer", detail: "The hammer makes the second seat. The rod then moves weight. One seat is never enough." };
}

function cinderLine(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["bow", "lamp", "keg"] });
  s.x = 30;
  dispatch(s, { type: "place-keg", atX: 33 });
  const wet = s.kegs[0];
  if (!wet) return { ok: false, code: "no-keg", detail: "Place failed." };
  wet.wet = true;
  dispatch(s, { type: "light-lamp" });
  const ashBefore = s.resources.ash;
  const oilBefore = s.resources.oil;
  const dud = dispatch(s, { type: "cinder", targetId: wet.id });
  if (dud.code !== "wet-dud") return { ok: false, code: "wet-should-fail", detail: dud.detail };
  if (s.resources.ash !== ashBefore - 1 || s.resources.oil !== oilBefore - 1) {
    return { ok: false, code: "fuel-not-spent", detail: "A failed cinder still spends ash and oil." };
  }
  dispatch(s, { type: "place-keg", atX: 31 });
  const dry = s.kegs.find((k) => !k.wet);
  if (!dry) return { ok: false, code: "no-dry", detail: "Dry keg missing." };
  dispatch(s, { type: "light-lamp" });
  const lit = need(dispatch(s, { type: "cinder", targetId: dry.id }), "cinder-lit");
  if (!lit.ok) return lit;
  advance(s, 3.1);
  if (s.blasts.length !== 1) return { ok: false, code: "blast-count", detail: String(s.blasts.length) };
  return { ok: true, code: "cinder-line", detail: "Lamp plus bow lights a dry fuse at range and wastes itself on a wet one." };
}

function darkCatch(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["cape", "lamp", "net"] });
  s.x = 12;
  dispatch(s, { type: "spawn-projectile", id: "seed-far", cls: "organic", x: 15.2 });
  const early = dispatch(s, { type: "catch", projectileId: "seed-far" });
  if (early.ok) return { ok: false, code: "caught-from-too-far", detail: early.detail };
  dispatch(s, { type: "light-lamp" });
  const litHem = dispatch(s, { type: "hem", toX: 14.6 });
  if (litHem.ok) return { ok: false, code: "hem-in-light", detail: "Soil is not shadow. A lit lamp must refuse the hem." };
  dispatch(s, { type: "snuff" });
  const hem = need(dispatch(s, { type: "hem", toX: 14.6 }));
  if (!hem.ok) return hem;
  advance(s, 0.4);
  const caught = need(dispatch(s, { type: "catch", projectileId: "seed-far" }), "caught");
  if (!caught.ok) return caught;
  return { ok: true, code: "dark-catch", detail: "The cape closes the last distance in the dark. The net still only takes an organic in reach." };
}

function pendulum(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["rod", "boots", "shovel"] });
  s.x = 19;
  const braced = need(dispatch(s, { type: "brace" }));
  if (!braced.ok) return braced;
  const landed = dispatch(s, { type: "leap", toX: 14 });
  if (!landed.ok) return landed;
  advance(s, 0.4);
  if (Math.abs(s.x - 14) > 0.2) return { ok: false, code: "no-land", detail: `x=${s.x}` };
  const stone = createRun({ form: "officer", x: 32, bankSurface: "stone" });
  stone.lastFree = 32;
  stone.equipped = ["rod", "boots", "shovel"];
  dispatch(stone, { type: "brace" });
  const cracked = dispatch(stone, { type: "leap", toX: 36 });
  advance(stone, 0.6);
  if (!stone.rodCracked || stone.x > 33) {
    return { ok: false, code: "stone-should-crack", detail: `cracked=${stone.rodCracked} x=${stone.x} ${cracked.detail}` };
  }
  return { ok: true, code: "pendulum-cut", detail: "A brace extends the leap onto soil. Officer stone cracks the rod and drops you at the last free ground." };
}

function specimenLamp(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["net", "lamp", "boots"] });
  s.resources.oil = 0;
  s.lampLit = false;
  s.x = 18;
  const bug = s.insects[0];
  if (!bug) return { ok: false, code: "no-bug", detail: "Missing lantern bug." };
  bug.x = 18;
  const caught = need(dispatch(s, { type: "specimen", insectId: bug.id }), "specimen");
  if (!caught.ok) return caught;
  s.x = 34;
  const seen = need(dispatch(s, { type: "witness", lockId: "guest-lock" }), "witness");
  if (!seen.ok) return seen;
  if (s.resources.oil !== 0) return { ok: false, code: "oil-created", detail: "The bug must not mint oil." };
  const again = dispatch(s, { type: "witness", lockId: "ink-lock" });
  if (again.ok) return { ok: false, code: "bug-reused", detail: "The lantern trick is once per room." };
  const killed = createRun();
  killed.equipped = ["net", "hammer", "lamp"];
  killed.resources.oil = 0;
  killed.x = 18;
  dispatch(killed, { type: "specimen", insectId: "lantern-bug" });
  dispatch(killed, { type: "kill-specimen-with-hammer" });
  killed.x = 34;
  const dead = dispatch(killed, { type: "witness", lockId: "guest-lock" });
  if (dead.ok) return { ok: false, code: "dead-bug-lit", detail: dead.detail };
  return { ok: true, code: "specimen-lamp", detail: "One living lantern bug witnesses a single lock with no oil. The hammer ends that." };
}

function ashStake(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["shovel", "bow", "boots"] });
  s.x = 14;
  const scoop = need(dispatch(s, { type: "scoop" }));
  if (!scoop.ok) return scoop;
  for (let i = 0; i < 3; i += 1) {
    const stake = dispatch(s, { type: "grave-arc" });
    if (!stake.ok) return stake;
  }
  if (!s.fence || s.stakes.length < 3) return { ok: false, code: "no-fence", detail: "Three stakes are the fence." };
  const boss = s.foes.find((f) => f.boss);
  if (!boss || boss.rootedUntil > s.time) return { ok: false, code: "boss-rooted", detail: "The fence must ignore the marble heart." };
  const two = createRun();
  two.equipped = ["shovel", "bow", "boots"];
  two.x = 14;
  dispatch(two, { type: "scoop" });
  dispatch(two, { type: "grave-arc" });
  dispatch(two, { type: "grave-arc" });
  if (two.fence) return { ok: false, code: "early-fence", detail: "Two stakes are not a fence." };
  return { ok: true, code: "ash-stake-row", detail: "Scoop, then three grave arcs. The fence is shorter than shovel roots and does not hold a boss." };
}

function shapedBreach(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["hammer", "rod", "keg"] });
  s.x = 38;
  const seated = need(dispatch(s, { type: "pin", seamId: "monument" }), "pin-seated");
  if (!seated.ok) return seated;
  const braced = need(dispatch(s, { type: "brace" }));
  if (!braced.ok) return braced;
  const placed = need(dispatch(s, { type: "place-keg", atX: 38 }));
  if (!placed.ok) return placed;
  const keg = s.kegs[0];
  if (!keg) return { ok: false, code: "no-keg", detail: "Keg missing." };
  const shaped = need(dispatch(s, { type: "shape-keg", kegId: keg.id, anchorId: "rod-brace" }));
  if (!shaped.ok) return shaped;
  const spark = need(dispatch(s, { type: "light-fuse", kegId: keg.id, how: "brand" }), "wedge-spark");
  if (!spark.ok) return spark;
  advance(s, 3.2);
  if (!s.wallOpen || !s.wallScarred) return { ok: false, code: "no-breach", detail: `open=${s.wallOpen} scar=${s.wallScarred}` };
  const boss = s.foes.find((f) => f.id === "marble-heart");
  if (!boss || boss.hp !== boss.maxHp) return { ok: false, code: "boss-hurt", detail: "The breach opens marble. It does not kill the heart." };

  const scar = createRun();
  scar.equipped = ["keg", "lamp", "boots"];
  scar.x = 38;
  scar.lampLit = true;
  dispatch(scar, { type: "place-keg", atX: 38 });
  const lone = scar.kegs[0];
  if (!lone) return { ok: false, code: "no-lone", detail: "Lone keg missing." };
  dispatch(scar, { type: "brand", targetId: lone.id });
  advance(scar, 3.2);
  if (scar.wallOpen || !scar.wallScarred) return { ok: false, code: "keg-alone", detail: "A keg without pin and rod may scar and must not open." };
  return { ok: true, code: "shaped-breach", detail: "Pin, rod, and a shaped keg open the seam. The keg alone only scars it. The heart lives." };
}

function glassDebt(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["glass", "cape", "boots"] });
  s.x = 6;
  const planted = need(dispatch(s, { type: "plant-pane" }));
  if (!planted.ok || !s.pane) return planted;
  const folds = s.resources.capeFolds;
  const hidden = need(dispatch(s, { type: "fold", targetId: "pane" }));
  if (!hidden.ok || !s.pane.hiddenFromPlayer || !s.pane.hiddenFromPatrol) return hidden;
  if (s.resources.capeFolds !== folds - 1) return { ok: false, code: "fold-free", detail: "The fold must be spent." };
  s.x = 24;
  s.medium = "pit";
  const back = dispatch(s, { type: "hit", amount: 999, kind: "physical" });
  if (back.code !== "pane-return" || s.x !== s.pane.x) {
    return { ok: false, code: "hidden-return-failed", detail: `${back.code} x=${s.x}` };
  }
  return { ok: true, code: "glass-debt", detail: "The cape hides the pane from you and from patrols. The return still fires, and the fold is gone." };
}

function eddyFuse(s: RunState): Result {
  dispatch(s, { type: "set-form", form: "smuggler" });
  dispatch(s, { type: "equip", tools: ["fins", "keg", "lamp"] });
  s.x = 44;
  s.medium = "water";
  s.waterSpeed = 2;
  const placed = need(dispatch(s, { type: "place-keg", atX: 44 }));
  if (!placed.ok) return placed;
  const keg = s.kegs[0];
  if (!keg?.wet) return { ok: false, code: "should-wet", detail: "Water placement wets powder." };
  dispatch(s, { type: "light-lamp" });
  const dud = dispatch(s, { type: "brand", targetId: keg.id });
  if (dud.code !== "wet-dud") return { ok: false, code: "wet-lit", detail: dud.detail };
  const dried = need(dispatch(s, { type: "dry-keg", kegId: keg.id }));
  if (!dried.ok || keg.wet) return dried;
  dispatch(s, { type: "light-lamp" });
  const lit = need(dispatch(s, { type: "brand", targetId: keg.id }));
  if (!lit.ok) return lit;
  return { ok: true, code: "eddy-fuse", detail: "Creek water makes a dud. The lamp can dry it. Swimming does not become a bomb." };
}

function procession(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["sugar", "net", "boots"] });
  s.x = 18;
  const cast = need(dispatch(s, { type: "lay-sugar" }));
  if (!cast.ok) return cast;
  const bug = s.insects[0];
  if (!bug) return { ok: false, code: "no-bug", detail: "No insect." };
  bug.x = 14;
  s.x = 14;
  const mid = dispatch(s, { type: "specimen", insectId: bug.id });
  if (mid.code !== "mid-trail") return { ok: false, code: "skimmed", detail: mid.detail };
  bug.x = 19;
  s.x = 19;
  const end = need(dispatch(s, { type: "specimen", insectId: bug.id }), "specimen");
  if (!end.ok) return end;
  return { ok: true, code: "sugar-procession", detail: "Sweet insects are caught at the sugar bowl, not vacuumed off the trail." };
}

function bellShatter(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["glass", "hammer", "boots"] });
  s.x = 8;
  const planted = need(dispatch(s, { type: "plant-pane" }));
  if (!planted.ok) return planted;
  s.x = 34;
  const belled = need(dispatch(s, { type: "bell" }));
  if (!belled.ok) return belled;
  if (s.pane?.alive) return { ok: false, code: "pane-lived", detail: "Bell must spend the pane." };
  if (!s.fracture?.alive) return { ok: false, code: "no-fracture", detail: "Spending the pane at the bell opens the gap fracture." };
  s.x = 30;
  const back = dispatch(s, { type: "hit", amount: 999, kind: "physical" });
  if (back.code === "pane-return") return { ok: false, code: "return-remained", detail: "The return was spent." };
  return { ok: true, code: "bell-shatter-return", detail: "The bell spends your safety pane and leaves a fracture span. You do not get the return as well." };
}

function tide(s: RunState): Result {
  dispatch(s, { type: "set-form", form: "smuggler" });
  dispatch(s, { type: "equip", tools: ["sugar", "fins", "boots"] });
  s.x = 44;
  s.medium = "water";
  s.waterSpeed = 1.2;
  const marked = need(dispatch(s, { type: "lay-sugar" }), "tide-marker");
  if (!marked.ok) return marked;
  const cut = dispatch(s, { type: "current-cut" });
  if (!cut.ok) return { ok: false, code: "tide-cut-failed", detail: cut.detail };
  const officer = createRun({ form: "officer", x: 44, medium: "water" });
  officer.equipped = ["sugar", "fins", "boots"];
  officer.resources.sugar = 3;
  const sunk = dispatch(officer, { type: "lay-sugar" });
  if (sunk.code !== "sugar-sinks" || officer.notes.includes("tide")) {
    return { ok: false, code: "officer-floated", detail: sunk.detail };
  }
  return { ok: true, code: "smugglers-tide", detail: "Smuggler sugar floats and lowers the speed a cut demands. Officer sugar sinks." };
}

function officerSeat(s: RunState): Result {
  s.form = "officer";
  s.anchors = [];
  s.stripPilings = true;
  s.x = 38;
  s.medium = "ground";
  dispatch(s, { type: "equip", tools: ["hammer", "rod", "boots"] });
  const seated = need(dispatch(s, { type: "pin", seamId: "monument" }), "pin-seated");
  if (!seated.ok) return seated;
  const moved = need(dispatch(s, { type: "transfer", fromId: "officer-self", toId: "pin-monument", amount: 2 }));
  if (!moved.ok) return moved;
  const pin = s.anchors.find((a) => a.id === "pin-monument");
  const self = s.anchors.find((a) => a.id === "officer-self");
  if (!pin || !self || pin.weight !== 2 || self.weight !== 2) {
    return { ok: false, code: "seat-math", detail: `${self?.weight}/${pin?.weight}` };
  }
  if (s.form !== "officer") return { ok: false, code: "form", detail: "Form changed." };
  const civilian = createRun({ x: 38 });
  civilian.anchors = [];
  civilian.stripPilings = true;
  civilian.equipped = ["hammer", "rod", "boots"];
  dispatch(civilian, { type: "pin", seamId: "monument" });
  const denied = dispatch(civilian, { type: "transfer", fromId: "post", toId: "pin-monument", amount: 1 });
  if (denied.ok) return { ok: false, code: "wanderer-self-anchor", detail: "A wanderer is not a seat." };
  return { ok: true, code: "officers-seat", detail: "Planted officer weight is the second seat. A wanderer with one pin still cannot transfer." };
}

function voidMemory(s: RunState): Result {
  dispatch(s, { type: "set-embryo", on: true });
  dispatch(s, { type: "set-form", form: "god" });
  dispatch(s, { type: "equip", tools: ["glass", "fins", "boots"] });
  const blocked = dispatch(s, { type: "enter-void" });
  if (blocked.ok) return { ok: false, code: "void-without-memory", detail: blocked.detail };
  s.x = 6;
  const planted = need(dispatch(s, { type: "plant-pane" }));
  if (!planted.ok) return planted;
  s.medium = "void";
  s.x = 50;
  const illegal = dispatch(s, { type: "fracture", onWater: true });
  if (illegal.ok) return { ok: false, code: "void-lay", detail: "Fracture must not be laid inside the void." };
  s.medium = "ground";
  s.x = 39.5;
  const laid = need(dispatch(s, { type: "fracture", onWater: true }));
  if (!laid.ok || !s.voidMemory) return laid;
  const wade = need(dispatch(s, { type: "enter-void" }), "void-wade");
  if (!wade.ok) return wade;
  s.x = 56;
  const deep = dispatch(s, { type: "enter-void" });
  if (deep.ok || deep.code === "void-wade") return { ok: false, code: "deep-opened", detail: deep.detail };
  return { ok: true, code: "void-memory-span", detail: "Glass laid on water becomes a shallow-void memory. Glass laid in the void fails. Deep void stays shut." };
}

function cacheHonesty(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["shovel", "glass", "boots"] });
  s.x = 15;
  const picked = need(dispatch(s, { type: "pickup", id: "creek-coin" }));
  if (!picked.ok) return picked;
  const buried = need(dispatch(s, { type: "bury-reward", id: "creek-coin" }));
  if (!buried.ok) return buried;
  s.x = 6;
  const planted = need(dispatch(s, { type: "plant-pane" }));
  if (!planted.ok) return planted;
  const jar = need(dispatch(s, { type: "pickup", id: "homestead-jar" }));
  if (!jar.ok) return jar;
  s.x = 16;
  const back = dispatch(s, { type: "hit", amount: 999, kind: "physical" });
  if (back.code !== "pane-return") return { ok: false, code: "no-return", detail: back.detail };
  if (s.rewards["creek-coin"]?.where !== "buried") return { ok: false, code: "cache-moved", detail: "The buried coin must stay buried." };
  if (s.rewards["homestead-jar"]?.where !== "world") return { ok: false, code: "jar-kept", detail: "The jar was taken after the pane and must drop." };
  if (rewardCopies(s, "creek-coin") !== 1 || rewardCopies(s, "homestead-jar") !== 1) {
    return { ok: false, code: "duplicated", detail: "Reward ids must stay singular." };
  }
  const again = dispatch(s, { type: "grant", id: "creek-coin" });
  if (again.ok) return { ok: false, code: "reminted", detail: "A returned room must not mint the coin again." };
  return { ok: true, code: "cache-honesty", detail: "Buried goods stay buried. Post-pane pickups drop once at the hit. Nothing remints." };
}

function interruptStack(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["cape", "lamp", "shovel"] });
  s.x = 12;
  dispatch(s, { type: "light-lamp" });
  dispatch(s, { type: "snuff" });
  const hem = need(dispatch(s, { type: "hem", toX: 14.5 }));
  if (!hem.ok) return hem;
  const flare = dispatch(s, { type: "light-lamp" });
  if (!flare.ok) return flare;
  if (s.channel) return { ok: false, code: "hem-survived-lamp", detail: "Lighting the lamp must break the hem." };
  if (Math.abs(s.x - 12) > 0.05) return { ok: false, code: "moved", detail: "An interrupted hem does not move you." };
  dispatch(s, { type: "snuff" });
  dispatch(s, { type: "hem", toX: 14.2 });
  const rooted = dispatch(s, { type: "root" });
  if (!rooted.ok) return rooted;
  if (s.channel) return { ok: false, code: "hem-survived-root", detail: "Rooting must break the hem." };
  s.x = 34;
  dispatch(s, { type: "equip", tools: ["cape", "hammer", "lamp"] });
  dispatch(s, { type: "light-lamp" });
  dispatch(s, { type: "snuff" });
  const hemBank = zoneHem(s);
  if (!hemBank.ok) return hemBank;
  const belled = dispatch(s, { type: "bell" });
  if (!belled.ok) return belled;
  if (s.channel || s.interruptCount < 2) {
    return { ok: false, code: "bell-missed", detail: `channel=${!!s.channel} interrupts=${s.interruptCount}` };
  }
  return { ok: true, code: "interruption-stack", detail: "Lamp, root, and bell each break a hem before it commits. Position stays put." };
}

function zoneHem(s: RunState): Result {
  return dispatch(s, { type: "hem", toX: s.x + 2 });
}

function bowNet(s: RunState): Result {
  dispatch(s, { type: "equip", tools: ["bow", "net", "boots"] });
  s.x = 30;
  const tension = s.resources.netTension;
  const shot = need(dispatch(s, { type: "ash-shot", targetId: "piling-a" }));
  if (!shot.ok) return shot;
  const arrow = s.projectiles.find((p) => p.cls === "mineral" && p.alive);
  if (!arrow) return { ok: false, code: "no-arrow", detail: "Ash thread did not leave a mineral projectile." };
  arrow.x = s.x;
  const refused = dispatch(s, { type: "catch", projectileId: arrow.id });
  if (refused.code !== "wrong-class") return { ok: false, code: "caught-arrow", detail: refused.detail };
  if (s.resources.netTension !== tension) return { ok: false, code: "tension-tax", detail: "A refused class must not spend tension." };
  dispatch(s, { type: "spawn-projectile", id: "pod", cls: "organic", x: s.x });
  const caught = need(dispatch(s, { type: "catch", projectileId: "pod" }), "caught");
  if (!caught.ok) return caught;
  return { ok: true, code: "bow-net-relay", detail: "Ash arrows are mineral and uncatchable. Organic pods are the net's whole class." };
}

function lockbarDive(s: RunState): Result {
  s.form = "officer";
  s.x = 19;
  s.equipped = ["rod", "fins", "boots"];
  const braced = need(dispatch(s, { type: "brace" }));
  if (!braced.ok) return braced;
  const barred = need(dispatch(s, { type: "lockbar", toAnchor: "piling-a" }));
  if (!barred.ok || !s.lockbar) return barred;
  const walked = dispatch(s, { type: "move", dir: 1, dt: 0.5 });
  if (walked.ok && s.x >= 20) return { ok: false, code: "officer-walked-bar", detail: walked.detail };
  const dove = need(dispatch(s, { type: "undertow" }));
  if (!dove.ok) return dove;
  if (s.x < 28) return { ok: false, code: "dive-short", detail: `x=${s.x}` };
  const light = createRun({ form: "smuggler", x: 19 });
  light.equipped = ["rod", "boots", "fins"];
  dispatch(light, { type: "brace" });
  dispatch(light, { type: "lockbar", toAnchor: "piling-a" });
  const tight = dispatch(light, { type: "move", dir: 1, dt: 0.4 });
  if (!tight.ok || light.x < 20) return { ok: false, code: "smuggler-should-tightrope", detail: tight.detail };
  light.equipped = ["keg", "rod", "boots"];
  const roll = dispatch(light, { type: "place-keg", atX: 24 });
  if (roll.ok) return { ok: false, code: "keg-on-bar", detail: "Kegs roll off the span." };
  return { ok: true, code: "lockbar-dive", detail: "Officer mass refuses the walk and accepts the fin dive. A smuggler may tightrope. A keg may not." };
}

function lastLamp(s: RunState): Result {
  dispatch(s, { type: "set-embryo", on: true });
  dispatch(s, { type: "equip", tools: ["lamp", "glass", "fins"] });
  dispatch(s, { type: "light-lamp" });
  const snuffed = need(dispatch(s, { type: "snuff" }));
  if (!snuffed.ok || s.resources.darkCharge < 1) return snuffed;
  s.x = 6;
  const planted = need(dispatch(s, { type: "plant-pane" }));
  if (!planted.ok) return planted;
  s.x = 39.5;
  s.medium = "ground";
  const memory = need(dispatch(s, { type: "fracture", onWater: true }));
  if (!memory.ok) return memory;
  dispatch(s, { type: "set-form", form: "god" });
  dispatch(s, { type: "equip", tools: ["cape", "fins", "lamp"] });
  const wade = need(dispatch(s, { type: "enter-void" }), "void-wade");
  if (!wade.ok) return wade;
  const step = need(dispatch(s, { type: "hem", toX: 51 }));
  if (!step.ok) return step;
  advance(s, 0.4);
  if (zoneAtSafe(s.x) !== "void") return { ok: false, code: "left-shallow", detail: `x=${s.x}` };
  const second = dispatch(s, { type: "hem", toX: 52 });
  if (second.ok) return { ok: false, code: "second-void-hem", detail: second.detail };
  const seen = dispatch(s, { type: "witness", lockId: "ink-lock" });
  if (seen.ok || !s.witnessBlind) return { ok: false, code: "still-seeing", detail: seen.detail };
  dispatch(s, { type: "equip", tools: ["keg", "fins", "cape"] });
  const powder = dispatch(s, { type: "place-keg" });
  if (powder.ok) return { ok: false, code: "void-keg", detail: "Powder is mundane in the void." };
  dispatch(s, { type: "equip", tools: ["net", "fins", "cape"] });
  dispatch(s, { type: "spawn-projectile", id: "spear", cls: "void", x: s.x });
  const spear = dispatch(s, { type: "catch", projectileId: "spear" });
  if (spear.code !== "wrong-class") return { ok: false, code: "caught-spear", detail: spear.detail };
  s.x = 56;
  const deep = dispatch(s, { type: "move", dir: 1, dt: 0.2 });
  if (deep.ok && s.x >= 54) return { ok: false, code: "deep-step", detail: "Deep void is not a step." };
  return { ok: true, code: "last-lamp", detail: "One banked dark step in the shallow void. No second step, no witness, no keg, no void-spear catch, no deep crossing." };
}

function zoneAtSafe(x: number): string {
  if (x >= 48 && x < 54) return "void";
  if (x >= 54) return "deep";
  return "other";
}
