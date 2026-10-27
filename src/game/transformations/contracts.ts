import {
  advance,
  bossUntouched,
  coverageGap,
  createRun,
  dispatch,
  kegTotal,
  LOADOUT_MAX,
  rewardCopies,
  tick,
  validateLoadout,
  formStats,
} from "./engine.ts";
import { runTechnique, TECHNIQUE_IDS } from "./techniques.ts";
import { FORM_IDS, TOOL_IDS, type RunState } from "./types.ts";
import { MUTATIONS, TECHNIQUES, TRANSFORMATIONS } from "./records.ts";

export interface ContractResult {
  id: string;
  group: string;
  ok: boolean;
  detail: string;
}

function assert(cond: unknown, message: string): void {
  if (!cond) throw new Error(message);
}

/** Read medium at its declared width. Assignments narrow the property; the engine writes it back. */
function mediumOf(s: { medium: RunState["medium"] }): RunState["medium"] {
  return s.medium;
}

function trial(group: string, id: string, fn: () => void): ContractResult {
  try {
    fn();
    return { id, group, ok: true, detail: "passed" };
  } catch (err) {
    return { id, group, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

function fresh(partial: Partial<RunState> = {}): RunState {
  return createRun(partial);
}

export function runAllContracts(): { passed: number; failed: number; results: ContractResult[] } {
  const results: ContractResult[] = [];
  const add = (group: string, id: string, fn: () => void) => results.push(trial(group, id, fn));

  add("catalog", "counts", () => {
    assert(TRANSFORMATIONS.length === 36, `transformations ${TRANSFORMATIONS.length}`);
    assert(MUTATIONS.length === 32, `mutations ${MUTATIONS.length}`);
    assert(TECHNIQUES.length === 24, `techniques ${TECHNIQUES.length}`);
    assert(new Set(TRANSFORMATIONS.map((t) => t.tool)).size === 12, "tool coverage");
    for (const form of FORM_IDS) assert(MUTATIONS.filter((m) => m.form === form).length === 8, form);
    for (const tool of TOOL_IDS) assert(TRANSFORMATIONS.filter((t) => t.tool === tool).length === 3, tool);
    const filler = /\+\s*\d+\s*%|percent damage|stat stick/i;
    for (const row of [...TRANSFORMATIONS, ...MUTATIONS, ...TECHNIQUES]) {
      const blob = JSON.stringify(row);
      assert(!filler.test(blob), `stat filler in ${("id" in row && row.id) || "?"}`);
    }
  });

  add("catalog", "no-tool-replaces-the-set", () => {
    for (const tool of TOOL_IDS) {
      const gap = coverageGap(tool);
      assert(gap, `${tool} solved every listed puzzle`);
    }
  });

  add("catalog", "every-transform-has-a-case", () => {
    for (const row of TRANSFORMATIONS) {
      assert(row.testCases.length >= 2, row.id);
      assert(row.activation && row.resource && row.effect && row.tradeoff, row.id);
      assert(row.puzzleRestrictions.length > 0 && row.bossLimits.length > 0, row.id);
      assert(row.cannotReplace.length > 0, row.id);
      for (const form of FORM_IDS) assert(row.formInteraction[form], `${row.id} ${form}`);
    }
  });

  for (const id of TECHNIQUE_IDS) {
    add("technique", id, () => {
      const result = runTechnique(id);
      assert(result.ok, `${result.code}: ${result.detail}`);
    });
  }

  add("transform", "shovel.root", () => {
    const s = fresh();
    s.x = 14;
    s.equipped = ["shovel", "lamp", "boots"];
    const before = s.foes.find((f) => f.boss)!.hp;
    const dug = dispatch(s, { type: "root" });
    assert(dug.ok, dug.detail);
    const crawler = s.foes.find((f) => f.id === "crawler")!;
    assert(crawler.rootedUntil > s.time, "crawler not rooted");
    assert(bossUntouched(before, s), "boss rooted or hurt");
    s.x = 34;
    const stone = dispatch(s, { type: "root" });
    assert(!stone.ok && stone.code === "planted", stone.detail);
    dispatch(s, { type: "release-shovel" });
    s.x = 14;
    assert(dispatch(s, { type: "release-shovel" }).ok, "release");
    s.x = 34;
    const bank = dispatch(s, { type: "root" });
    assert(bank.code === "no-soil", bank.detail);
  });

  add("transform", "shovel.cache", () => {
    const s = fresh();
    s.x = 15;
    s.equipped = ["shovel", "lamp", "boots"];
    dispatch(s, { type: "pickup", id: "creek-coin" });
    assert(dispatch(s, { type: "bury-reward", id: "creek-coin" }).ok, "bury");
    assert(rewardCopies(s, "creek-coin") === 1, "copy");
    assert(s.rewards["creek-coin"]?.where === "buried", "where");
    s.vx = 1;
    assert(dispatch(s, { type: "unearth", id: "creek-coin" }).code === "must-stop", "wanderer moved");
    s.vx = 0;
    assert(dispatch(s, { type: "unearth", id: "creek-coin" }).ok, "unearth");
    assert(s.rewards["creek-coin"]?.where === "world", "world once");
  });

  add("transform", "shovel.scoop", () => {
    const s = fresh();
    s.x = 14;
    s.equipped = ["shovel", "lamp", "boots"];
    dispatch(s, { type: "spawn-projectile", id: "rock", cls: "debris", x: 14.4 });
    dispatch(s, { type: "spawn-projectile", id: "slug", cls: "bullet", x: 14.2 });
    const scooped = dispatch(s, { type: "scoop" });
    assert(scooped.ok && s.soilLoosened && s.debrisDeflected, scooped.detail);
    assert(s.projectiles.find((p) => p.id === "slug")!.alive, "bullet was removed");
    assert(!s.projectiles.find((p) => p.id === "rock")!.alive, "debris stayed");
  });

  add("transform", "sugar.line", () => {
    const s = fresh();
    s.equipped = ["sugar", "lamp", "boots"];
    s.x = 12;
    assert(dispatch(s, { type: "lay-sugar" }).code === "not-at-lip", "mid soil cast");
    s.x = 18;
    const before = s.resources.sugar;
    assert(dispatch(s, { type: "lay-sugar" }).ok, "lip");
    assert(s.resources.sugar === before - 1 && s.lineCast, "spent");
  });

  add("transform", "sugar.candy-shard", () => {
    const s = fresh();
    s.equipped = ["sugar", "glass", "boots"];
    s.x = 18;
    s.lampLit = false;
    dispatch(s, { type: "lay-sugar" });
    const shards = s.resources.shards;
    assert(dispatch(s, { type: "crystallize", heat: "shard" }).ok, "shard heat");
    assert(s.candy?.alive && s.resources.shards === shards - 1, "bridge");
    s.x = 19.4;
    assert(dispatch(s, { type: "move", dir: 1, dt: 0.5 }).ok, "wanderer crosses candy");
    assert(s.x >= 20, "did not step onto span");
  });

  add("transform", "sugar.dust", () => {
    const s = fresh();
    s.equipped = ["sugar", "lamp", "boots"];
    s.x = 16;
    const hp = s.foes.find((f) => f.boss)!.hp;
    assert(dispatch(s, { type: "dust" }).ok && !s.resin, "dust");
    assert(s.foes.find((f) => f.boss)!.hp === hp, "hurt");
    assert(dispatch(s, { type: "dust" }).code === "no-resin", "second");
  });

  add("transform", "boots.leap", () => {
    const slow = fresh();
    slow.equipped = ["boots", "lamp", "shovel"];
    slow.x = 19;
    assert(dispatch(slow, { type: "leap", toX: 28 }).code === "leap-short", "wanderer hopped the ravine");
    const fast = fresh({ form: "smuggler", x: 19 });
    fast.equipped = ["boots", "lamp", "shovel"];
    const landed = dispatch(fast, { type: "leap", toX: 28 });
    assert(landed.ok && Math.abs(fast.x - 28) < 0.05, landed.detail);
  });

  add("transform", "boots.stall", () => {
    const s = fresh();
    s.equipped = ["boots", "lamp", "shovel"];
    s.x = 24;
    s.medium = "pit";
    const poise = s.poise;
    assert(dispatch(s, { type: "stall" }).ok, "stall");
    assert(s.x === 24 && s.medium === "pit" && s.poise === poise - 1, "stall moved or saved");
    const officer = fresh({ form: "officer", x: 24, medium: "pit" });
    officer.equipped = ["boots", "lamp", "shovel"];
    const op = officer.poise;
    dispatch(officer, { type: "stall" });
    assert(officer.poise === op - formStats("officer").stallPoise && officer.x === 24, "officer stall");
  });

  add("transform", "boots.echo", () => {
    const marked = fresh();
    marked.equipped = ["boots", "sugar", "lamp"];
    marked.x = 24;
    marked.medium = "pit";
    marked.lineCast = true;
    assert(dispatch(marked, { type: "echo-land" }).code === "echo", "echo");
    assert(marked.hp === marked.maxHp && mediumOf(marked) === "ground", "hurt on mark");
    const bare = fresh();
    bare.equipped = ["boots", "lamp", "shovel"];
    bare.x = 24;
    bare.medium = "pit";
    const fell = dispatch(bare, { type: "echo-land" });
    assert(fell.code === "death" && bare.hp === 0, fell.detail);
  });

  add("transform", "fins.cut", () => {
    const dry = fresh({ form: "smuggler" });
    dry.equipped = ["fins", "boots", "lamp"];
    dry.x = 36;
    assert(dispatch(dry, { type: "current-cut" }).code === "not-water", "dry cut");
    const wet = fresh({ form: "smuggler", x: 44, medium: "water" });
    wet.equipped = ["fins", "boots", "lamp"];
    wet.waterSpeed = 2.1;
    const vine = () => wet.foes.find((f) => f.id === "vine")!;
    const before = vine().hp;
    const boss = wet.foes.find((f) => f.boss)!.hp;
    assert(dispatch(wet, { type: "current-cut" }).ok, "cut");
    assert(vine().hp < before, "vine unhurt");
    assert(wet.foes.find((f) => f.boss)!.hp === boss, "boss hurt");
    const god = fresh({ form: "god", embryo: true, x: 50, medium: "void" });
    god.equipped = ["fins", "boots", "lamp"];
    god.waterSpeed = 3;
    const heart = god.foes.find((f) => f.boss)!;
    heart.x = 50;
    const cut = dispatch(god, { type: "current-cut" });
    assert(cut.ok && heart.hp === heart.maxHp, cut.detail);
  });

  add("transform", "fins.eddy", () => {
    const s = fresh({ x: 44, medium: "water" });
    s.equipped = ["fins", "keg", "lamp"];
    s.waterSpeed = 1;
    s.lampLit = true;
    dispatch(s, { type: "place-keg", atX: 44 });
    assert(dispatch(s, { type: "eddy" }).ok, "eddy");
    assert(!s.lampLit && s.waterSpeed === 0 && s.kegs[0]?.wet, "not doused");
  });

  add("transform", "fins.undertow", () => {
    const s = fresh({ form: "smuggler", x: 44, medium: "water" });
    s.equipped = ["fins", "boots", "lamp"];
    assert(dispatch(s, { type: "undertow" }).code === "dive", "dive");
    assert(s.divedUntil > s.time, "timer");
    s.medium = "void";
    s.form = "wanderer";
    assert(!dispatch(s, { type: "undertow" }).ok, "wanderer void dive");
  });

  add("transform", "lamp.witness", () => {
    const s = fresh();
    s.equipped = ["lamp", "boots", "shovel"];
    s.x = 34;
    assert(dispatch(s, { type: "witness", lockId: "guest-lock" }).code === "dark", "unlit");
    dispatch(s, { type: "light-lamp" });
    const oil = s.resources.oil;
    assert(dispatch(s, { type: "witness", lockId: "guest-lock" }).ok, "witness");
    assert(s.revealedLocks.includes("guest-lock") && s.resources.oil === oil - 1, "oil");
    s.x = 4;
    dispatch(s, { type: "light-lamp" });
    assert(dispatch(s, { type: "witness", lockId: "ink-lock" }).code === "out-of-range", "range");
  });

  add("transform", "lamp.brand", () => {
    const s = fresh();
    s.equipped = ["lamp", "keg", "boots"];
    s.x = 30;
    s.lampLit = true;
    dispatch(s, { type: "place-keg", atX: 30 });
    const keg = s.kegs[0]!;
    assert(dispatch(s, { type: "brand", targetId: keg.id }).ok, "brand");
    assert(keg.lit, "unlit");
    advance(s, 2);
    assert(s.blasts.length === 0, "early blast");
    advance(s, 1.1);
    assert(s.blasts.length === 1, "no blast");
    advance(s, 5);
    assert(s.blasts.length === 1, "second blast");
  });

  add("transform", "lamp.debt", () => {
    const s = fresh();
    s.equipped = ["lamp", "boots", "shovel"];
    s.x = 34;
    dispatch(s, { type: "light-lamp" });
    assert(dispatch(s, { type: "snuff" }).ok && s.resources.darkCharge === 1, "charge");
    assert(dispatch(s, { type: "witness", lockId: "guest-lock" }).code === "dark", "witness in debt");
    dispatch(s, { type: "light-lamp" });
    assert(dispatch(s, { type: "witness", lockId: "guest-lock" }).ok, "relight");
  });

  add("transform", "hammer.pin", () => {
    const officer = fresh({ form: "officer", x: 38 });
    officer.equipped = ["hammer", "boots", "lamp"];
    const pins = officer.resources.pins;
    assert(dispatch(officer, { type: "pin", seamId: "monument" }).code === "pin-seated", "officer pin");
    assert(officer.resources.pins === pins - 1, "pin count");
    const smuggler = fresh({ form: "smuggler", x: 38 });
    smuggler.equipped = ["hammer", "boots", "lamp"];
    assert(dispatch(smuggler, { type: "pin", seamId: "monument" }).code === "pin-loose", "first tap");
    assert(dispatch(smuggler, { type: "pin", seamId: "monument" }).code === "pin-seated", "second tap");
    assert(smuggler.resources.pins === pins - 1, "two taps one pin");
  });

  add("transform", "hammer.bell", () => {
    const s = fresh();
    s.equipped = ["hammer", "glass", "boots"];
    s.x = 8;
    dispatch(s, { type: "plant-pane" });
    s.x = 34;
    const hp = s.foes.find((f) => f.boss)!.hp;
    assert(dispatch(s, { type: "bell" }).ok, "bell");
    assert(s.alert === 1 && s.cachesMarked && s.foes.find((f) => f.boss)!.hp === hp, "bell side effects");
    assert(!s.pane?.alive, "pane");
  });

  add("transform", "hammer.tap", () => {
    const s = fresh();
    s.equipped = ["hammer", "rod", "boots"];
    s.x = 32;
    const before = s.anchors.find((a) => a.id === "piling-a")!.weight;
    assert(dispatch(s, { type: "weight-tap", anchorId: "piling-a" }).ok, "tap");
    assert(s.weightMemory?.weight === before, "memory");
    assert(s.anchors.find((a) => a.id === "piling-a")!.weight === before, "moved");
  });

  add("transform", "net.return", () => {
    const s = fresh();
    s.equipped = ["net", "boots", "lamp"];
    s.x = 30;
    const tension = s.resources.netTension;
    for (const cls of ["bullet", "void", "slam", "mineral", "debris"] as const) {
      dispatch(s, { type: "spawn-projectile", id: cls, cls, x: 30 });
      const refused = dispatch(s, { type: "catch", projectileId: cls });
      assert(refused.code === "wrong-class", cls);
    }
    assert(s.resources.netTension === tension, "tension taxed");
    dispatch(s, { type: "spawn-projectile", id: "pod", cls: "organic", x: 30.2 });
    assert(dispatch(s, { type: "catch", projectileId: "pod" }).ok, "catch");
    s.foes.find((f) => f.id === "crawler")!.x = 30;
    assert(dispatch(s, { type: "return-shot", targetId: "crawler" }).code === "returned", "return");
    assert(!s.pinBloom, "bloom without roots");
    const heart = s.foes.find((f) => f.boss)!;
    dispatch(s, { type: "spawn-projectile", id: "pod2", cls: "organic", x: s.x });
    dispatch(s, { type: "catch", projectileId: "pod2" });
    const bossHp = heart.hp;
    assert(dispatch(s, { type: "return-shot", targetId: "marble-heart" }).code === "boss-immune", "boss catch");
    assert(heart.hp === bossHp, "boss hurt");
  });

  add("transform", "net.specimen", () => {
    const s = fresh();
    s.equipped = ["net", "boots", "lamp"];
    s.x = 18;
    assert(dispatch(s, { type: "specimen", insectId: "lantern-bug" }).ok, "catch");
    assert(dispatch(s, { type: "release-specimen" }).ok, "release");
    assert(s.insects[0]?.alive && !s.insects[0]?.caught, "dead or stuck");
  });

  add("transform", "net.snare", () => {
    const officer = fresh({ form: "officer", x: 30 });
    officer.equipped = ["net", "boots", "lamp"];
    assert(dispatch(officer, { type: "snare" }).ok, "snare");
    dispatch(officer, { type: "spawn-projectile", id: "wasp", cls: "organic", x: 30 });
    advance(officer, 0.2);
    assert(officer.netTornRoom && officer.resources.netTension === 0, "tear");
    assert(!officer.projectiles.find((p) => p.id === "wasp")!.alive, "missed");
    const smuggler = fresh({ form: "smuggler", x: 30 });
    smuggler.equipped = ["net", "boots", "lamp"];
    dispatch(smuggler, { type: "snare" });
    dispatch(smuggler, { type: "spawn-projectile", id: "wasp", cls: "organic", x: 30 });
    advance(smuggler, 0.2);
    assert(!smuggler.netTornRoom && smuggler.resources.netTension > 0, "smuggler torn");
  });

  add("transform", "glass.pane", () => {
    const s = fresh();
    s.equipped = ["glass", "boots", "lamp"];
    s.x = 6;
    s.hp = 6;
    assert(dispatch(s, { type: "plant-pane" }).ok, "plant");
    s.x = 15;
    dispatch(s, { type: "pickup", id: "creek-coin" });
    s.x = 18;
    const back = dispatch(s, { type: "hit", amount: 999, kind: "physical" });
    assert(back.code === "pane-return" && s.hp === 6 && s.x === 6, back.detail);
    assert(s.rewards["creek-coin"]?.where === "world", "kept post-pane coin");
    assert(rewardCopies(s, "creek-coin") === 1, "dup");
    const killed = dispatch(s, { type: "hit", amount: 999, kind: "physical" });
    assert(killed.code === "death" && s.hp === 0, "second return");
    const exec = fresh();
    exec.equipped = ["glass", "boots", "lamp"];
    exec.x = 6;
    dispatch(exec, { type: "plant-pane", extraShard: true });
    const executed = dispatch(exec, { type: "hit", amount: 999, kind: "execute" });
    assert(executed.code === "death" && exec.pane?.alive, "execute returned");
  });

  add("transform", "glass.mirror", () => {
    const s = fresh();
    s.equipped = ["glass", "lamp", "boots"];
    s.x = 28;
    s.lampLit = true;
    assert(dispatch(s, { type: "witness", lockId: "ink-lock" }).code === "out-of-range", "direct");
    assert(dispatch(s, { type: "mirror", x: 28 }).ok, "mirror");
    assert(dispatch(s, { type: "witness", lockId: "ink-lock" }).ok, "bounce");
  });

  add("transform", "glass.fracture", () => {
    const s = fresh();
    s.equipped = ["glass", "boots", "lamp"];
    s.x = 8;
    dispatch(s, { type: "plant-pane" });
    assert(dispatch(s, { type: "fracture" }).ok && s.fracture?.alive && !s.pane?.alive, "fracture");
    const officer = fresh({ form: "officer", x: 19.2 });
    officer.fracture = { x0: 20, x1: 28, alive: true, onWater: false };
    const crushed = dispatch(officer, { type: "move", dir: 1, dt: 0.4 });
    assert(crushed.code === "crushed-bridge" && !officer.fracture?.alive && officer.x < 20, crushed.detail);
  });

  add("transform", "cape.hem", () => {
    const s = fresh();
    s.equipped = ["cape", "lamp", "boots"];
    s.x = 12;
    s.lampLit = true;
    assert(dispatch(s, { type: "hem", toX: 14 }).code === "need-dark", "lit");
    dispatch(s, { type: "snuff" });
    s.x = 18.2;
    assert(dispatch(s, { type: "hem", toX: 21 }).code === "hem-blocked", "gap");
    s.x = 12;
    assert(dispatch(s, { type: "hem", toX: 14.5 }).ok, "channel");
    assert(Math.abs(s.x - 12) < 0.05, "early move");
    advance(s, 0.4);
    assert(Math.abs(s.x - 14.5) < 0.05, "did not commit");
  });

  add("transform", "cape.fold", () => {
    const s = fresh();
    s.equipped = ["shovel", "cape", "boots"];
    s.x = 15;
    dispatch(s, { type: "pickup", id: "creek-coin" });
    dispatch(s, { type: "bury-reward", id: "creek-coin" });
    s.equipped = ["cape", "shovel", "boots"];
    const folds = s.resources.capeFolds;
    assert(dispatch(s, { type: "fold", targetId: "creek-coin" }).ok, "fold");
    assert(s.resources.capeFolds === folds - 1, "fold free");
    s.kegs.push({ id: "lit-keg", x: 15, lit: true, wet: false, fuseAt: 9, shapedAnchor: null, buried: false });
    assert(dispatch(s, { type: "fold", targetId: "lit-keg" }).code !== "cache-folded", "hid a lit keg");
  });

  add("transform", "cape.dusk", () => {
    const s = fresh();
    s.equipped = ["net", "cape", "boots"];
    s.x = 18;
    dispatch(s, { type: "spawn-projectile", id: "a", cls: "organic", x: 18 });
    dispatch(s, { type: "catch", projectileId: "a" });
    assert(dispatch(s, { type: "spawn-projectile", id: "b", cls: "organic", x: 18 }).ok, "spawn");
    assert(dispatch(s, { type: "catch", projectileId: "b" }).code === "hands-full", "second catch");
    assert(dispatch(s, { type: "dusk-carry" }).ok, "dusk");
    assert(dispatch(s, { type: "catch", projectileId: "b" }).ok, "freed net");
  });

  add("transform", "rod.transfer", () => {
    const s = fresh();
    s.equipped = ["rod", "boots", "lamp"];
    s.x = 34;
    const sum = (s.anchors.find((a) => a.id === "piling-a")!.weight) + (s.anchors.find((a) => a.id === "piling-b")!.weight);
    assert(dispatch(s, { type: "transfer", fromId: "piling-a", toId: "piling-b", amount: 2 }).ok, "t1");
    assert(!s.sluiceOpen, "opened early");
    assert(dispatch(s, { type: "transfer", fromId: "piling-a", toId: "piling-b", amount: 1 }).ok, "t2");
    const a = s.anchors.find((x) => x.id === "piling-a")!.weight;
    const b = s.anchors.find((x) => x.id === "piling-b")!.weight;
    assert(a + b === sum && b === 4 && s.sluiceOpen, `${a}+${b}`);
    assert(rewardCopies(s, "sluice-token") === 1, "token");
    assert(!dispatch(s, { type: "grant", id: "sluice-token" }).ok, "remint");
    const light = fresh({ form: "smuggler" });
    light.equipped = ["rod", "boots", "lamp"];
    assert(dispatch(light, { type: "transfer", fromId: "piling-a", toId: "piling-b", amount: 2 }).code === "over-cap", "smuggler cap");
  });

  add("transform", "rod.brace", () => {
    const s = fresh();
    s.equipped = ["rod", "boots", "shovel"];
    s.x = 19;
    dispatch(s, { type: "brace" });
    const leaped = dispatch(s, { type: "leap", toX: 28 });
    assert(leaped.ok, leaped.detail);
    advance(s, 0.4);
    assert(Math.abs(s.x - 28) < 0.05, `x=${s.x}`);
    assert(s.rodPlanted, "rod came along");
  });

  add("transform", "rod.lockbar", () => {
    const s = fresh({ form: "smuggler", x: 19 });
    s.equipped = ["rod", "boots", "keg"];
    dispatch(s, { type: "brace" });
    assert(dispatch(s, { type: "lockbar", toAnchor: "piling-a" }).ok, "bar");
    assert(!dispatch(s, { type: "place-keg", atX: 24 }).ok, "keg stayed on the bar");
  });

  add("transform", "bow.thread", () => {
    const s = fresh();
    s.equipped = ["bow", "boots", "lamp"];
    s.x = 32;
    const hp = s.foes.find((f) => f.boss)!.hp;
    const ash = s.resources.ash;
    assert(dispatch(s, { type: "ash-shot", targetId: "piling-a" }).code === "marked", "mark");
    assert(s.marks.includes("piling-a") && s.resources.ash === ash - 1, "ash");
    assert(dispatch(s, { type: "ash-shot", targetId: "marble-heart" }).code === "shattered", "heart");
    assert(s.foes.find((f) => f.boss)!.hp === hp, "damage");
  });

  add("transform", "bow.cinder", () => {
    const s = fresh();
    s.equipped = ["bow", "lamp", "keg"];
    s.x = 30;
    s.wind = true;
    s.lampLit = true;
    dispatch(s, { type: "place-keg", atX: 36 });
    const keg = s.kegs[0]!;
    assert(dispatch(s, { type: "cinder", targetId: keg.id }).code === "wind", "wind");
    assert(!keg.lit, "lit in wind");
  });

  add("transform", "bow.grave", () => {
    const s = fresh();
    s.equipped = ["bow", "shovel", "boots"];
    s.x = 14;
    assert(dispatch(s, { type: "grave-arc" }).code === "no-loose-soil", "tight soil");
    dispatch(s, { type: "scoop" });
    assert(dispatch(s, { type: "grave-arc" }).ok, "stake");
    assert(s.foes.find((f) => f.boss)!.rootedUntil <= s.time, "boss staked");
  });

  add("transform", "keg.fuse-death", () => {
    const s = fresh();
    s.equipped = ["keg", "lamp", "boots"];
    s.x = 30;
    s.lampLit = true;
    const start = kegTotal(s);
    dispatch(s, { type: "place-keg", atX: 30 });
    const keg = s.kegs[0]!;
    dispatch(s, { type: "brand", targetId: keg.id });
    dispatch(s, { type: "die" });
    assert(s.kegs.length === 1 && s.kegs[0]!.lit, "fuse vanished or copied");
    assert(kegTotal(s) === start, `total ${kegTotal(s)} vs ${start}`);
    advance(s, 3.2);
    assert(s.blasts.length === 1 && s.kegs.length === 0, "double or none");
    assert(kegTotal(s) === start - 1, "refund");
  });

  add("transform", "keg.salvage", () => {
    const s = fresh();
    s.equipped = ["keg", "lamp", "shovel"];
    s.x = 15;
    s.lampLit = true;
    const ash = s.resources.ash;
    const kegs = kegTotal(s);
    dispatch(s, { type: "place-keg", atX: 15 });
    dispatch(s, { type: "brand", targetId: s.kegs[0]!.id });
    advance(s, 3.2);
    const blast = s.blasts[0]!;
    assert(blast.inSoil, "not soil");
    assert(dispatch(s, { type: "salvage", blastId: blast.id }).ok, "salvage");
    assert(s.resources.ash === ash + 1, "ash");
    assert(kegTotal(s) === kegs - 1, "keg refunded");
    assert(dispatch(s, { type: "salvage", blastId: blast.id }).code === "already-salvaged", "twice");
  });

  add("mutation", "wanderer-channel-and-memory", () => {
    const s = fresh();
    s.equipped = ["cape", "lamp", "shovel"];
    s.x = 12;
    dispatch(s, { type: "light-lamp" });
    dispatch(s, { type: "snuff" });
    dispatch(s, { type: "hem", toX: 14 });
    const poise = s.poise;
    const second = dispatch(s, { type: "hem", toX: 13 });
    assert(second.code === "channel-busy" && s.poise === poise, "wanderer residue");
    const smuggler = fresh({ form: "smuggler", x: 12 });
    smuggler.equipped = ["cape", "lamp", "shovel"];
    smuggler.lampLit = false;
    dispatch(smuggler, { type: "hem", toX: 14 });
    const sp = smuggler.poise;
    dispatch(smuggler, { type: "hem", toX: 13 });
    assert(smuggler.poise === sp - 1, "smuggler poise");
    const memory = fresh();
    memory.equipped = ["shovel", "glass", "boots"];
    memory.x = 14;
    dispatch(memory, { type: "root" });
    memory.x = 16;
    dispatch(memory, { type: "release-shovel" });
    memory.equipped = ["glass", "boots", "lamp"];
    dispatch(memory, { type: "plant-pane" });
    assert(memory.pane?.x === 14, "grave memory ignored");
  });

  add("mutation", "wanderer-breath-bulk-gate", () => {
    const s = fresh();
    s.equipped = ["fins", "boots", "lamp"];
    s.x = 41;
    s.medium = "water";
    for (let i = 0; i < 12 && s.medium === "water"; i += 1) tick(s, 0.5, 1);
    assert(mediumOf(s) === "ground" && s.x < 40, "wanderer stayed under");
    const bulk = fresh();
    bulk.equipped = ["net", "keg", "boots"];
    bulk.x = 18;
    dispatch(bulk, { type: "specimen", insectId: "lantern-bug" });
    assert(dispatch(bulk, { type: "place-keg" }).code === "bulk", "carried both");
    bulk.equipped = ["net", "keg", "cape"];
    dispatch(bulk, { type: "dusk-carry" });
    assert(dispatch(bulk, { type: "place-keg" }).ok, "dusk did not free the bulk");
    const gate = fresh();
    assert(dispatch(gate, { type: "pass-gate" }).code === "gate-shut", "wanderer walked in");
    gate.form = "officer";
    assert(dispatch(gate, { type: "pass-gate" }).code === "gate-open", "officer refused");
  });

  add("mutation", "smuggler-draw-fuse-gate", () => {
    const s = fresh({ form: "smuggler", x: 19 });
    s.equipped = ["boots", "lamp", "shovel"];
    const leaped = dispatch(s, { type: "leap", toX: 28 });
    assert(leaped.code === "leap-commit" && Math.abs(s.x - 28) < 0.05, leaped.detail);
    const fuse = fresh({ form: "smuggler", x: 30 });
    fuse.equipped = ["keg", "lamp", "boots"];
    fuse.lampLit = true;
    dispatch(fuse, { type: "place-keg", atX: 30 });
    dispatch(fuse, { type: "brand", targetId: fuse.kegs[0]!.id });
    assert(Math.abs(fuse.kegs[0]!.fuseAt - fuse.time - 4.2) < 0.01, "fuse variance");
    assert(dispatch(fresh({ form: "smuggler" }), { type: "pass-gate" }).code === "gate-hostile", "gate");
    const alerted = fresh({ form: "smuggler", x: 34 });
    alerted.equipped = ["hammer", "boots", "lamp"];
    dispatch(alerted, { type: "bell" });
    assert(alerted.alert === 2, "alert");
  });

  add("mutation", "smuggler-cache-runner-hem", () => {
    const s = fresh({ form: "smuggler", x: 15 });
    s.equipped = ["shovel", "boots", "lamp"];
    dispatch(s, { type: "pickup", id: "creek-coin" });
    dispatch(s, { type: "bury-reward", id: "creek-coin" });
    s.vx = 3;
    assert(dispatch(s, { type: "unearth", id: "creek-coin" }).ok, "runner");
    s.x = 32;
    s.equipped = ["cape", "boots", "lamp"];
    s.lampLit = false;
    assert(dispatch(s, { type: "hem", toX: 37.5 }).ok, "fog hem");
  });

  add("mutation", "officer-mass-pin-net-crush", () => {
    const s = fresh({ form: "officer", x: 38, medium: "ground" });
    s.anchors = s.anchors.filter((a) => a.kind !== "piling");
    s.stripPilings = true;
    s.equipped = ["hammer", "rod", "boots"];
    dispatch(s, { type: "pin", seamId: "monument" });
    assert(dispatch(s, { type: "transfer", fromId: "officer-self", toId: "pin-monument", amount: 4 }).ok, "seat");
    assert(formStats("officer").mass === 1.8, "mass changed");
    s.candy = { x0: 20, x1: 28, alive: true };
    s.x = 19.3;
    assert(dispatch(s, { type: "move", dir: 1, dt: 0.3 }).code === "crushed-bridge", "crush");
  });

  add("mutation", "officer-sprint-gate-void-bow", () => {
    const s = fresh({ form: "officer" });
    s.equipped = ["fins", "boots", "lamp"];
    s.x = 41;
    s.medium = "water";
    for (let i = 0; i < 20 && s.medium === "water"; i += 1) tick(s, 0.4, 1);
    assert(s.waterSpeed < formStats("officer").cutThreshold, `speed ${s.waterSpeed}`);
    assert(dispatch(s, { type: "current-cut" }).code === "not-water" || mediumOf(s) === "ground", "cut from a sprint the officer does not have");
    const jar = fresh({ form: "officer", x: 6 });
    jar.equipped = ["boots", "lamp", "shovel"];
    assert(dispatch(jar, { type: "pickup", id: "homestead-jar" }).code === "civilian-cache", "jar");
    dispatch(jar, { type: "light-lamp" });
    jar.x = 34;
    dispatch(jar, { type: "witness", lockId: "guest-lock" });
    jar.x = 6;
    assert(dispatch(jar, { type: "pickup", id: "homestead-jar" }).ok, "guest");
    jar.embryo = true;
    jar.x = 47;
    assert(dispatch(jar, { type: "enter-void" }).code === "void-refusal", "void");
    const bow = fresh({ form: "officer", x: 30 });
    bow.equipped = ["bow", "boots", "lamp"];
    bow.carryingKeg = true;
    assert(dispatch(bow, { type: "ash-shot", targetId: "piling-a" }).code === "hands-full", "nocked with keg");
    bow.carryingKeg = false;
    bow.equipped = ["keg", "boots", "lamp"];
    assert(dispatch(bow, { type: "place-keg", atX: 30 }).code === "place-channel", "instant place");
  });

  add("mutation", "god-late-nominal-death-humility", () => {
    const early = fresh();
    assert(dispatch(early, { type: "set-form", form: "god" }).code === "embryo-late", "early god");
    const god = fresh({ form: "god", embryo: true, x: 50, medium: "void" });
    god.equipped = ["rod", "boots", "fins"];
    god.voidMemory = true;
    const a = god.anchors.find((x) => x.id === "piling-a")!;
    const b = god.anchors.find((x) => x.id === "piling-b")!;
    const real = a.weight + b.weight;
    assert(dispatch(god, { type: "transfer", fromId: "piling-a", toId: "piling-b", amount: 2 }).code === "nominal-transfer", "real move");
    assert(a.weight + b.weight === real && a.weight === 3, "real weight changed in the void");
    god.resources.kegs = 1;
    god.equipped = ["keg", "fins", "net"];
    assert(!dispatch(god, { type: "place-keg" }).ok, "keg");
    dispatch(god, { type: "spawn-projectile", id: "spear", cls: "void", x: god.x });
    assert(dispatch(god, { type: "catch", projectileId: "spear" }).code === "wrong-class", "spear");
    god.equipped = ["glass", "fins", "boots"];
    god.resources.shards = 3;
    god.medium = "ground";
    god.x = 8;
    dispatch(god, { type: "plant-pane" });
    god.medium = "void";
    god.x = 50;
    assert(dispatch(god, { type: "hit", amount: 999, kind: "void" }).code === "death", "ordinary pane pulled out of void");
    const paid = fresh({ form: "god", embryo: true, x: 8 });
    paid.equipped = ["glass", "fins", "boots"];
    dispatch(paid, { type: "plant-pane", extraShard: true });
    paid.medium = "void";
    paid.x = 50;
    assert(dispatch(paid, { type: "hit", amount: 999, kind: "void" }).code === "pane-return", "extra shard");
    paid.medium = "void";
    paid.x = 50;
    paid.equipped = ["bow", "lamp", "fins"];
    paid.lampLit = true;
    assert(dispatch(paid, { type: "ash-shot", targetId: "marble-heart" }).code === "cold-ash", "cold ash");
    paid.kegs.push({ id: "void-keg", x: 50, lit: false, wet: false, fuseAt: 0, shapedAnchor: null, buried: false });
    assert(dispatch(paid, { type: "cinder", targetId: "void-keg" }).code === "cinder-void", "cinder crossed the void");
    const pile = fresh({ form: "god", embryo: true, medium: "void", x: 50 });
    pile.resources.kegs = 1;
    pile.rewards["relic"] = { where: "inventory", x: 50, civilian: false };
    dispatch(pile, { type: "die", kind: "void" });
    dispatch(pile, { type: "die", kind: "void" });
    const gate = pile.piles["void-gate"];
    assert(gate && gate.rewardIds.filter((id) => id === "relic").length === 1, "void pile copied the relic");
    assert(gate.kegs === 1, `kegs ${gate?.kegs}`);
  });

  add("safety", "collision-recover", () => {
    const s = fresh();
    s.equipped = ["boots", "lamp", "shovel"];
    s.x = 19;
    s.lastFree = 19;
    const hp = s.hp;
    const leaped = dispatch(s, { type: "leap", toX: 24 });
    assert(!leaped.ok && leaped.code === "collision-recover", leaped.detail);
    assert(s.x === 19 && s.hp === hp && s.collisionRecoveries >= 1, "clipped");
    s.equipped = ["keg", "boots", "lamp"];
    const stock = s.resources.kegs;
    const placed = dispatch(s, { type: "place-keg", atX: 56 });
    assert(!placed.ok && s.resources.kegs === stock && s.kegs.length === 0, "keg duplicated into the wall");
  });

  add("safety", "loadout-and-god-flag", () => {
    const s = fresh();
    assert(dispatch(s, { type: "equip", tools: ["shovel", "lamp", "boots", "net"] }).code === "loadout-cap", "four tools");
    assert(s.equipped.length === 3, "equipped anyway");
    const bad = validateLoadout("god", ["fins", "glass", "cape"], false);
    assert(!bad.ok && bad.errors.includes("embryo-late"), "validator");
    const warn = validateLoadout("officer", ["fins", "keg", "sugar"], true);
    assert(warn.ok && warn.warnings.length >= 2, "warnings missing");
    assert(LOADOUT_MAX === 3, "cap");
  });

  add("safety", "softlock-audit", () => {
    const honest = auditHonestCreek();
    assert(honest.ok, honest.reason);
    const trap = auditTrap();
    assert(!trap.ok, "trap room was called solvable");
  });

  add("safety", "boss-not-trivial", () => {
    const s = fresh({ x: 38 });
    s.equipped = ["shovel", "net", "keg"];
    const heart = () => s.foes.find((f) => f.boss)!;
    const phase = heart().hp;
    dispatch(s, { type: "root" });
    s.x = 39;
    dispatch(s, { type: "spawn-projectile", id: "seed", cls: "organic", x: 39 });
    dispatch(s, { type: "catch", projectileId: "seed" });
    dispatch(s, { type: "return-shot", targetId: "marble-heart" });
    s.equipped = ["keg", "lamp", "bow"];
    s.lampLit = true;
    dispatch(s, { type: "place-keg", atX: 39 });
    dispatch(s, { type: "brand", targetId: s.kegs[0]!.id });
    advance(s, 3.2);
    dispatch(s, { type: "ash-shot", targetId: "marble-heart" });
    assert(heart().hp === phase && heart().alive, `boss hp ${heart().hp}`);
  });

  add("honesty", "lab-and-engine-flags", () => {
    const lab = TRANSFORMATIONS.filter((t) => t.labDemonstrated);
    assert(lab.length >= 12, `lab ${lab.length}`);
    assert(new Set(lab.map((t) => t.tool)).size === 12, "a tool family has no lab demonstration");
    for (const row of TRANSFORMATIONS) assert(row.engineDemonstrated, `${row.id} marked undemonstrated`);
    for (const row of MUTATIONS) assert(row.engineDemonstrated, row.id);
    for (const row of TECHNIQUES) assert(row.engineDemonstrated, row.id);
    assert(!TECHNIQUES.some((t) => !TECHNIQUE_IDS.includes(t.id as (typeof TECHNIQUE_IDS)[number])), "orphan technique");
  });

  const failed = results.filter((r) => !r.ok).length;
  return { passed: results.length - failed, failed, results };
}

export function auditHonestCreek(): { ok: boolean; reason: string } {
  const s = fresh();
  s.equipped = ["sugar", "lamp", "boots"];
  s.x = 18;
  const steps: Array<() => { ok: boolean; code: string }> = [
    () => dispatch(s, { type: "light-lamp" }),
    () => dispatch(s, { type: "lay-sugar" }),
    () => dispatch(s, { type: "crystallize", heat: "lamp" }),
    () => dispatch(s, { type: "move", dir: 1, dt: 2.2 }),
    () => dispatch(s, { type: "equip", tools: ["rod", "boots", "lamp"] }),
    () => dispatch(s, { type: "transfer", fromId: "piling-a", toId: "piling-b", amount: 2 }),
    () => dispatch(s, { type: "transfer", fromId: "piling-a", toId: "piling-b", amount: 1 }),
  ];
  for (const step of steps) {
    const result = step();
    if (!result.ok) return { ok: false, reason: `baseline-failed:${result.code}` };
  }
  if (!s.sluiceOpen) return { ok: false, reason: "goal-unmet" };
  if (s.hp <= 0) return { ok: false, reason: "died-on-baseline" };
  return { ok: true, reason: "baseline-reaches-sluice" };
}

export function auditTrap(): { ok: boolean; reason: string } {
  const s = fresh();
  s.resources.shards = 0;
  s.equipped = ["glass", "boots", "lamp"];
  const laid = dispatch(s, { type: "fracture" });
  if (laid.ok) return { ok: true, reason: "trap-was-open" };
  const leap = dispatch(s, { type: "leap", toX: 28 });
  if (leap.ok) return { ok: true, reason: "boots-solved-a-shard-trap" };
  return { ok: false, reason: "no-baseline: last shard is absent and boots cannot cross" };
}
