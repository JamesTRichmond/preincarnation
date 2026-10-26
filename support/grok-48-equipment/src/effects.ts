import { mustItem } from "./catalog.ts";
import { lootId } from "./ids.ts";
import type { Action, EffectOut, Session } from "./types.ts";

type Channel =
  | "counter"
  | "block"
  | "release"
  | "shove"
  | "net"
  | "wedge"
  | "door"
  | "dark"
  | "stake"
  | "listen"
  | "horn"
  | "veil"
  | "snuff"
  | "explore"
  | "mark";

function wants(a: Action, channel: Channel): boolean {
  if (a.kind === "survey") return true;
  if (channel === "stake") return a.kind === "stake" || a.kind === "unstake";
  return a.kind === channel;
}

function charge(s: Session, n: number): number {
  return s.charges[lootId(n)] ?? 0;
}

function worn(s: Session, n: number): boolean {
  const id = lootId(n);
  if (Object.values(s.slots).includes(id)) return true;
  return Object.values(s.attachments).includes(id);
}

function out(facts: EffectOut["facts"], tell: string, spend = false): EffectOut {
  return spend ? { facts, tell, spend: true } : { facts, tell };
}

function e001(s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  const ink = s.mods[lootId(1)] === "ash-ink";
  return out(
    { saberWindowMs: ink ? 110 : 80, saberFaultLength: 2.4 },
    ink ? "Ash ink sits in the saber's fuller. The fault window is wider, not harder." : "The saber is ready to open a fault on a true counter.",
  );
}

function e002(s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  const flow = (a.submerged ?? false) || s.tools["tool.creek.channel"];
  if (!flow) return out({ foePulled: "none" }, "There is no creek to draw along.");
  return out({ foePulled: "along-flow", flowDir: "E" }, "The draw pulls the foe along the existing flow.");
}

function e003(_s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  return out({ stickTarget: "light-foe", stickHeavy: false }, "The kiss sticks a light foe. A quarry mass does not take the glue.");
}

function e004(_s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  return out({ sootLean: "E", torchOut: "knife", lanternSnuffed: false }, "The mundane flame dies. Soot shows it leaned east. The lantern wick is untouched.");
}

function e005(s: Session, a: Action): EffectOut {
  if (!wants(a, "dark")) return {};
  if (!s.tools["tool.lantern.body"]) {
    return out({ billReach: 3, revealCorridor: false, billNeedsLantern: true }, "The bill has reach and gives no light of its own.");
  }
  return out({ billReach: 3, revealCorridor: true }, "Lantern light runs in a corridor along the bill.");
}

function e006(_s: Session, a: Action): EffectOut {
  if (!wants(a, "listen")) return {};
  return out({ wallOccupancy: "one-tile", damageThroughWall: false }, "An echo answers from the next tile. The wall stays shut.");
}

function e007(_s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  return out(
    { slideFromHammer: 2, grainSource: "hammer", grainAxis: "facing" },
    "The hammer drives the crate along its grain.",
  );
}

function e008(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ ledgeSnag: true, snagReach: 3 }, "The flail head snags a ledge hook and reels back in.");
}

function e009(_s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  const sub = a.submerged ?? false;
  return out(
    { drawSplash: !sub, drawQuiet: sub },
    sub ? "The sheath draws without a splash." : "On dry ground the draw is an alert.",
  );
}

function e010(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ panesBroken: 1, sugarGlassBroken: 1, charmSpared: true }, "Brittle panes shatter. The glass charm is spared.");
}

function e011(_s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  if (!a.turnAround) return out({ strikeOrigin: "facing" }, "Without the turn, the strike leaves from where you look.");
  return out({ strikeOrigin: "original-facing" }, "You turn, but the strike still leaves from the original facing.");
}

function e012(_s: Session, a: Action): EffectOut {
  if (!wants(a, "wedge")) return {};
  return out({ seamWiden: true, seamPickOpensMandatory: false }, "The pick widens only a seam the wedge has already opened.");
}

function e013(s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  const c = charge(s, 13);
  if (c <= 0 || a.useCharge === false) return out({ homingCut: false, spikeCharge: c }, "The spike is cold.");
  return out({ homingCut: true, spikeCharge: c - 1 }, "One projectile loses its homing. Rest can warm the spike again.", true);
}

function e014(_s: Session, a: Action): EffectOut {
  if (!wants(a, "net")) return {};
  return out({ forkCatches: "flowing-debris", forkRefuses: "bolt" }, "The fork takes flowing debris. Bolts glance off.");
}

function e015(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ lure: "nonhostile", lureHostile: false }, "A curious non-hostile comes to the spoon. Hostiles ignore it.");
}

function e016(_s: Session, a: Action): EffectOut {
  if (!wants(a, "listen")) return {};
  if (!a.secondTap) return out({ malletPhase: "first" }, "The first tap is planted. Tap the same surface again.");
  return out({ malletPhase: "second", material: "stone" }, "The second tap returns stone.");
}

function e017(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.lantern.body"]) return out({ fuseDried: false, glaiveHeat: "cold" }, "Without the lantern tool the glaive stays cold. The fuse stays wet.");
  return out({ fuseDried: true, glaiveHeat: "warm", lanternWickUnharmed: true }, "The warm edge dries one fuse. It does not copy the lantern.");
}

function e018(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ compassDir: "E" }, "The compass lays the fault grain to the east.");
}

function e019(_s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  return out({ smokeShift: 1, torchSnuff: "fan", lanternSnuffed: false }, "Smoke moves one tile. The lantern tool stays lit.");
}

function e020(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  if (!s.tools["tool.quarry.pry"]) return out({ pryForce: "unchanged", pryReason: "no-pry-tool" }, "The pocket bar does nothing without the pry tool.");
  return out({ pryForce: "reduced", pryStillNeedsTool: true }, "The pry tool bites at a kinder angle. It is still the pry tool.");
}

function e021(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  const heavy = (a.heavyOnThread ?? false) || (worn(s, 69) && s.mods[lootId(69)] === "heavy");
  return out(
    { waterThread: true, threadBreaksIfHeavy: true, threadBroken: heavy, channelStaffNotBypassed: true },
    heavy ? "The heavy mass snaps the thread." : "A light thread crosses the flow. It is not a staff crossing.",
  );
}

function e022(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ sampleDecay: "paused-scene", sampleHealsPlayer: false }, "The cut sample stops decaying for this scene. You do not heal.");
}

function e023(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ mothRelocated: true, sparkRadius: 0 }, "A spark moves from one lamp to another and throws no room light.");
}

function e024(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!a.strikeClapper) return out({ bellDelay: false, wardSilenced: false }, "Hitting the bell still rings it. Wards are untouched.");
  return out({ bellDelay: true, wardSilenced: false }, "The clapper strike delays the ring one beat. A keyed ward stays.");
}

function e025(s: Session, a: Action): EffectOut {
  const glaze = s.mods[lootId(25)] === "sugar-glaze";
  if (a.kind === "release") {
    if (!s.storedProjectile) return out({ released: false }, "The coat is empty.");
    return out(
      { released: true, releaseTag: s.storedProjectile.tag, glazeStick: glaze, releaseVector: "facing" },
      glaze ? "The stored shot leaves and sticks to the first surface." : "The stored shot leaves on your facing.",
    );
  }
  if (a.kind !== "block" && a.kind !== "survey") return {};
  const incoming = a.projectileTag ?? "bolt";
  if (s.storedProjectile) {
    return out({ stored: s.storedProjectile.tag, storeRefused: incoming, storeLimit: 1 }, "The coat already holds a shot and will not swap it.");
  }
  return out({ stored: incoming, storeLimit: 1, glazeStick: glaze }, `The coat stores one ${incoming}.`);
}

function e026(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  const vertical = s.mods[lootId(26)] === "quarry-weight";
  return out(
    { slideFromBelt: 2, grainSourceBelt: true, grainAxis: vertical ? "vertical" : "facing" },
    vertical ? "Impacts follow the belt's vertical grain." : "Impacts slide on the belt grain instead of tumbling.",
  );
}

function e027(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ swept: false, depthRead: 2, sluiceBypassed: false }, "The waders hold against the flow and read the depth. The sluice is unchanged.");
}

function e028(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ selfStick: false, canPassStick: true }, "Sugar will not glue the gloves. A stuck foe can be passed to a surface.");
}

function e029(_s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  return out({ ashOnSelf: false, readsAshMarks: true }, "Ash does not mark you. Other ash marks stay readable.");
}

function e030(s: Session, a: Action): EffectOut {
  if (!wants(a, "dark")) return {};
  if (!s.tools["tool.lantern.body"]) return out({ collarHandsFree: false, collarReason: "no-lantern-tool" }, "The collar has nothing to clip and gives no light.");
  return out({ collarHandsFree: true }, "The lantern tool sits on the collar. Both hands are free. The light is still the lantern's.");
}

function e031(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ hideTrinketFromPatdown: true, keysStillVisible: true }, "One trinket drops out of a pat-down. Keys still count as carried.");
}

function e032(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ faultTriggeredByStep: false, faultFeel: "E" }, "You can stand on the fault. It does not split, and it wants east.");
}

function e033(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  const sub = a.submerged ?? false;
  return out(
    { alertRadius: sub ? 0 : 2, mantleLandWorse: !sub },
    sub ? "Underwater the mantle reads as reeds." : "On land the mantle is bright and easy to see.",
  );
}

function e034(s: Session, a: Action): EffectOut {
  if (!wants(a, "mark")) return {};
  const marked = !!s.safeMark && !(a.hitstun ?? false);
  return out(
    { sashRing: marked, sashTeleports: false },
    marked ? "The sash rings before the hit." : "The sash stays quiet until a safe mark exists.",
  );
}

function e035(_s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  return out({ emberPocket: true, lanternWickCopied: false }, "One smothered ember rides in the apron. It cannot stand in for the lantern wick.");
}

function e036(_s: Session, a: Action): EffectOut {
  if (!wants(a, "release")) return {};
  return out({ releaseVector: "flow" }, "A released shot leaves along the flow, not your facing.");
}

function e037(s: Session, a: Action): EffectOut {
  if (!wants(a, "listen")) return {};
  if (s.slots.mainHand === lootId(16)) {
    return out({ echoThickness: true }, "With the mallet, the cap adds thickness to the returned material.");
  }
  return out({ wallOccupancyCap: "adjacent-if-pressed", echoThickness: false }, "Pressed to the wall, the cap hears occupancy only.");
}

function e038(s: Session, a: Action): EffectOut {
  if (!wants(a, "dark")) return {};
  if (!s.tools["tool.lantern.body"]) return out({ revealLobes: false, veilReason: "no-lantern-tool" }, "The veil cannot split light that is not there.");
  return out({ revealLobes: true }, "The lantern's reveal splits into two dimmer lobes.");
}

function e039(_s: Session, a: Action): EffectOut {
  if (!wants(a, "block")) return {};
  return out({ sleeveCatch: "jar", sleeveCatchesBolt: false }, "The sleeves take a thrown jar, not a bolt.");
}

function e040(_s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  return out({ shoveClass: "heavy", sweptExtra: true }, "The shove counts as heavy, and the creek pulls harder.");
}

function e041(_s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  return out({ cough: false }, "Smoke does not make you cough.");
}

function e042(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ ledgerTrail: true, trailFades: "scene", trailTeleport: false }, "Each safe step scratches a trail you can follow back.");
}

function e043(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ carriedClapperLifted: true, wardSilenced: false }, "You can lift the clapper of a bell you carry.");
}

function e044(_s: Session, a: Action): EffectOut {
  if (!wants(a, "block")) return {};
  return out({ skirtDeflect: "flowing-debris", skirtDeflectsBolt: false }, "The hem turns flowing debris and does not store it. Bolts ignore the skirt.");
}

function e045(s: Session, a: Action): EffectOut {
  if (!wants(a, "dark")) return {};
  if (!s.tools["tool.lantern.body"]) return out({ revealFloor: false, cowlReason: "no-lantern-tool" }, "The cowl cannot aim a light you do not have.");
  return out({ revealFloor: true }, "Lantern light stays on the floor. The horizon stays dark.");
}

function e046(_s: Session, a: Action): EffectOut {
  if (!wants(a, "listen")) return {};
  return out({ footEcho: false, selfDeafenFloor: true }, "Footsteps return no echo. Your own floor-taps come back dull.");
}

function e047(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ wrapProtectsOnRoll: true, sampleCrushed: false }, "A roll will not crush the sample held in the wrap.");
}

function e048(_s: Session, a: Action): EffectOut {
  if (!wants(a, "wedge")) return {};
  return out({ wedgeRemainsOwnedHandsFull: true, harnessWieldsWedge: false }, "The wedge stays on the hip while both hands are busy. The harness does not swing it.");
}

function e049(s: Session, a: Action): EffectOut {
  if (!wants(a, "mark")) return {};
  const combat = a.inCombat ?? true;
  const hitstun = a.hitstun ?? false;
  const flag = worn(s, 118);
  const plantedElsewhere = flag && s.flagX != null && (s.flagX !== s.x || s.flagY !== s.y);
  const onFlag = flag && !plantedElsewhere;
  let legal = true;
  let reason = "marked";
  if (hitstun) {
    legal = false;
    reason = "hitstun";
  } else if (s.standingOnArmedFault && !worn(s, 32)) {
    legal = false;
    reason = "armed-fault";
  } else if (combat && !onFlag) {
    legal = false;
    reason = "need-safe-flag";
  }
  return out(
    { markLegal: legal, markReason: reason, markTeleports: false },
    legal ? "The charm marks this position." : `The charm refuses: ${reason}.`,
  );
}

function e050(_s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  return out({ faultBeadWarn: true, faultCreatedByBead: false }, "The bead vibrates. It does not cut a fault.");
}

function e051(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ depthHum: 2, pearlChangesFlow: false }, "The pearl hums the depth of the next step.");
}

function e052(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  const stuck = s.slots.mainHand === lootId(3);
  return out(
    { stickTransferredTo: stuck ? "seal" : "seal-ready", weaponFreed: stuck },
    "The seal can take one stick off a glued target.",
  );
}

function e053(_s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  return out({ allyAshMark: true, disguiseBypass: false }, "Ash-readers see an ally mark, not a stolen name.");
}

function e054(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.lantern.body"]) return out({ wickSpliced: false, wickReason: "no-lantern-tool" }, "There is no lantern wick to splice.");
  return out({ wickSpliced: true, createsLight: false }, "The thread splices the lantern's wick and does not become a light.");
}

function e055(_s: Session, a: Action): EffectOut {
  if (!wants(a, "listen")) return {};
  return out({ marblePath: "bend-left" }, "The marble returns a left bend. The hollow stays shut.");
}

function e056(s: Session, a: Action): EffectOut {
  if (!wants(a, "door")) return {};
  if (s.hasKey) return out({ keybell: "silent" }, "The key is on you. The bell stays quiet, and the door still waits to be turned.");
  return out({ keybell: "missing" }, "The bell rings: the key is not on you. The door stays locked.");
}

function e057(s: Session, a: Action): EffectOut {
  if (!wants(a, "mark")) return {};
  if (!s.safeMark) return out({ twinDelta: "no-mark" }, "The twin has no stored mark to compare.");
  return out({ twinDelta: `${s.x - s.safeMark.x},${s.y - s.safeMark.y}` }, "The twin shows what changed since the safe mark.");
}

function e058(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  const c = charge(s, 58);
  if (c <= 0) return out({ knot: "spent" }, "The knot is already spent. Rest can retie it.");
  return out({ crateResponseOverride: "stop", knot: "used" }, "The knot stops the crate short of a tumble.", true);
}

function e059(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ leakPlugged: true, sluiceStoppedByCork: false }, "A small leak is plugged. The sluice still wants the channel tool.");
}

function e060(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ sparkCarried: true, sparkRadius: 0, sparkTravels: true }, "The chip carries a spark that lights only a hand-width.");
}

function e061(s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  const c = charge(s, 61);
  if (c <= 0) return out({ beadSnuff: false }, "The bead is already crushed. Rest reforms it.");
  return out({ beadSnuff: true, lanternSnuffed: false }, "Mundane flames in the room go out. The lantern tool does not.", true);
}

function e062(s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  if (s.slots.mainHand !== lootId(1)) return out({ threadWindowMs: 0, threadReason: "needs-faultline-saber" }, "The thread only serves the faultline saber.");
  const c = charge(s, 62);
  if (c <= 0) return out({ threadWindowMs: 0, threadReason: "spent" }, "The thread is already spent for this rest.");
  return out({ threadWindowMs: 100 }, "The thread widens the saber's window for this fight.", true);
}

function e063(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ scanWarn: true }, "The nail pricks when an echo-scan crosses you.");
}

function e064(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ trailPinned: true }, "The nail pins the ledger trail for the scene.");
}

function e065(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ clapperPinned: true, bellRestorable: true, wardSilenced: false }, "The pin holds the clapper until you pull it.");
}

function e066(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  const charged = s.tools["tool.lantern.body"] || s.warmthCharged;
  if (!charged) return out({ stoneDry: false, stoneReason: "uncharged" }, "The stone has not stood with a lantern yet.");
  return out({ stoneDry: true, stoneLight: false }, "The stone dries one fuse and gives no light.");
}

function e067(_s: Session, a: Action): EffectOut {
  if (!wants(a, "wedge")) return {};
  return out({ seamMarked: true, seamWidens: false }, "The thread marks a widened seam. It does not widen one.");
}

function e068(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ sampleRestConsume: false }, "The bead keeps a sample from being eaten by a rest.");
}

function e069(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  const mode = s.mods[lootId(69)] === "heavy" ? "heavy" : "light";
  return out({ weightReclass: mode }, mode === "heavy" ? "The crate is reclassed heavy." : "The crate is reclassed light.");
}

function e070(s: Session, a: Action): EffectOut {
  if (!wants(a, "listen")) return {};
  const c = charge(s, 70);
  if (c <= 0) return out({ echoCancel: false }, "The chip has already cancelled its ping.");
  return out({ echoCancel: true }, "One hollow listener ping is cancelled.", true);
}

function e071(_s: Session, a: Action): EffectOut {
  if (!wants(a, "dark")) return {};
  return out({ collarAllowsWaist: true }, "The hook lets the lantern collar sit on a belt and leave the cloak free.");
}

function e072(s: Session, a: Action): EffectOut {
  if (!wants(a, "release")) return {};
  const c = charge(s, 72);
  if (c <= 0) return out({ rewindReady: false }, "The spool has already rewound once.");
  return out({ rewindReady: true }, "The spool can pull one missed shot back into the coat.");
}

function e073(s: Session, a: Action): EffectOut {
  if (!wants(a, "net")) return {};
  if (!s.tools["tool.creek.net"]) return out({ netMouth: "inert" }, "The mouth waits for the creek net.");
  return out({ netAdd: "barbed", netRemove: "bolt,glass" }, "The net takes barbed heads and gives up plain bolts and glass.");
}

function e074(s: Session, a: Action): EffectOut {
  if (!wants(a, "net")) return {};
  if (!s.tools["tool.creek.net"]) return out({ fineMesh: "inert" }, "The mesh waits for the creek net.");
  return out({ netProfile: "glass,mote,spark,debris" }, "The fine mesh keeps glass, motes, sparks and debris.");
}

function e075(_s: Session, a: Action): EffectOut {
  if (!wants(a, "wedge")) return {};
  return out({ cheek: true }, "The cheek bites a slanted seam and refuses a mandatory square seam until removed.");
}

function e076(_s: Session, a: Action): EffectOut {
  if (!wants(a, "wedge")) return {};
  return out({ featherQuiet: true, featherSlow: true }, "The wedge goes in quietly, and the seam opens slower.");
}

function e077(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  if (!s.tools["tool.quarry.pry"]) return out({ pryBite: "inert" }, "The bite waits for the pry tool.");
  return out({ pryBite: "rounded-lip", keyedBraceMoved: false }, "The pry catches a rounded lip. A keyed brace does not move.");
}

function e078(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  if (!s.tools["tool.quarry.pry"]) return out({ pryWrap: "inert" }, "The wrap waits for the pry tool.");
  return out({ pryChipsGlass: false, pryWrap: true }, "The wrapped pry does not chip glass beside the brace.");
}

function e079(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  if (!s.tools["tool.quarry.maul"]) return out({ maulSleeve: "inert" }, "The sleeve waits for the maul tool.");
  return out({ maulGrainOnLegal: true, maulBreaksIllegal: false }, "A legal maul blow follows the grain. An illegal face stays whole.");
}

function e080(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  if (!s.tools["tool.quarry.maul"]) return out({ maulBell: "inert" }, "The bell waits for the maul tool.");
  return out({ maulBellOnIllegal: true, maulBreaksIllegal: false }, "The maul rings instead of breaking an illegal face.");
}

function e081(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.creek.channel"]) return out({ channelLip: "inert" }, "The lip waits for the channel tool.");
  return out({ flowRedirect: "90", sluiceStillNeedsTool: true }, "Flow turns ninety degrees. The sluice still needs the channel tool.");
}

function e082(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.creek.channel"]) return out({ channelCork: "inert" }, "The cork waits for the channel tool.");
  return out({ flowPausedOneBeat: true, sluiceStillNeedsChannel: true }, "Flow pauses one beat. The sluice still needs the channel tool.");
}

function e083(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.creek.staff"]) return out({ staffShoe: "inert" }, "The shoe waits for the creek staff.");
  return out({ staffPlanted: true, deepStillNeedsStaff: true }, "The staff plants in silt. Deep water still needs the staff itself.");
}

function e084(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.creek.staff"]) return out({ staffBell: "inert" }, "The bell waits for the creek staff.");
  return out({ staffWarnDepth: 3, deepStillNeedsStaffBell: true }, "The staff warns where the waders stop. It does not grant the crossing.");
}

function e085(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.sugar.brush"]) return out({ brushComb: "inert" }, "The comb waits for the sugar brush.");
  return out({ glazeShape: "line" }, "Glaze lays down as a line, not a blob.");
}

function e086(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.sugar.brush"]) return out({ brushCap: "inert" }, "The cap waits for the sugar brush.");
  return out({ keysFouled: false, glazeDripStopped: true }, "Glaze does not reach the keys.");
}

function e087(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.sugar.hook"]) return out({ hookBarb: "inert" }, "The barb waits for the sugar hook.");
  return out({ hookReach: 2, hookSticksAlone: false }, "The hook reaches farther only onto something already stuck.");
}

function e088(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.sugar.hook"]) return out({ hookFelt: "inert" }, "The felt waits for the sugar hook.");
  return out({ hookSafeOnGlass: true }, "The hook draws glass without cracking it.");
}

function e089(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.sugar.jar"]) return out({ jarBaffle: "inert" }, "The baffle waits for the sugar jar.");
  return out({ sampleSurvivesSubmerge: true, jarStillRequired: true }, "A jarred sample survives submersion. The jar is still required.");
}

function e090(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.sugar.jar"]) return out({ jarLens: "inert" }, "The lens waits for the sugar jar.");
  return out({ decayReadableClosed: true, jarOpened: false }, "Decay is visible with the jar still shut.");
}

function e091(s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  if (!s.tools["tool.ash.scoop"]) return out({ scoopSkirt: "inert" }, "The skirt waits for the ash scoop.");
  return out({ ashTrail: false }, "Scooped ash leaves no readable trail.");
}

function e092(s: Session, a: Action): EffectOut {
  if (!wants(a, "dark")) return {};
  if (!s.tools["tool.lantern.mirror"] || !s.tools["tool.lantern.body"]) {
    return out({ louver: "inert" }, "The louver has nothing to narrow. It is not a light.");
  }
  return out({ revealSlit: true }, "The mirrored beam narrows to a slit.");
}

function e093(s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  if (!s.tools["tool.ash.censer"]) return out({ censerCone: "inert" }, "The cone waits for the censer.");
  return out({ smokeColumn: true, highVentReached: true, censerStillRequired: true }, "Smoke stands in a column and can reach a high vent.");
}

function e094(s: Session, a: Action): EffectOut {
  if (!wants(a, "horn")) return {};
  if (!s.tools["tool.hollow.horn"]) return out({ hornCup: "inert" }, "The cup waits for the hollow horn.");
  return out({ listenCrack: "single", hollowDoorStillNeedsHorn: true }, "The horn hears one crack. The door still needs the horn.");
}

function e095(s: Session, a: Action): EffectOut {
  if (!wants(a, "veil")) return {};
  if (!s.tools["tool.hollow.veil"]) return out({ veilHem: "inert" }, "The hem waits for the hollow veil.");
  return out({ cloakSnag: false, thinPlaceStillNeedsVeil: true }, "The cloak does not snag. The thin place still needs the veil.");
}

function e096(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!s.tools["tool.lantern.wick"]) return out({ wickSleeve: "inert" }, "The sleeve waits for a spare wick.");
  return out({ wickStaysDry: true, wickLightsRoom: false }, "The spare wick stays dry and does not light the room.");
}

function e097(_s: Session, a: Action): EffectOut {
  if (!wants(a, "release")) return {};
  return out({ releaseMode: "thumb" }, "The hook releases the coat on purpose, so a block cannot fire the stored shot.");
}

function e098(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  const axis = s.mods[lootId(26)] === "quarry-weight" ? "vertical" : s.grainPin || "facing";
  return out({ grainPin: axis }, "The pins remember the belt's grain.");
}

function e099(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ sounding: 4 }, "The line reads a depth. It does not grant the deep crossing.");
}

function e100(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ boardHolds: "optional-sample", boardRejectsMandatory: true }, "The board holds an ordinary sample and refuses one that must stay in the jar.");
}

function e101(_s: Session, a: Action): EffectOut {
  if (!wants(a, "listen")) return {};
  return out({ chalkEcho: "chalk", chalkOpensDoor: false }, "The echo returns chalk. Nothing opens.");
}

function e102(_s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  return out({ faultTape: 0.4 }, "Tape across the fault stops a line at the tape.");
}

function e103(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ cageSetDown: true, cageSparkRadius: 0, cageTravels: false }, "The cage sets a spark down with no room light.");
}

function e104(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ clapperInCase: true, bellCase: "silent-restorable" }, "The clapper rides in the case and can be put back.");
}

function e105(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ bagKeepsDry: "fuse", roomDried: false }, "The fuse in the bag stays dry. The room does not.");
}

function e106(s: Session, a: Action): EffectOut {
  if (!wants(a, "shove")) return {};
  const belt = worn(s, 26);
  return out(
    { shoveWithoutWeapon: true, shoveResult: belt ? "grain" : "tumble" },
    belt ? "The block shoves along the belt grain." : "Without the belt the block's shove tumbles the crate.",
  );
}

function e107(s: Session, a: Action): EffectOut {
  if (!wants(a, "dark")) return {};
  const louver = s.attachments["tool.lantern.mirror"] === lootId(92);
  if (!louver) return out({ slitLocked: false, frameReason: "needs-louver" }, "The frame does nothing until a mirror louver is attached.");
  return out({ slitLocked: true }, "The slit stays at a fixed angle while you move.");
}

function e108(s: Session, a: Action): EffectOut {
  if (!wants(a, "horn")) return {};
  if (!s.tools["tool.hollow.horn"]) return out({ whistlePlugged: true, extraCrack: false }, "Without the horn the putty only plugs a small whistle.");
  return out({ extraCrack: true, whistlePlugged: false }, "The putty opens one more crack to the horn.");
}

function e109(_s: Session, a: Action): EffectOut {
  if (!wants(a, "door")) return {};
  return out({ mechanismDiff: "tooth-3-vs-tooth-4" }, "Two mechanisms differ by a tooth. The board does not unlock either.");
}

function e110(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  if (!(a.atRest ?? false)) return out({ chargesRestored: false, cradleReason: "not-at-rest" }, "The cradle only refills charges at a rest.");
  return out({ chargesRestored: true }, "At rest, spent charges fill again. Nothing was broken.");
}

function e111(s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  const main = s.slots.mainHand;
  const two = !!main && mustItem(main).hands === 2;
  return out(
    { slung: two, weaponWieldable: !two, handsFreeFromSling: two },
    two ? "The two-handed weapon rides the sling and will not strike." : "The sling has no two-handed weapon on it.",
  );
}

function e112(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ autoStow: true }, "The buckle stows gear a form cannot wear. That gear stays in the pack.");
}

function e113(_s: Session, a: Action): EffectOut {
  if (!wants(a, "door")) return {};
  return out({ compareSeams: "square-vs-slanted" }, "The lens shows how a square seam differs from a slanted one.");
}

function e114(s: Session, a: Action): EffectOut {
  if (!wants(a, "net")) return {};
  if (!s.tools["tool.creek.net"]) return out({ filterRestore: "inert" }, "The card waits for the creek net.");
  const mode = s.mods[lootId(114)] || "bolt";
  return out({ filterRestore: mode }, `The card puts ${mode} back on the net's catch list.`);
}

function e115(s: Session, a: Action): EffectOut {
  if (!wants(a, "dark") && !wants(a, "stake")) return {};
  if (!s.tools["tool.lantern.body"]) return out({ stake: "failed", stakeReason: "no-lantern-body" }, "There is no lantern body to plant.");
  if (a.kind === "unstake" || a.removeLantern) return out({ stake: "removed" }, "The lantern leaves the stake.");
  return out({ stake: "planted", lightStaysInRoom: true }, "The lantern tool is planted. Take it away and the dark returns.");
}

function e116(s: Session, a: Action): EffectOut {
  if (!wants(a, "snuff")) return {};
  const freed = s.ashLiberated || ((a.scoopUsed ?? false) && s.tools["tool.ash.scoop"]);
  if (!freed) return out({ ashCarry: false, ashReason: "not-liberated" }, "The tray cannot lift a pile the scoop has not freed.");
  return out({ ashCarry: true }, "Liberated ash rides in the tray.");
}

function e117(s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ sugarThread: charge(s, 117) }, "The spool holds sugar thread for a needle or a combed line.");
}

function e118(s: Session, a: Action): EffectOut {
  if (!wants(a, "mark")) return {};
  return out({ safeFlag: `${s.x},${s.y}` }, "The flag makes this tile a legal safe mark during a fight.");
}

function e119(_s: Session, a: Action): EffectOut {
  if (!wants(a, "counter")) return {};
  return out({ offHandReserved: "tool.quarry.pry", twoHandBlocked: true }, "The off-hand stays reserved for the pry. A two-handed weapon will not equip.");
}

function e120(_s: Session, a: Action): EffectOut {
  if (!wants(a, "explore")) return {};
  return out({ keepsHeldOnDeath: true }, "On death, whatever is in the hands stays equipped. Nothing is destroyed either way.");
}

export const EFFECT_LIST: Array<(s: Session, a: Action) => EffectOut> = [
  e001, e002, e003, e004, e005, e006, e007, e008, e009, e010, e011, e012, e013, e014, e015, e016, e017, e018, e019, e020, e021, e022, e023, e024,
  e025, e026, e027, e028, e029, e030, e031, e032, e033, e034, e035, e036, e037, e038, e039, e040, e041, e042, e043, e044, e045, e046, e047, e048,
  e049, e050, e051, e052, e053, e054, e055, e056, e057, e058, e059, e060, e061, e062, e063, e064, e065, e066, e067, e068, e069, e070, e071, e072,
  e073, e074, e075, e076, e077, e078, e079, e080, e081, e082, e083, e084, e085, e086, e087, e088, e089, e090, e091, e092, e093, e094, e095, e096,
  e097, e098, e099, e100, e101, e102, e103, e104, e105, e106, e107, e108, e109, e110, e111, e112, e113, e114, e115, e116, e117, e118, e119, e120,
];

export const EFFECTS: Record<string, (s: Session, a: Action) => EffectOut> = Object.fromEntries(
  EFFECT_LIST.map((fn, i) => [lootId(i + 1), fn]),
);
