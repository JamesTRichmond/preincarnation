/**
 * One specific effect check per masterwork, plus the legacy kit that must stay.
 * Throws on failure. Imported by the yard, so this file does not touch node:test.
 */
import { itemById, lootId } from "./items.ts";
import { legacyKeepsWeapon } from "./legacy.ts";
import {
  advance,
  armTelegraph,
  beginAttack,
  clearFoes,
  clearMovables,
  createSim,
  currentReach,
  cycleForm,
  dodge,
  dodgeBoots,
  equip,
  equipLegacy,
  foeById,
  forceCoin,
  graveRecord,
  hurtPlayer,
  interrupt,
  invokeLegacyVerb,
  modifyPiece,
  placeFoe,
  placeMovable,
  placePlayer,
  resetResources,
  resourceOf,
  setApproach,
  setHp,
  setIntent,
  setLantern,
  setRelics,
  setSwinging,
  setTile,
  shove,
  stepFoe,
  stepTile,
  strikeNow,
  swapWeapon,
  tick,
  playTrinket,
  playUtility,
  writeResource,
  type Sim,
} from "./sim.ts";

const id = lootId;

function fail(n: number, label: string): never {
  throw new Error(`#${String(n).padStart(3, "0")} ${label}`);
}
function near(n: number, got: number, want: number, label: string) {
  if (!Number.isFinite(got) || Math.abs(got - want) > 1e-4) fail(n, `${label}: got ${got} want ${want}`);
}
function eq(n: number, got: unknown, want: unknown, label: string) {
  if (got !== want) fail(n, `${label}: got ${String(got)} want ${String(want)}`);
}
function cut(sim: Sim, who = "foe") {
  return sim.log.filter((e) => e.t === "damage" && e.to === who).reduce((s, e) => s + (e.t === "damage" ? e.amount : 0), 0);
}
function selfD(sim: Sim) {
  return sim.log.filter((e) => e.t === "self").reduce((s, e) => s + (e.t === "self" ? e.amount : 0), 0);
}
function noted(sim: Sim, text: string) {
  return sim.log.some((e) => e.t === "note" && e.text === text);
}
function whiff(sim: Sim, why: string) {
  return sim.log.some((e) => e.t === "whiff" && e.why === why);
}
function dodgeWindow(sim: Sim) {
  const ev = [...sim.log].reverse().find((e) => e.t === "dodge");
  return ev && ev.t === "dodge" ? ev.window : "";
}
function wipe(sim: Sim) {
  sim.log = [];
}
function yard() {
  return createSim();
}
function open() {
  const sim = createSim();
  clearMovables(sim);
  return sim;
}
function wear(sim: Sim, n: number) {
  return equip(sim, slotOf(n), id(n))!;
}
function slotOf(n: number): "weapon" | "wearable" | "trinket" | "utility" {
  if (n <= 20) return "weapon";
  if (n <= 40) return "wearable";
  if (n <= 60) return "trinket";
  return "utility";
}
function beside(sim: Sim, hp = 20) {
  placeFoe(sim, "foe", sim.player.x + 1, sim.player.y, hp);
  return foeById(sim);
}
function far(sim: Sim, hp = 20) {
  placeFoe(sim, "foe", sim.player.x + 2, sim.player.y, hp);
  return foeById(sim);
}

const proofs: Record<number, () => void> = {};

export function runProof(n: number) {
  const fn = proofs[n];
  if (!fn) throw new Error(`No proof for ${n}`);
  fn();
}

export type ProofResult = { n: number; name: string; ok: boolean; error: string };

export function runAllProofs(): ProofResult[] {
  const out: ProofResult[] = [];
  for (let n = 1; n <= 80; n++) {
    const name = itemById(id(n)).name;
    try {
      runProof(n);
      out.push({ n, name, ok: true, error: "" });
    } catch (err) {
      out.push({ n, name, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  try {
    legacyStillThere();
    out.push({ n: 0, name: "Legacy kit", ok: true, error: "" });
  } catch (err) {
    out.push({ n: 0, name: "Legacy kit", ok: false, error: err instanceof Error ? err.message : String(err) });
  }
  return out;
}

export function legacyStillThere() {
  const sim = createSim();
  const relics = sim.relics.join(",");
  const blade = equip(sim, "weapon", id(1))!;
  equip(sim, "wearable", id(21));
  equip(sim, "trinket", id(41));
  equip(sim, "utility", id(61));
  if (sim.relics.join(",") !== relics) throw new Error("equipping masterworks spliced relics");
  if (sim.legacyWeapon.id !== "starter-iron") throw new Error("starter iron was deleted");
  invokeLegacyVerb(sim, "shovel");
  if (!sim.excavated.length) throw new Error("shovel did not dig");
  dodgeBoots(sim);
  if (sim.player.iframe < 0.28) throw new Error("gap boots lost their dash");
  const kept = graveRecord(blade);
  if (!legacyKeepsWeapon(kept.magic, 40, () => 1)) throw new Error("grave dropped a masterwork");
  if (legacyKeepsWeapon(false, 12, () => 1)) throw new Error("mundane steel survived a hard grave");
  equip(sim, "trinket", null);
  equip(sim, "utility", null);
  equipLegacy(sim, "rifle");
  if (sim.legacyWeapon.ammo !== 6) throw new Error("rifle ammo");
  beside(sim);
  strikeNow(sim);
  if (Number(sim.legacyWeapon.ammo) !== 5) throw new Error("rifle did not spend a round");
  if (cut(sim) < 2.2) throw new Error("rifle under the masterwork numbers");
  sim.legacyWeapon.ammo = 0;
  const dealt = cut(sim);
  strikeNow(sim);
  if (!whiff(sim, "ammo")) throw new Error("empty rifle still fired");
  if (cut(sim) !== dealt) throw new Error("empty rifle dealt damage");
  if (sim.slots.weapon) throw new Error("rifle was replaced by a masterwork");
}

proofs[1] = () => {
  const sim = open();
  const blade = wear(sim, 1);
  far(sim);
  strikeNow(sim);
  near(1, cut(sim), 1.7, "open margin");
  blade.form = "narrow";
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(1, cut(sim), 1.15, "narrow clear");
  blade.form = "open";
  beside(sim);
  wipe(sim);
  strikeNow(sim);
  near(1, cut(sim), 0.45, "cramped");
  blade.form = "narrow";
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(1, cut(sim), 0.55, "narrow blocked");
  blade.form = "open";
  modifyPiece(sim, "weapon", "wider-margin");
  far(sim);
  placeMovable(sim, "pot", 6, 5);
  wipe(sim);
  strikeNow(sim);
  near(1, cut(sim), 0.45, "wider diagonal");
  eq(1, blade.mods[0]?.tag, "wider-margin", "mod kept");
};

proofs[2] = () => {
  const sim = open();
  wear(sim, 2);
  beside(sim);
  armTelegraph(sim, "foe", { delay: 1, kind: "line" });
  strikeNow(sim);
  near(2, cut(sim), 1.8, "telegraph");
  foeById(sim).delayed = null;
  setSwinging(sim, "foe", true);
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(2, cut(sim), 0.4, "trading");
  setSwinging(sim, "foe", false);
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(2, cut(sim), 0.85, "idle");
};

proofs[3] = () => {
  const back = open();
  wear(back, 3);
  stepTile(back, 3);
  placePlayer(back, back.player.x, back.player.y, 1);
  placeFoe(back, "foe", back.player.x + 2, back.player.y, 20);
  strikeNow(back);
  near(3, cut(back), 1.6, "backstep");
  const fwd = open();
  wear(fwd, 3);
  placeFoe(fwd, "foe", 8, 4, 20);
  stepTile(fwd, 1);
  strikeNow(fwd);
  near(3, cut(fwd), 0.3, "lunge");
  const still = open();
  wear(still, 3);
  far(still);
  strikeNow(still);
  near(3, cut(still), 0.7, "still");
};

proofs[4] = () => {
  const sim = open();
  wear(sim, 4);
  beside(sim);
  strikeNow(sim);
  near(4, cut(sim), 0.5, "moving rod");
  const held = open();
  wear(held, 4);
  advance(held, 0.6);
  beside(held);
  strikeNow(held);
  near(4, cut(held), 1.65, "still water");
};

proofs[5] = () => {
  const sim = open();
  wear(sim, 5);
  beside(sim);
  strikeNow(sim);
  near(5, cut(sim), 0.4, "bank open");
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(5, cut(sim), 0.9, "bank paid");
  if (!noted(sim, "bank-paid")) fail(5, "no bank note");
  const other = open();
  wear(other, 5);
  beside(other);
  strikeNow(other);
  placeFoe(other, "foe", 9, 1, 20);
  placeFoe(other, "other", 6, 4, 20);
  wipe(other);
  strikeNow(other);
  near(5, cut(other, "other"), 0.4, "voided bank");
  if (noted(other, "bank-paid")) fail(5, "paid the wrong body");
  const late = open();
  wear(late, 5);
  beside(late);
  strikeNow(late);
  advance(late, 0.55);
  wipe(late);
  foeById(late).hp = 20;
  strikeNow(late);
  near(5, cut(late), 0.4, "expired bank");
};

proofs[6] = () => {
  const one = open();
  wear(one, 6);
  beside(one);
  strikeNow(one);
  near(6, cut(one), 1, "single fan");
  const crowd = open();
  wear(crowd, 6);
  clearFoes(crowd);
  placeFoe(crowd, "foe", 6, 4, 20);
  placeFoe(crowd, "a", 6, 5, 20);
  placeFoe(crowd, "b", 7, 4, 20);
  strikeNow(crowd);
  near(6, cut(crowd, "foe"), 1 / 3, "split a");
  near(6, cut(crowd, "a"), 1 / 3, "split b");
  near(6, cut(crowd, "b"), 1 / 3, "split c");
};

proofs[7] = () => {
  const pinch = open();
  wear(pinch, 7);
  placePlayer(pinch, 1, 4, 2);
  placeFoe(pinch, "foe", 1, 5, 20);
  strikeNow(pinch);
  near(7, cut(pinch), 1.5, "vein");
  const field = open();
  wear(field, 7);
  beside(field);
  strikeNow(field);
  near(7, cut(field), 0.6, "open jab");
};

proofs[8] = () => {
  const land = open();
  wear(land, 8);
  const foe = far(land);
  strikeNow(land);
  eq(8, cut(land), 0, "dry cut");
  eq(8, foe.x, 8, "shoved");
  if (!whiff(land, "land-shove")) fail(8, "no shove");
  const wet = open();
  wear(wet, 8);
  setTile(wet, 7, 4, "water");
  far(wet);
  strikeNow(wet);
  near(8, cut(wet), 1.8, "water cut");
};

proofs[9] = () => {
  const sim = open();
  wear(sim, 9);
  const foe = beside(sim);
  strikeNow(sim);
  near(9, cut(sim), 1, "ladle");
  eq(9, foe.rooted, 999, "hitched");
  const x = sim.player.x;
  stepTile(sim, 3);
  if (sim.player.x === x) fail(9, "could not break hitch");
  eq(9, foe.rooted, 0, "foe freed");
  if (sim.player.rooted < 0.4) fail(9, "no hitch-break root");
  if (!noted(sim, "hitch-break")) fail(9, "no note");
};

proofs[10] = () => {
  const sim = open();
  wear(sim, 10);
  placeFoe(sim, "foe", 8, 4, 20);
  strikeNow(sim);
  near(10, cut(sim), 1.4, "lob");
  const cutOff = open();
  wear(cutOff, 10);
  placeFoe(cutOff, "foe", 8, 4, 20);
  beginAttack(cutOff);
  advance(cutOff, 0.25);
  interrupt(cutOff);
  if (!noted(cutOff, "lob-cancel")) fail(10, "lob survived interrupt");
  advance(cutOff, 1);
  eq(10, cut(cutOff), 0, "cancelled lob");
};

proofs[11] = () => {
  const sim = open();
  wear(sim, 11);
  beside(sim);
  armTelegraph(sim, "foe", { delay: 1, kind: "line" });
  strikeNow(sim);
  eq(11, cut(sim), 0, "scout deals nothing");
  if (!whiff(sim, "scout")) fail(11, "no scout");
  if (!foeById(sim).delayed?.revealed) fail(11, "path hidden");
  const idle = open();
  wear(idle, 11);
  beside(idle);
  strikeNow(idle);
  if (!whiff(idle, "idle-brand")) fail(11, "idle brand swung");
  if (idle.player.rooted <= 0) fail(11, "idle brand did not root");
};

proofs[12] = () => {
  const sim = open();
  wear(sim, 12);
  far(sim);
  dodge(sim);
  hurtPlayer(sim, 3, "melee");
  if (!noted(sim, "avoided")) fail(12, "iframe did not bank");
  if (sim.player.absence < 1) fail(12, "no absence");
  strikeNow(sim);
  near(12, cut(sim), 2, "spent absence");
  const bare = open();
  wear(bare, 12);
  beside(bare);
  strikeNow(bare);
  near(12, cut(bare), 0.35, "unbanked");
};

proofs[13] = () => {
  const sim = open();
  wear(sim, 13);
  far(sim);
  setApproach(sim, "foe", 1);
  strikeNow(sim);
  near(13, cut(sim), 1.7, "stepping in");
  setApproach(sim, "foe", -1);
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(13, cut(sim), 0.25, "falling back");
  setApproach(sim, "foe", 0);
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(13, cut(sim), 0.8, "flat");
};

proofs[14] = () => {
  const sim = open();
  wear(sim, 14);
  beside(sim);
  strikeNow(sim);
  near(14, cut(sim), 1.9, "measured");
  const bad = open();
  wear(bad, 14);
  beside(bad);
  beginAttack(bad);
  eq(14, bad.player.attack?.phase, "windup", "windup");
  interrupt(bad);
  eq(14, bad.player.attack, null, "cancelled");
  eq(14, cut(bad), 0, "no foe cut");
  eq(14, bad.player.hp, 5, "self");
};

proofs[15] = () => {
  const sim = open();
  wear(sim, 15);
  beside(sim);
  strikeNow(sim);
  near(15, cut(sim), 1.15, "first");
  wipe(sim);
  strikeNow(sim);
  eq(15, cut(sim), 0, "repeat");
  if (!whiff(sim, "courtesy")) fail(15, "no courtesy");
};

proofs[16] = () => {
  const on = open();
  wear(on, 16);
  placePlayer(on, 7, 2, 1);
  placeFoe(on, "foe", 8, 2, 20);
  strikeNow(on);
  near(16, cut(on), 2, "grave");
  const off = open();
  wear(off, 16);
  placePlayer(off, 7, 3, 1);
  placeFoe(off, "foe", 8, 3, 20);
  strikeNow(off);
  near(16, cut(off), 0.4, "off grave");
};

proofs[17] = () => {
  const sim = open();
  const gun = wear(sim, 17);
  far(sim);
  strikeNow(sim);
  near(17, cut(sim), 1.6, "ribbon");
  eq(17, resourceOf(sim, gun.identity, "ribbon"), 0, "spent");
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  eq(17, cut(sim), 0, "dry");
  if (!whiff(sim, "ribbon")) fail(17, "no dry note");
  wear(sim, 1);
  swapWeapon(sim);
  eq(17, sim.slots.weapon?.identity, gun.identity, "same gun");
  eq(17, resourceOf(sim, gun.identity, "ribbon"), 1, "refilled on swap");
  strikeNow(sim);
  if (cut(sim) < 1.6) fail(17, "refill did not fire");
};

proofs[18] = () => {
  const alone = open();
  wear(alone, 18);
  beside(alone);
  strikeNow(alone);
  near(18, cut(alone), 1.45, "empty kit");
  const full = open();
  wear(full, 18);
  wear(full, 21);
  beside(full);
  strikeNow(full);
  near(18, cut(full), 0.55, "crowded kit");
};

proofs[19] = () => {
  const sim = open();
  wear(sim, 19);
  const foe = far(sim);
  strikeNow(sim);
  eq(19, foe.x, 6, "pulled");
  near(19, cut(sim), 1.3, "hook");
  const back = open();
  wear(back, 19);
  beside(back);
  strikeNow(back);
  eq(19, cut(back), 0, "hook-back");
  if (!whiff(back, "hook-back")) fail(19, "no hook-back");
  if (back.player.rooted <= 0) fail(19, "did not root");
};

proofs[20] = () => {
  const full = open();
  wear(full, 20);
  const foe = beside(full);
  strikeNow(full);
  eq(20, cut(full), 0, "full");
  eq(20, foe.hp, 21, "healed");
  const mid = open();
  wear(mid, 20);
  setHp(mid, 3);
  beside(mid);
  strikeNow(mid);
  near(20, cut(mid), 0.7, "mid");
  const last = open();
  wear(last, 20);
  setHp(last, 1);
  beside(last);
  strikeNow(last);
  near(20, cut(last), 2.4, "last light");
};

proofs[21] = () => {
  const narrow = open();
  wear(narrow, 21);
  armTelegraph(narrow, "foe", { delay: 0.12, kind: "line" });
  dodge(narrow);
  eq(21, dodgeWindow(narrow), "narrow", "window");
  eq(21, narrow.tetherTo, "foe", "tether");
  if (narrow.player.iframe <= 0) fail(21, "no iframe");
  const early = open();
  wear(early, 21);
  armTelegraph(early, "foe", { delay: 0.5, kind: "line" });
  dodge(early);
  eq(21, dodgeWindow(early), "early", "early");
  eq(21, early.tetherTo, null, "no early tether");
  eq(21, early.player.iframe, 0, "early iframe");
  const late = open();
  wear(late, 21);
  armTelegraph(late, "foe", { delay: 0.02, kind: "line" });
  dodge(late);
  eq(21, dodgeWindow(late), "late", "late");
  eq(21, late.tetherTo, null, "no late tether");
  const loose = open();
  const coat = wear(loose, 21);
  coat.form = "loose";
  armTelegraph(loose, "foe", { delay: 0.12, kind: "line" });
  dodge(loose);
  eq(21, dodgeWindow(loose), "loose", "loose");
  eq(21, loose.tetherTo, null, "loose tether");
  const boots = open();
  wear(boots, 21);
  armTelegraph(boots, "foe", { delay: 0.5, kind: "line" });
  dodgeBoots(boots);
  eq(21, dodgeWindow(boots), "boots", "boots");
  eq(21, boots.tetherTo, null, "boots do not tether");
  if (boots.player.iframe < 0.28) fail(21, "boots iframe");
};

proofs[22] = () => {
  const denied = yard();
  setRelics(denied, ["sword", "lantern"]);
  wear(denied, 22);
  const block = placeMovable(denied, "cane-block", 6, 4);
  shove(denied);
  eq(22, block.mode, "free", "cane without relic");
  if (!denied.log.some((e) => e.t === "binding" && e.id === "relic.cane" && e.status === "unavailable")) fail(22, "cane binding not marked");
  const sim = yard();
  wear(sim, 22);
  const pot = placeMovable(sim, "pot", 6, 4);
  shove(sim);
  eq(22, pot.mode, "anchor", "anchored");
  const second = placeMovable(sim, "pot", 5, 3);
  placePlayer(sim, 5, 4, 0);
  shove(sim);
  if (!whiff(sim, "anchor-held")) fail(22, "second object accepted");
  eq(22, second.mode, "free", "second free");
  eq(22, pot.mode, "anchor", "first held");
  setIntent(sim, 1, 0);
  tick(sim, 0.05);
  near(22, sim.speed, 77, "anchor speed");
  setIntent(sim, 0, 0);
  placePlayer(sim, 5, 4, 1);
  shove(sim);
  eq(22, pot.mode, "free", "released");
};

proofs[23] = () => {
  const sim = open();
  wear(sim, 23);
  placePlayer(sim, 5, 8, 1);
  hurtPlayer(sim, 2, "burn");
  eq(23, sim.player.hp, 6, "quenched");
  if (sim.player.iframe <= 0) fail(23, "no quench iframe");
  placePlayer(sim, 5, 4, 1);
  sim.player.iframe = 0;
  hurtPlayer(sim, 2, "burn");
  near(23, selfD(sim), 4, "dry burn");
};

proofs[24] = () => {
  const sim = open();
  wear(sim, 24);
  armTelegraph(sim, "foe", { delay: 0.5, kind: "line" });
  near(24, foeById(sim).delayed?.left ?? 0, 0.9, "delay");
  hurtPlayer(sim, 1, "melee");
  near(24, selfD(sim), 2, "melee tax");
};

proofs[25] = () => {
  const sim = open();
  wear(sim, 25);
  hurtPlayer(sim, 2, "line", "hit", "col");
  near(25, selfD(sim), 1.2, "col");
  wipe(sim);
  hurtPlayer(sim, 2, "line", "hit", "row");
  near(25, selfD(sim), 2.7, "row");
};

proofs[26] = () => {
  const sim = open();
  wear(sim, 26);
  setIntent(sim, 1, 0);
  tick(sim, 0.05);
  near(26, sim.speed, 82.5, "land speed");
  setIntent(sim, 0, 0);
  placePlayer(sim, 5, 8, 1);
  setIntent(sim, 1, 0);
  tick(sim, 0.05);
  near(26, sim.speed, 126.5, "water speed");
  setIntent(sim, 0, 0);
  hurtPlayer(sim, 2, "melee");
  near(26, selfD(sim), 1, "water guard");
};

proofs[27] = () => {
  const sim = open();
  wear(sim, 27);
  const foe = beside(sim);
  advance(sim, 0.85);
  eq(27, sim.player.rooted, 999, "you rooted");
  eq(27, foe.rooted, 999, "foe rooted");
  const x = sim.player.x;
  stepTile(sim, 3);
  eq(27, sim.player.x, x, "sash holds");
  hurtPlayer(sim, 1, "melee");
  eq(27, sim.player.rooted, 0, "break you");
  eq(27, foe.rooted, 0, "break foe");
};

proofs[28] = () => {
  const sim = open();
  wear(sim, 28);
  setLantern(sim, true);
  far(sim);
  armTelegraph(sim, "foe", { delay: 1, kind: "line" });
  if (!foeById(sim).delayed?.revealed) fail(28, "front path hidden");
  placePlayer(sim, 5, 4, 3);
  armTelegraph(sim, "foe", { delay: 0.2, kind: "line" });
  if (foeById(sim).delayed?.revealed) fail(28, "back path revealed");
  const hp = sim.player.hp;
  advance(sim, 0.25);
  if (!noted(sim, "collar-back")) fail(28, "back hit landed");
  eq(28, sim.player.hp, hp, "hp");
};

proofs[29] = () => {
  const sim = open();
  const vest = wear(sim, 29);
  setHp(sim, 2);
  hurtPlayer(sim, 5, "melee");
  eq(29, sim.player.hp, 1, "kept");
  eq(29, resourceOf(sim, vest.identity, "phase"), 0, "phase spent");
  if (!noted(sim, "second-step")) fail(29, "no step");
  hurtPlayer(sim, 5, "melee");
  if (sim.player.hp > 0) fail(29, "second fatal lived");
};

proofs[30] = () => {
  const sim = open();
  wear(sim, 30);
  beside(sim);
  hurtPlayer(sim, 1, "melee");
  near(30, selfD(sim), 1.4, "idle");
  beginAttack(sim);
  eq(30, sim.player.attack?.phase, "recover", "recover");
  wipe(sim);
  hurtPlayer(sim, 2, "melee");
  near(30, cut(sim), 1, "reflect");
  near(30, selfD(sim), 2, "recover hit");
};

proofs[31] = () => {
  const sim = open();
  wear(sim, 1);
  wear(sim, 31);
  beside(sim);
  swapWeapon(sim);
  strikeNow(sim);
  near(31, cut(sim), 0.5, "weak swap");
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(31, cut(sim), 1, "recovered");
};

proofs[32] = () => {
  const sim = open();
  wear(sim, 32);
  wear(sim, 14);
  beginAttack(sim);
  interrupt(sim);
  if (!sim.shortRecover) fail(32, "no short recover");
  equipLegacy(sim, "iron");
  beginAttack(sim);
  eq(32, sim.player.attack?.left, 0, "next recover skipped");
  const slow = open();
  wear(slow, 32);
  beginAttack(slow);
  near(32, slow.player.attack?.left ?? -1, 0.35, "padded recover");
};

proofs[33] = () => {
  const sim = open();
  wear(sim, 33);
  advance(sim, 1);
  near(33, sim.guard, 1, "guard");
  hurtPlayer(sim, 2, "melee");
  near(33, selfD(sim), 1, "soaked");
  setIntent(sim, 1, 0);
  tick(sim, 0.05);
  eq(33, sim.guard, 0, "movement breaks guard");
};

proofs[34] = () => {
  const sim = open();
  wear(sim, 34);
  setHp(sim, 4);
  stepTile(sim, 1);
  advance(sim, 1);
  eq(34, sim.player.hp, 3, "away chip");
  stepTile(sim, 3);
  eq(34, sim.player.hp, 4, "return heal");
};

proofs[35] = () => {
  const sim = yard();
  wear(sim, 35);
  const pot = placeMovable(sim, "pot", 6, 4);
  shove(sim);
  eq(35, pot.mode, "carried", "picked up");
  eq(35, sim.slots.wearable?.lootId, id(35), "yoke stays");
  setIntent(sim, 1, 0);
  tick(sim, 0.05);
  near(35, sim.speed, 66, "carry speed");
  setIntent(sim, 0, 0);
  hurtPlayer(sim, 3, "line");
  eq(35, pot.integrity, 0, "pot breaks");
  eq(35, sim.player.hp, 6, "you don't");
  eq(35, sim.slots.wearable?.lootId, id(35), "yoke after break");
};

proofs[36] = () => {
  const sim = open();
  const doublet = wear(sim, 36);
  hurtPlayer(sim, 1, "melee");
  near(36, selfD(sim), 0.7, "buttoned");
  wear(sim, 1);
  eq(36, currentReach(sim), 2, "buttoned reach");
  cycleForm(sim, "wearable");
  eq(36, doublet.form, "open", "open");
  eq(36, currentReach(sim), 3, "open reach");
  wipe(sim);
  hurtPlayer(sim, 1, "melee");
  near(36, selfD(sim), 1.15, "open hurt");
  const wind = open();
  wear(wind, 36);
  wear(wind, 14);
  setHp(wind, 6);
  beginAttack(wind);
  cycleForm(wind, "wearable");
  eq(36, wind.slots.wearable?.form, "open", "form during windup");
  eq(36, wind.player.attack, null, "interrupted");
  eq(36, wind.player.hp, 5, "maul bite");
};

proofs[37] = () => {
  const sim = open();
  wear(sim, 37);
  const charm = wear(sim, 41);
  beside(sim, 1);
  strikeNow(sim);
  eq(37, foeById(sim).hp, 1, "no kill");
  if (!sim.log.some((e) => e.t === "note" && e.text.startsWith("mercy:"))) fail(37, "no mercy");
  if (!sim.stored || sim.stored.identity !== charm.identity) fail(37, "leftover not stored");
  const lost = open();
  wear(lost, 37);
  beside(lost, 1);
  strikeNow(lost);
  eq(37, foeById(lost).hp, 1, "still no kill");
  eq(37, lost.stored, null, "leftover lost without kiln");
};

proofs[38] = () => {
  const land = open();
  wear(land, 38);
  const x = land.player.x;
  dodge(land);
  eq(38, dodgeWindow(land), "land-hop", "land");
  eq(38, land.player.iframe, 0, "no land iframe");
  if (land.player.x === x) fail(38, "land did not hop");
  const water = open();
  wear(water, 38);
  placePlayer(water, 5, 8, 1);
  dodge(water);
  eq(38, dodgeWindow(water), "water", "water");
  if (water.player.iframe < 0.2) fail(38, "water iframe");
  if (water.player.x < 6) fail(38, "water dash");
};

proofs[39] = () => {
  const sim = open();
  wear(sim, 39);
  const fitting = wear(sim, 61);
  setLantern(sim, true);
  armTelegraph(sim, "foe", { delay: 0.2, kind: "line" });
  if (foeById(sim).delayed?.revealed) fail(39, "cowl let the path show");
  advance(sim, 0.25);
  eq(39, sim.player.hp, 6, "first delayed negated");
  if (!noted(sim, "cowl")) fail(39, "no cowl");
  armTelegraph(sim, "foe", { delay: 1, kind: "line" });
  if (!foeById(sim).delayed?.revealed) fail(39, "fitting still suppressed");
  eq(39, resourceOf(sim, fitting.identity, "oil"), 2, "oil after cowl");
};

proofs[40] = () => {
  const sim = open();
  wear(sim, 10);
  eq(40, currentReach(sim), 3, "ash reach");
  wear(sim, 40);
  eq(40, currentReach(sim), 1, "coat caps ash");
  beginAttack(sim);
  near(40, sim.player.attack?.left ?? 0, 0.2, "coat windup");
  interrupt(sim);
  wear(sim, 1);
  eq(40, currentReach(sim), 1, "margin capped");
  eq(40, sim.slots.weapon?.lootId, id(1), "margin in hand");
  setIntent(sim, 1, 0);
  tick(sim, 0.05);
  near(40, sim.speed, 93.5, "coat speed");
};

proofs[41] = () => {
  const sim = open();
  const charm = wear(sim, 41);
  wear(sim, 1);
  far(sim);
  charm.form = "line";
  strikeNow(sim);
  eq(41, foeById(sim).hp, 20, "stored not dealt");
  eq(41, sim.stored?.shape, "line", "line stored");
  eq(41, charm.form, "cone", "cycled");
  playTrinket(sim);
  if (cut(sim) <= 0) fail(41, "line release missed");
  const ring = open();
  const charm2 = wear(ring, 41);
  wear(ring, 1);
  beside(ring);
  charm2.form = "ring";
  strikeNow(ring);
  eq(41, ring.stored?.shape, "ring", "ring stored");
  const hp = ring.player.hp;
  placeFoe(ring, "foe", 9, 1, 20);
  playTrinket(ring);
  eq(41, ring.player.hp, hp - 1, "ring chip");
  const spike = open();
  const charm3 = wear(spike, 41);
  wear(spike, 1);
  beside(spike);
  charm3.form = "spike";
  strikeNow(spike);
  eq(41, spike.stored?.shape, "spike", "spike stored");
  placeFoe(spike, "foe", 9, 1, 20);
  playTrinket(spike);
  if (!whiff(spike, "spike-miss")) fail(41, "spike hit empty air");
};

proofs[42] = () => {
  const sim = open();
  wear(sim, 42);
  beside(sim);
  strikeNow(sim);
  const dealt = cut(sim);
  advance(sim, 0.4);
  near(42, selfD(sim), dealt, "backlash");
  const drop = open();
  const bead = wear(drop, 42);
  beside(drop);
  strikeNow(drop);
  equip(drop, "trinket", null);
  eq(42, drop.slots.trinket, null, "unequipped");
  if (bead.identity.length < 4) fail(42, "identity");
  advance(drop, 0.4);
  eq(42, selfD(drop), 0, "cancelled backlash");
};

proofs[43] = () => {
  const sim = open();
  wear(sim, 43);
  hurtPlayer(sim, 4, "melee");
  near(43, selfD(sim), 3, "empty utility");
  wear(sim, 63);
  wipe(sim);
  hurtPlayer(sim, 4, "melee");
  near(43, selfD(sim), 4, "utility filled");
};

proofs[44] = () => {
  const sim = open();
  wear(sim, 44);
  stepFoe(sim, "foe", 6, 4);
  if (sim.player.rooted <= 0) fail(44, "bell silent");
};

proofs[45] = () => {
  const sim = open();
  wear(sim, 45);
  sim.player.rooted = 2;
  playTrinket(sim);
  eq(45, sim.player.rooted, 0, "cleared");
  if (!sim.stickyNext) fail(45, "not sticky");
  beside(sim);
  strikeNow(sim);
  if (sim.player.rooted < 0.5) fail(45, "sticky did not root");
};

proofs[46] = () => {
  const sim = open();
  wear(sim, 46);
  placePlayer(sim, 5, 7, 2);
  playTrinket(sim);
  eq(46, sim.tiles[8][5], "shoal", "shoal");
  placePlayer(sim, 5, 4, 0);
  playTrinket(sim);
  if (sim.player.rooted <= 0) fail(46, "land stone");
};

proofs[47] = () => {
  const foeSim = yard();
  wear(foeSim, 47);
  placeFoe(foeSim, "foe", 6, 4, 20);
  playTrinket(foeSim);
  advance(foeSim, 0.45);
  near(47, foeById(foeSim).hp, 18, "seed foe");
  eq(47, foeById(foeSim).x, 9, "onto pot x");
  eq(47, foeById(foeSim).y, 6, "onto pot y");
  const you = yard();
  wear(you, 47);
  playTrinket(you);
  placeFoe(you, "foe", 7, 4, 20);
  placePlayer(you, 6, 4, 1);
  advance(you, 0.45);
  eq(47, you.player.hp, 5, "seed you");
  eq(47, you.player.x, 5, "back to empty");
};

proofs[48] = () => {
  const sim = yard();
  setLantern(sim, true);
  wear(sim, 48);
  playTrinket(sim);
  eq(48, sim.lanternOn, false, "snuffed");
  if (!foeById(sim).marked) fail(48, "unmarked");
  if (!sim.relics.includes("lantern")) fail(48, "relic removed");
  playTrinket(sim);
  if (!sim.log.some((e) => e.t === "binding" && e.status === "inert")) fail(48, "dark not inert");
  setRelics(sim, ["sword"]);
  playTrinket(sim);
  if (!sim.log.some((e) => e.t === "binding" && e.id === "relic.lantern" && e.status === "unavailable")) fail(48, "missing lantern not unavailable");
};

proofs[49] = () => {
  const heads = open();
  wear(heads, 49);
  forceCoin(heads, "heads");
  playTrinket(heads);
  if (!noted(heads, "coin-heads")) fail(49, "heads");
  dodge(heads);
  eq(49, dodgeWindow(heads), "perfect", "perfect");
  if (heads.player.iframe < 0.3) fail(49, "iframe");
  const tails = open();
  wear(tails, 49);
  beside(tails);
  forceCoin(tails, "tails");
  playTrinket(tails);
  strikeNow(tails);
  eq(49, cut(tails), 0, "tails cut");
  if (!whiff(tails, "tails")) fail(49, "no tails whiff");
};

proofs[50] = () => {
  const sim = open();
  const thimble = wear(sim, 50);
  wear(sim, 10);
  beginAttack(sim);
  interrupt(sim);
  if (!sim.stored || sim.stored.identity !== thimble.identity) fail(50, "not stored");
  near(50, sim.stored.amount, 1, "stored slash");
  wear(sim, 1);
  beside(sim);
  strikeNow(sim);
  if (!noted(sim, "thimble-shatter")) fail(50, "no shatter");
  eq(50, sim.stored, null, "cleared");
};

proofs[51] = () => {
  const sim = yard();
  wear(sim, 51);
  const pot = sim.movables.find((o) => o.kind === "pot")!;
  const x = pot.x;
  hurtPlayer(sim, 4, "melee");
  near(51, selfD(sim), 2, "half");
  if (!noted(sim, "thread")) fail(51, "no thread");
  if (pot.x === x) fail(51, "pot did not slide");
  const none = open();
  wear(none, 51);
  hurtPlayer(none, 4, "melee");
  near(51, selfD(none), 4, "no pot");
};

proofs[52] = () => {
  const sim = open();
  const blade = wear(sim, 1);
  wear(sim, 52);
  playTrinket(sim);
  eq(52, blade.form, "narrow", "cycled");
  equipLegacy(sim, "iron");
  wipe(sim);
  playTrinket(sim);
  if (!noted(sim, "click")) fail(52, "iron clicked into a form");
};

proofs[53] = () => {
  const sim = open();
  const blade = wear(sim, 1);
  wear(sim, 53);
  far(sim);
  if (!sim.marginValid) fail(53, "open not recorded");
  strikeNow(sim);
  near(53, cut(sim), 1.7, "charm did not buff");
  beside(sim);
  placePlayer(sim, 5, 4, 1);
  if (sim.marginValid) fail(53, "cramped recorded open");
  wipe(sim);
  strikeNow(sim);
  near(53, cut(sim), 0.45, "charm did not nerf");
  eq(53, blade.mods.length, 0, "no hidden mod");
};

proofs[54] = () => {
  const sim = open();
  wear(sim, 1);
  const nail = wear(sim, 54);
  far(sim);
  strikeNow(sim);
  near(54, cut(sim), 1, "first");
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(54, cut(sim), 1, "second");
  eq(54, nail.lootId, id(54), "nail");
  eq(54, sim.legacyWeapon.id, "starter-iron", "iron remains");
};

proofs[55] = () => {
  const sim = open();
  wear(sim, 55);
  beside(sim);
  advance(sim, 3.05);
  strikeNow(sim);
  if (foeById(sim).rooted <= 0) fail(55, "dark still did not root");
  const lit = open();
  wear(lit, 55);
  setLantern(lit, true);
  beside(lit);
  advance(lit, 3.05);
  eq(55, lit.darkStill, 0, "lamp zeros the count");
  strikeNow(lit);
  eq(55, foeById(lit).rooted, 0, "no root in the light");
};

proofs[56] = () => {
  const sim = yard();
  wear(sim, 56);
  placeMovable(sim, "pot", 6, 4);
  shove(sim);
  playTrinket(sim);
  if (!sim.log.some((e) => e.t === "object" && e.mode === "echo-slide")) fail(56, "no echo shove");
  beside(sim);
  strikeNow(sim);
  wipe(sim);
  playTrinket(sim);
  if (!noted(sim, "marble-silent")) fail(56, "repeated a cut");
};

proofs[57] = () => {
  const sim = open();
  wear(sim, 57);
  const blade = wear(sim, 1);
  const ident = blade.identity;
  cycleForm(sim, "weapon");
  eq(57, blade.form, "narrow", "narrow");
  swapWeapon(sim);
  eq(57, sim.locket?.form, "narrow", "remembered");
  eq(57, sim.locket?.identity, ident, "same piece");
  swapWeapon(sim);
  cycleForm(sim, "weapon");
  eq(57, blade.form, "open", "opened");
  playTrinket(sim);
  eq(57, blade.form, "narrow", "written back");
  eq(57, blade.identity, ident, "identity");
};

proofs[58] = () => {
  const sim = open();
  wear(sim, 6);
  const bead = wear(sim, 58);
  clearFoes(sim);
  placeFoe(sim, "foe", 6, 4, 20);
  placeFoe(sim, "a", 6, 5, 20);
  strikeNow(sim);
  near(58, cut(sim, "foe"), 1, "kept whole");
  eq(58, cut(sim, "a"), 0, "spared");
  eq(58, resourceOf(sim, bead.identity, "charge"), 0, "spent");
  wipe(sim);
  foeById(sim, "foe").hp = 20;
  foeById(sim, "a").hp = 20;
  strikeNow(sim);
  near(58, cut(sim, "foe"), 0.5, "later split");
  near(58, cut(sim, "a"), 0.5, "later split other");
};

proofs[59] = () => {
  const plain = open();
  advance(plain, 1);
  near(59, plain.breath, 0.5, "baseline still");
  setIntent(plain, 1, 0);
  advance(plain, 1);
  near(59, plain.breath, 1, "baseline moving");
  const heart = open();
  wear(heart, 59);
  advance(heart, 1);
  near(59, heart.breath, 2, "heart still");
  setIntent(heart, 1, 0);
  const held = heart.breath;
  advance(heart, 1);
  near(59, heart.breath, held, "heart moving");
};

proofs[60] = () => {
  const chalked = open();
  wear(chalked, 60);
  placeFoe(chalked, "foe", 9, 4, 20);
  dodge(chalked);
  eq(60, chalked.chalk[0]?.x, 5, "chalk x");
  eq(60, chalked.chalk[0]?.y, 4, "chalk y");
  eq(60, chalked.player.x, 6, "hopped");
  armTelegraph(chalked, "foe", { delay: 1, kind: "line" });
  eq(60, foeById(chalked).delayed?.path[0]?.x, 5, "path follows chalk");
  const fit = open();
  wear(fit, 60);
  const fitting = wear(fit, 61);
  setLantern(fit, true);
  placeFoe(fit, "foe", 9, 4, 20);
  dodge(fit);
  armTelegraph(fit, "foe", { delay: 1, kind: "line" });
  const path = foeById(fit).delayed?.path ?? [];
  if (path[0]?.x === 5) fail(60, "fitting obeyed chalk");
  if (!path.some((p) => p.x === fit.player.x && p.y === fit.player.y)) fail(60, "path missed you");
  if (!foeById(fit).delayed?.revealed) fail(60, "fitting did not reveal");
  eq(60, resourceOf(fit, fitting.identity, "oil"), 2, "oil");
};

proofs[61] = () => {
  const none = open();
  setRelics(none, ["sword"]);
  wear(none, 61);
  armTelegraph(none, "foe", { delay: 1, kind: "line" });
  if (!none.log.some((e) => e.t === "binding" && e.status === "unavailable")) fail(61, "unowned not unavailable");
  const dark = open();
  const fit = wear(dark, 61);
  armTelegraph(dark, "foe", { delay: 1, kind: "line" });
  if (!dark.log.some((e) => e.t === "binding" && e.status === "inert")) fail(61, "dark not inert");
  eq(61, resourceOf(dark, fit.identity, "oil"), 3, "oil kept");
  setLantern(dark, true);
  armTelegraph(dark, "foe", { delay: 1, kind: "line" });
  if (!foeById(dark).delayed?.revealed) fail(61, "lit path hidden");
  eq(61, resourceOf(dark, fit.identity, "oil"), 2, "spent");
  writeResource(dark, fit.identity, "oil", 0);
  armTelegraph(dark, "foe", { delay: 1, kind: "melee" });
  if (!dark.log.some((e) => e.t === "binding" && e.id === "fitting.oil")) fail(61, "empty oil");
  if (!dark.relics.includes("lantern")) fail(61, "lamp removed");
};

proofs[62] = () => {
  const sim = open();
  wear(sim, 62);
  placePlayer(sim, 1, 4, 1);
  const pot = placeMovable(sim, "pot", 1, 7);
  playUtility(sim);
  eq(62, pot.y, 5, "pulled");
  if (sim.player.rooted <= 0) fail(62, "cramped bell");
};

proofs[63] = () => {
  const sim = open();
  const charm = wear(sim, 41);
  const blade = wear(sim, 1);
  far(sim);
  strikeNow(sim);
  const stored = sim.stored?.amount ?? 0;
  if (stored <= 0) fail(63, "nothing stored");
  modifyPiece(sim, "weapon", "wider-margin");
  const carbine = wear(sim, 17);
  writeResource(sim, carbine.identity, "ribbon", 0);
  wear(sim, 63);
  wear(sim, 14);
  setHp(sim, 6);
  sim.player.attack = null;
  beginAttack(sim);
  playUtility(sim);
  eq(63, sim.player.hp, 5, "maul bite kept");
  eq(63, sim.stored?.amount, stored, "kiln kept");
  eq(63, sim.stored?.identity, charm.identity, "stored identity");
  eq(63, blade.mods.length, 1, "mod kept");
  eq(63, resourceOf(sim, carbine.identity, "ribbon"), 1, "sheathed ribbon reset");
  if (!noted(sim, "shrine-cup")) fail(63, "no cup");
  const oil = open();
  const fitting = wear(oil, 61);
  writeResource(oil, fitting.identity, "oil", 0);
  resetResources(oil);
  eq(63, resourceOf(oil, fitting.identity, "oil"), 3, "oil reset");
};

proofs[64] = () => {
  const sim = open();
  const doublet = wear(sim, 36);
  const pliers = wear(sim, 64);
  const ident = doublet.identity;
  playUtility(sim);
  eq(64, doublet.form, "open", "cycled");
  eq(64, doublet.identity, ident, "identity");
  eq(64, pliers.restorations, 0, "not a restore");
};

proofs[65] = () => {
  const blocked = open();
  wear(blocked, 1);
  wear(blocked, 65);
  far(blocked);
  placeMovable(blocked, "pot", 4, 4);
  strikeNow(blocked);
  near(65, cut(blocked), 0.45, "pot spoils margin");
  const stake = open();
  wear(stake, 1);
  wear(stake, 65);
  far(stake);
  placePlayer(stake, 5, 4, 3);
  playUtility(stake);
  placePlayer(stake, 5, 4, 1);
  strikeNow(stake);
  near(65, cut(stake), 1.7, "stake does not spoil");
  clearMovables(stake);
  wipe(stake);
  foeById(stake).hp = 20;
  placePlayer(stake, 5, 4, 1);
  playUtility(stake);
  strikeNow(stake);
  eq(65, cut(stake), 0, "stake blocks the ray");
};

proofs[66] = () => {
  const sim = open();
  wear(sim, 21);
  wear(sim, 66);
  armTelegraph(sim, "foe", { delay: 0.12, kind: "line" });
  dodge(sim);
  playUtility(sim);
  if (foeById(sim).rooted < 0.6) fail(66, "tether not spiked");
  eq(66, sim.tetherTo, null, "tether spent");
  const bare = open();
  wear(bare, 66);
  playUtility(bare);
  if (bare.player.rooted <= 0) fail(66, "bare spike");
};

proofs[67] = () => {
  const sim = open();
  wear(sim, 14);
  wear(sim, 67);
  beside(sim);
  beginAttack(sim);
  armTelegraph(sim, "foe", { delay: 1, kind: "line" });
  playUtility(sim);
  eq(67, sim.player.attack, null, "swing cancelled");
  eq(67, foeById(sim).delayed, null, "path cancelled");
  if (sim.lockout <= 0) fail(67, "no lockout");
  beginAttack(sim);
  if (!whiff(sim, "whistle")) fail(67, "swung through lockout");
  eq(67, cut(sim), 0, "no cut");
};

proofs[68] = () => {
  const sim = open();
  wear(sim, 68);
  placePlayer(sim, 5, 4, 1);
  playUtility(sim);
  if (!whiff(sim, "bucket-empty")) fail(68, "empty bucket dumped");
  placePlayer(sim, 5, 8, 1);
  playUtility(sim);
  if (!noted(sim, "scoop")) fail(68, "no scoop");
  placePlayer(sim, 6, 4, 1);
  playUtility(sim);
  eq(68, sim.tiles[4][6], "water", "dumped");
  placePlayer(sim, 5, 4, 1);
  wear(sim, 8);
  placeFoe(sim, "foe", 6, 4, 20);
  strikeNow(sim);
  near(68, cut(sim), 1.8, "cast on dumped water");
};

proofs[69] = () => {
  const sim = open();
  wear(sim, 69);
  hurtPlayer(sim, 3, "line", "foe");
  eq(69, sim.player.hp, 6, "caught");
  if (!noted(sim, "pan-catch")) fail(69, "no catch");
  playUtility(sim);
  near(69, cut(sim), 1.2, "thrown");
  const melee = open();
  wear(melee, 69);
  hurtPlayer(melee, 2, "melee", "foe");
  if (!noted(melee, "pan-drop")) fail(69, "melee caught");
  eq(69, melee.player.hp, 4, "melee landed");
};

proofs[70] = () => {
  const sim = open();
  wear(sim, 27);
  wear(sim, 70);
  const foe = beside(sim);
  advance(sim, 0.9);
  if (!sim.sashOn) fail(70, "no sash");
  playUtility(sim);
  eq(70, sim.sashOn, false, "sash");
  eq(70, sim.player.rooted, 0, "you");
  eq(70, foe.rooted, 0, "foe");
  wear(sim, 45);
  playTrinket(sim);
  if (!sim.stickyNext) fail(70, "cube");
  playUtility(sim);
  eq(70, sim.stickyNext, false, "sticky cleared");
};

proofs[71] = () => {
  const sim = yard();
  const mask = wear(sim, 71);
  playUtility(sim);
  eq(71, resourceOf(sim, mask.identity, "mask"), 0, "spent");
  if (!sim.maskUp) fail(71, "not masked");
  hurtPlayer(sim, 5, "line");
  eq(71, sim.player.hp, 6, "ignored");
  advance(sim, 1.05);
  eq(71, resourceOf(sim, mask.identity, "mask"), 1, "refilled");
  const cramped = open();
  wear(cramped, 71);
  beside(cramped);
  playUtility(cramped);
  if (!whiff(cramped, "mask")) fail(71, "masked in a crowd");
};

proofs[72] = () => {
  const sim = yard();
  const before = sim.relics.join(",");
  wear(sim, 72);
  eq(72, sim.lanternOn, false, "starts dark");
  playUtility(sim);
  eq(72, sim.lanternOn, true, "lamp toggled");
  eq(72, sim.relics.join(","), before, "list restored");
  if (!noted(sim, "strap")) fail(72, "no strap");
  setRelics(sim, ["sword"]);
  const on = sim.lanternOn;
  playUtility(sim);
  eq(72, sim.lanternOn, on, "sword-only did not invent a verb");
  if (!sim.log.some((e) => e.t === "binding" && e.id === "relic.extra" && e.status === "unavailable")) fail(72, "extra relic not unavailable");
};

proofs[73] = () => {
  const openField = open();
  wear(openField, 1);
  wear(openField, 73);
  far(openField);
  const hp = foeById(openField).hp;
  playUtility(openField);
  const cmp = openField.log.find((e) => e.t === "compare");
  if (!cmp || cmp.t !== "compare") fail(73, "no compare");
  eq(73, cmp.winner, "Margin Blade", "open winner");
  near(73, cmp.current, 1.7, "margin number");
  eq(73, cmp.iron, 0, "iron cannot reach");
  eq(73, foeById(openField).hp, hp, "lens is dry");
  if (!foeById(openField).delayed) fail(73, "no path armed");
  const clinch = open();
  wear(clinch, 1);
  wear(clinch, 73);
  beside(clinch);
  playUtility(clinch);
  const cmp2 = clinch.log.find((e) => e.t === "compare");
  if (!cmp2 || cmp2.t !== "compare") fail(73, "no clinch");
  eq(73, cmp2.winner, "Short iron", "clinch winner");
  near(73, cmp2.iron, 1, "iron number");
  near(73, cmp2.current, 0.45, "cramped margin");
};

proofs[74] = () => {
  const wide = open();
  const blade = wear(wide, 1);
  wear(wide, 74);
  playUtility(wide);
  eq(74, blade.mods[0]?.tag, "wider-margin", "chisel");
  far(wide);
  placeMovable(wide, "pot", 6, 5);
  strikeNow(wide);
  near(74, cut(wide), 0.45, "diagonal now counts");
  const etch = open();
  const knife = wear(etch, 7);
  wear(etch, 74);
  playUtility(etch);
  eq(74, knife.mods[0]?.tag, "etched", "etched");
  beside(etch);
  strikeNow(etch);
  if (!whiff(etch, "etched")) fail(74, "etched swung cold");
  eq(74, cut(etch), 0, "cold cut");
  advance(etch, 0.35);
  wipe(etch);
  foeById(etch).hp = 20;
  strikeNow(etch);
  if (cut(etch) <= 0) fail(74, "etched never warmed");
};

proofs[75] = () => {
  const sim = open();
  const blade = wear(sim, 1);
  const ident = blade.identity;
  modifyPiece(sim, "weapon", "wider-margin");
  cycleForm(sim, "weapon");
  eq(75, blade.form, "narrow", "narrow");
  wear(sim, 75);
  playUtility(sim);
  eq(75, blade.mods.length, 0, "mods cleared");
  eq(75, blade.form, "open", "default form");
  eq(75, blade.restorations, 1, "restoration");
  eq(75, blade.identity, ident, "identity");
  eq(75, blade.lootId, id(1), "loot");
};

proofs[76] = () => {
  const sim = open();
  wear(sim, 76);
  playUtility(sim);
  if (!whiff(sim, "nothing-sheathed")) fail(76, "invented a swap");
  const first = wear(sim, 1);
  const second = wear(sim, 14);
  eq(76, sim.sheathed?.identity, first.identity, "sheathed");
  playUtility(sim);
  eq(76, sim.slots.weapon?.identity, first.identity, "swapped back");
  eq(76, sim.sheathed?.identity, second.identity, "other sheathed");
};

proofs[77] = () => {
  const sim = yard();
  wear(sim, 77);
  placePlayer(sim, 1, 4, 2);
  const corridor = placeMovable(sim, "pot", 1, 5);
  shove(sim);
  eq(77, corridor.y, 8, "corridor");
  placePlayer(sim, 5, 4, 2);
  const field = placeMovable(sim, "pot", 5, 5);
  shove(sim);
  eq(77, field.y, 6, "open wedge");
  equip(sim, "utility", null);
  placePlayer(sim, 4, 4, 2);
  const hands = placeMovable(sim, "pot", 4, 5);
  shove(sim);
  eq(77, hands.y, 7, "bare hands");
};

proofs[78] = () => {
  const sim = open();
  wear(sim, 21);
  wear(sim, 78);
  setLantern(sim, true);
  playUtility(sim);
  eq(78, sim.lanternOn, false, "snuffed");
  if (!sim.relics.includes("lantern")) fail(78, "lamp deleted");
  if (!sim.wideDodge) fail(78, "no wide dodge");
  armTelegraph(sim, "foe", { delay: 0.22, kind: "line" });
  dodge(sim);
  eq(78, dodgeWindow(sim), "narrow", "widened window");
  eq(78, sim.tetherTo, "foe", "tether");
  playUtility(sim);
  if (!sim.log.some((e) => e.t === "binding" && e.status === "inert")) fail(78, "second snuff");
  setRelics(sim, ["sword", "boots"]);
  playUtility(sim);
  if (!sim.log.some((e) => e.t === "binding" && e.id === "relic.lantern" && e.status === "unavailable")) fail(78, "missing lamp");
};

proofs[79] = () => {
  const sim = open();
  sim.edge = 2;
  sim.tropoverse = true;
  sim.flawId = "the_blade";
  const seal = wear(sim, 79);
  const ident = seal.identity;
  beside(sim);
  strikeNow(sim);
  near(79, cut(sim), 2.8152, "sealed");
  wipe(sim);
  foeById(sim).hp = 20;
  strikeNow(sim);
  near(79, cut(sim), 1.4076, "hangover");
  eq(79, resourceOf(sim, seal.identity, "seal"), 0, "spent");
  resetResources(sim);
  eq(79, resourceOf(sim, seal.identity, "seal"), 1, "rearmed");
  wear(sim, 14);
  beginAttack(sim);
  interrupt(sim);
  eq(79, resourceOf(sim, seal.identity, "seal"), 1, "interrupt did not spend");
  eq(79, seal.identity, ident, "identity");
  eq(79, seal.restorations, 0, "not repaired");
};

proofs[80] = () => {
  const sim = open();
  wear(sim, 80);
  placeFoe(sim, "foe", 9, 4, 20);
  playUtility(sim);
  strikeNow(sim);
  near(80, cut(sim), 1.6, "end of the line");
  placeFoe(sim, "foe", 7, 4, 20);
  playUtility(sim);
  wipe(sim);
  strikeNow(sim);
  eq(80, cut(sim), 0, "mid body");
  eq(80, foeById(sim).hp, 20, "mid unhurt");
  if (!whiff(sim, "chalk-blocked")) fail(80, "not blocked");
};

