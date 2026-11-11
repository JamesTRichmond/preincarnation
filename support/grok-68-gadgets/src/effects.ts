import { ActionFail, APPROVED_LAMPS, type Args, type Enemy, type KitItem, type LampMode, type Op, type OpName, type World } from "./types.ts";
import { ID, IRON_IDS } from "./ids.ts";

export type FxCtx = {
  world: World;
  self: KitItem;
  op: Op;
  args: Args;
  proofs: string[];
  notes: string[];
};

function fail(code: string, note: string, commit = false): never {
  throw new ActionFail(code, note, commit);
}

function done(ctx: FxCtx, note: string): void {
  ctx.proofs.push(ctx.op.op);
  ctx.notes.push(note);
  ctx.world.log.push(note);
}

function bag(ctx: FxCtx, id: string): Record<string, string | number | boolean> {
  if (!ctx.world.places[id]) ctx.world.places[id] = {};
  return ctx.world.places[id];
}

function put(ctx: FxCtx, id: string, field: string, value: string | number | boolean): void {
  bag(ctx, id)[field] = value;
}

function foe(ctx: FxCtx, id: string): Enemy {
  const e = ctx.world.enemies.find((x) => x.id === id);
  if (!e) fail("NO_TARGET", `Nothing here is “${id}”.`);
  return e;
}

function ofKind(ctx: FxCtx, kind: Enemy["kind"]): Enemy[] {
  return ctx.world.enemies.filter((e) => e.kind === kind);
}

function lampOf(ctx: FxCtx, id: string) {
  const l = ctx.world.lamps.find((x) => x.id === id);
  if (!l) fail("NO_LAMP", `No lamp “${id}” in this scene.`);
  return l;
}

function compOf(ctx: FxCtx, id: string) {
  const c = ctx.world.compartments.find((x) => x.id === id);
  if (!c) fail("NO_COMPARTMENT", `No compartment “${id}”.`);
  return c;
}

function balOf(ctx: FxCtx, id: string) {
  const b = ctx.world.balances.find((x) => x.id === id);
  if (!b) fail("NO_BALANCE", `No balance “${id}”.`);
  return b;
}

function puzzleOf(ctx: FxCtx, id: string) {
  const p = ctx.world.puzzles[id];
  if (!p) fail("NO_PUZZLE", `No authored puzzle “${id}”.`);
  return p;
}

function kitOf(ctx: FxCtx, id: string): KitItem | undefined {
  return ctx.world.kit.find((k) => k.lootId === id);
}

function needKit(ctx: FxCtx, id: string, code: string, note: string): KitItem {
  const k = kitOf(ctx, id);
  if (!k) fail(code, note);
  return k;
}

function addMod(item: KitItem, mod: string): void {
  if (!item.mods.includes(mod)) item.mods.push(mod);
}

function spendWind(ctx: FxCtx): void {
  if (ctx.self.winds <= 0) fail("UNWOUND", "The spring is spent.");
  ctx.self.winds -= 1;
}

function argNum(ctx: FxCtx, key: string, fallback?: number): number {
  const v = ctx.args[key];
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  if (fallback !== undefined) return fallback;
  fail("MISSING_ARG", `This action needs a number “${key}”.`);
}

function argStr(ctx: FxCtx, key: string, fallback?: string): string {
  const v = ctx.args[key];
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (fallback !== undefined) return fallback;
  fail("MISSING_ARG", `This action needs “${key}”.`);
}

function reading(ctx: FxCtx, tool: string, value: string): void {
  ctx.world.readings.push({ tool, value });
  if (ctx.world.flags.autoLog === true) ctx.world.notes.push(`${tool}: ${value}`);
}

function requirePlace(ctx: FxCtx, id: string, code: string, note: string) {
  const p = ctx.world.places[id];
  if (!p) fail(code, note);
  return p;
}

const impl: Record<OpName, (ctx: FxCtx) => void> = {
  distractNarrow(ctx) {
    const e = foe(ctx, ctx.op.id ?? "narrow-foe");
    if (e.kind !== "narrow") fail("WRONG_CLASS", `${e.id} is ${e.kind}, not narrow. The bird only pulls a narrow attention.`);
    const range = ctx.op.n2 ?? 6;
    if (e.rangeYd > range) fail("OUT_OF_RANGE", `${e.id} is ${e.rangeYd} yards out. The bird carries ${range}.`);
    spendWind(ctx);
    const full = ctx.op.n ?? 8;
    const glanced = e.needsBearing === true && ctx.world.flags.birdBearing !== e.id;
    e.alert = "distracted";
    e.timer = glanced ? Math.floor(full / 2) : full;
    done(ctx, glanced
      ? `${e.id} glances off the jamb. Distracted ${e.timer}s — set a bearing if you want the full flight.`
      : `${e.id} locks onto the winding bird for ${e.timer}s.`);
  },
  cadenceLock(ctx) {
    const p = puzzleOf(ctx, ctx.op.id ?? "cadence");
    if (ctx.args.cancel === true) fail("CANCELLED", "You moved before the last chirp.");
    spendWind(ctx);
    p.progress = ctx.op.n ?? 20;
    p.solved = true;
    p.detail = `${p.progress} chirps`;
    done(ctx, `The bird finished ${p.progress} chirps. The cadence lock answers.`);
  },
  measureDrift(ctx) {
    const creek = requirePlace(ctx, ctx.op.id ?? "creek", "NO_WATER", "The reel measures water, and there is none.");
    if (creek.water !== true) fail("NO_WATER", "The reel measures water, and there is none.");
    const feet = ctx.op.n ?? 30;
    const seconds = ctx.op.n2 ?? 30;
    const fps = Math.round((feet / seconds) * 100) / 100;
    put(ctx, ctx.op.id ?? "creek", "driftFps", fps);
    done(ctx, `Paid out ${feet} ft in ${seconds}s. Drift is ${fps} ft/s.`);
  },
  holdLatch(ctx) {
    const latch = requirePlace(ctx, ctx.op.id ?? "latch", "NO_LATCH", "Nothing here takes the reel as a leash.");
    const need = Number(latch.required ?? 0);
    const give = ctx.op.n ?? 8;
    if (give < need) fail("TOO_WEAK", `The latch wants ${need} lb. The reel holds ${give}.`);
    put(ctx, ctx.op.id ?? "latch", "held", true);
    done(ctx, `Reel locked. The latch holds at ${give} lb.`);
  },
  slowChime(ctx) {
    if (ctx.world.flags.clockElectric === true) fail("NOT_MECHANICAL", "An electric striker has no pallet to retard.");
    const p = puzzleOf(ctx, ctx.op.id ?? "chime");
    p.progress = 2;
    p.detail = "half-rate";
    p.solved = true;
    done(ctx, "Escapement in the train. The chime now strikes at half rate.");
  },
  rateCheck(ctx) {
    if (ctx.world.flags.clockElectric === true) fail("NOT_MECHANICAL", "No mechanical rate to compare.");
    const clock = requirePlace(ctx, ctx.op.id ?? "clock", "NO_CLOCK", "No suspect clock in reach.");
    const honest = clock.suspect !== true;
    put(ctx, ctx.op.id ?? "clock", "honest", honest);
    done(ctx, honest ? "The pallet agrees. This clock's rate is true." : "The pallet argues. This clock is fast or slow.");
  },
  liftSash(ctx) {
    const sash = requirePlace(ctx, ctx.op.id ?? "sash", "NO_SASH", "No sash under the cam.");
    if (sash.wood !== true) fail("NOT_WOOD", "The cam walks out of anything but wood.");
    const turns = Number(sash.turns ?? 0);
    const max = ctx.op.n2 ?? 3;
    if (turns >= max) fail("WALKED_OUT", "Three turns is the cam's whole travel.");
    const step = ctx.op.n ?? 0.25;
    put(ctx, ctx.op.id ?? "sash", "turns", turns + 1);
    put(ctx, ctx.op.id ?? "sash", "liftInches", Math.round((Number(sash.liftInches ?? 0) + step) * 100) / 100);
    done(ctx, `Sash up ${step} in. Turn ${turns + 1} of ${max}.`);
  },
  copyTemplate(ctx) {
    const which = ctx.op.s ?? "part";
    ctx.world.flags[`template:${which}`] = true;
    done(ctx, `The ${which} profile is on the card.`);
  },
  chimeHour(ctx) {
    spendWind(ctx);
    ctx.world.flags.hourStruck = ctx.world.hour;
    const ears = ofKind(ctx, "keen-ear").filter((e) => e.rangeYd <= 8);
    for (const e of ears) {
      e.alert = "drawn";
      e.timer = 6;
    }
    done(ctx, ears.length
      ? `The repeater strikes ${ctx.world.hour} into the palm — and a keen ear turns.`
      : `The repeater strikes ${ctx.world.hour} into the palm.`);
  },
  setAlarm(ctx) {
    const q = argNum(ctx, "quarters", ctx.op.n ?? 1);
    if (q < 1 || q > 4) fail("BAD_QUARTER", "The repeater only takes one to four quarters.");
    spendWind(ctx);
    ctx.world.flags.alarmQuarters = q;
    const p = puzzleOf(ctx, ctx.op.id ?? "alarm");
    p.solved = true;
    p.detail = `${q} quarters`;
    done(ctx, `Alarm set for ${q} quarter-hours. It will ring once.`);
  },
  tally(ctx) {
    if (ctx.world.weather.wet) fail("MUD_JAM", "Mud in the pawl. The wheel will not click.");
    const box = bag(ctx, ctx.op.id ?? "flock");
    const count = Number(box.count ?? 0) + (ctx.op.n ?? 1);
    if (count > 999) fail("TALLY_FULL", "The wheel stops at 999.");
    box.count = count;
    done(ctx, `Tally ${count}.`);
  },
  reconcileTally(ctx) {
    const box = requirePlace(ctx, ctx.op.id ?? "flock", "NO_COUNT", "Nothing has been tallied.");
    const mine = Number(box.count ?? 0);
    const other = ctx.op.n ?? 0;
    if (mine !== other) fail("COUNT_OFF", `Wheel says ${mine}. The other count is ${other}.`);
    box.reconciled = true;
    done(ctx, `Both counts are ${mine}. The warden's number stands.`);
  },
  letOff(ctx) {
    const plate = bag(ctx, ctx.op.id ?? "plate");
    const force = Number(plate.force ?? 0) + (ctx.op.n ?? 0);
    if (force < -3 || force > 3) fail("STRIPPED", "The let-off screw only travels three steps either side of factory.");
    plate.force = force;
    done(ctx, `Let-off is now ${force}. Draft and light fingers meet a different threshold.`);
  },
  fitSector(ctx) {
    const drill = requirePlace(ctx, ctx.op.id ?? "drill", "NO_HOST", "No seized drill to take the sector.");
    if (drill.seized !== true) fail("NO_HOST", "The sector only replaces a seized speed.");
    drill.speedRestored = true;
    done(ctx, "One speed is back in the drill. It is a repair, not a machine.");
  },
  countTurns(ctx) {
    const host = requirePlace(ctx, ctx.op.id ?? "drill", "NO_HOST", "Nothing is counting turns.");
    if (host.kind !== "drill") fail("NO_HOST", "The sector counts a drill, not this.");
    host.lockedAt = 12;
    host.depthMarked = true;
    done(ctx, "The sector locks at twelve turns. Depth is marked.");
  },
  showSchedule(ctx) {
    if (ctx.world.flags.dialLost === true) fail("DIAL_LOST", "The paper dial is gone. The cam has nothing to show.");
    ctx.world.flags.scheduleShown = true;
    put(ctx, "bells", "card", "first-life");
    reading(ctx, "weybridge-bell-dial", "old schedule");
    done(ctx, "The dial still names the college bells from Ellis's first life. Fourteen years stale, on purpose.");
  },
  diffSchedule(ctx) {
    const p = puzzleOf(ctx, ctx.op.id ?? "bells");
    put(ctx, "bells", "offsetMin", 16);
    p.solved = true;
    p.detail = "16 min";
    done(ctx, "Living bell minus the old dial: sixteen minutes. That offset is the lock.");
  },
  advancePawl(ctx) {
    const lock = requirePlace(ctx, ctx.op.id ?? "lock", "WRONG_SOCKET", "This socket is not a pawl lock.");
    if (lock.kind !== "pawl") fail("WRONG_SOCKET", "The bit only advances a pawl socket.");
    if (ctx.args.back === true) fail("NO_REWIND", "The pawl will not rewind.");
    lock.tooth = Number(lock.tooth ?? 0) + 1;
    done(ctx, `Pawl advanced to tooth ${lock.tooth}.`);
  },
  holdRatchet(ctx) {
    const lock = requirePlace(ctx, ctx.op.id ?? "lock", "NO_TOOTH", "No ratchet here.");
    if (Number(lock.tooth ?? 0) < 1) fail("NO_TOOTH", "Seat the pawl one tooth before it can hold the ratchet open.");
    put(ctx, ctx.op.id ?? "weight", "descending", true);
    done(ctx, "Ratchet held open. The weight descends slowly.");
  },
  ferryNote(ctx) {
    const gap = requirePlace(ctx, ctx.op.id ?? "line", "NO_LINE", "The beetle needs a line.");
    if (gap.sag === true) fail("SAG", "The line sags more than a hand. The beetle walks off.");
    const yards = Number(gap.yards ?? 0);
    if (yards > (ctx.op.n ?? 8)) fail("TOO_FAR", "Eight yards is the beetle's spring.");
    spendWind(ctx);
    gap.delivered = true;
    done(ctx, `The beetle carried the slip ${yards} yards.`);
  },
  walkDistance(ctx) {
    const gap = requirePlace(ctx, ctx.op.id ?? "line", "NO_LINE", "No line to time.");
    if (gap.sag === true) fail("SAG", "A sagging line lies about distance.");
    const yards = Number(gap.yards ?? 0);
    gap.measuredYards = yards;
    reading(ctx, "line-beetle", `${yards} yd`);
    done(ctx, `Two seconds a foot, level line: ${yards} yards.`);
  },
  muteStrike(ctx) {
    if (ctx.world.flags.clockElectric === true) fail("NOT_MECHANICAL", "No hammer to lift on this clock.");
    put(ctx, ctx.op.id ?? "clock", "muted", true);
    done(ctx, "Hammer lifted. The clock keeps time and makes no strike.");
  },
  knockTest(ctx) {
    const surface = requirePlace(ctx, ctx.op.id ?? "wall", "NO_SURFACE", "Nothing to knock.");
    surface.hollow = surface.hollow === true;
    done(ctx, surface.hollow ? "The tap is hollow. This is not a hertz match — only hollow or solid." : "The tap is solid.");
  },
  evenSash(ctx) {
    const sash = requirePlace(ctx, ctx.op.id ?? "sash", "NO_SASH", "No sash cord to even.");
    if (Number(sash.cordDiameter ?? 0) !== (ctx.op.n ?? 0.375)) fail("CORD_MISMATCH", "The cone's groove does not match this cord.");
    sash.even = true;
    done(ctx, "Fusee cone on the cord. The tired sash rises evenly.");
  },
  doorTrip(ctx) {
    const door = requirePlace(ctx, ctx.op.id ?? "door", "NO_DOOR", "No jamb for the pin.");
    if (Number(door.spanFt ?? 0) > 20) fail("STRING_SHORT", "The trip string stops at twenty feet.");
    door.armed = true;
    ctx.world.flags.tripSet = true;
    done(ctx, "Trip pin set. Opening the door will ping the bell you carry.");
  },
  showBentPin(ctx) {
    const door = requirePlace(ctx, ctx.op.id ?? "door", "NOT_TRIPPED", "The pin is still straight.");
    if (door.opened !== true) fail("NOT_TRIPPED", "The pin bends only if the door opened.");
    door.proof = true;
    done(ctx, "The bent pin is the proof. Someone opened the door.");
  },
  weekdaySpan(ctx) {
    const years = argNum(ctx, "years", ctx.op.n ?? 14);
    if (years !== 14) fail("NOT_OUR_SPAN", "This orrery is set for the fourteen-year return, not a general calendar.");
    const p = puzzleOf(ctx, ctx.op.id ?? "weekday");
    put(ctx, "calendar", "offset", 3);
    p.solved = true;
    p.detail = "plus 3 weekdays";
    done(ctx, "Fourteen years from that Tuesday lands three weekdays on. Gears, not a fortune.");
  },
  indexJournal(ctx) {
    ctx.world.flags.journalIndexed = true;
    done(ctx, "While the orrery is up, the journal indexes by weekday.");
  },
  maintainingWind(ctx) {
    const clock = requirePlace(ctx, ctx.op.id ?? "clock", "NO_CLOCK", "No clock is being wound.");
    clock.keptTime = true;
    done(ctx, "Maintaining power holds the clock while you wind, so the time is not lost.");
  },
  loanExtraWind(ctx) {
    if (ctx.self.mods.includes("spent-loan")) fail("LOAN_SPENT", "The maintaining spring already lent its extra wind this scene.");
    const bird = needKit(ctx, ID.bird, "NO_BIRD", "The loan is for the winding bird.");
    bird.winds += 1;
    addMod(bird, "loaned-spring");
    addMod(ctx.self, "spent-loan");
    ctx.self.condition = Math.max(0, ctx.self.condition - 15);
    done(ctx, "One extra wind is in the bird. The maintaining spring is tired.");
  },
  retuneLamp(ctx) {
    const lamp = lampOf(ctx, ctx.op.id ?? "lamp");
    if (!lamp.lit) fail("LAMP_OUT", "The lamp is out. The prism has nothing to retune.");
    if (!APPROVED_LAMPS.includes(lamp.kind)) {
      fail("LAMP_REFUSED", `${lamp.kind} is not an approved lamp. The prism takes barn-kerosene, brass-pocket, or church-vigil.`);
    }
    const mode = (ctx.op.mode ?? "spectrum-stripe") as LampMode;
    lamp.mode = mode;
    if (mode === "spectrum-stripe") {
      const docId = ctx.op.s ?? "hymnal";
      const doc = ctx.world.documents[docId];
      if (doc) doc.revealed = true;
      done(ctx, `The ${lamp.kind} lamp throws a spectrum stripe. Spectrum-ink in it can be read.`);
      return;
    }
    if (mode === "baffled-warm") {
      lamp.moths = false;
      done(ctx, "Warm baffle. The same lamp no longer gathers phototactic moths.");
      return;
    }
    fail("BAD_MODE", "The prism has two interactions: spectrum-stripe or baffled-warm.");
  },
  magnify(ctx) {
    const doc = ctx.world.documents[ctx.op.id ?? "note"];
    if (!doc) fail("NO_MARK", "No pencil note under the lens.");
    doc.revealed = true;
    done(ctx, "The reading lens lifts the two-millimeter pencil note.");
  },
  sunEmber(ctx) {
    if (!ctx.world.weather.day || ctx.world.weather.overcast || ctx.world.flags.indoors === true) {
      fail("NO_SUN", "The lens wants open day. It will not light tinder off a lamp.");
    }
    put(ctx, ctx.op.id ?? "tinder", "ember", true);
    put(ctx, ctx.op.id ?? "tinder", "seconds", 8);
    done(ctx, "Eight seconds of sun through the lens. A slow ember, not a weapon.");
  },
  cutGlare(ctx) {
    if (!ctx.world.weather.day) fail("NIGHT", "The polarizer has no lake glare to cut at night.");
    const bay = requirePlace(ctx, ctx.op.id ?? "bay", "NO_GLARE", "No glare-hidden mark in this view.");
    if (bay.glareHidden !== true) fail("NO_GLARE", "Nothing here is hidden by glare.");
    bay.seen = true;
    done(ctx, "Glare cut. The buoy (or the skiff) is in the lane.");
  },
  varnishStrain(ctx) {
    const piece = requirePlace(ctx, ctx.op.id ?? "piece", "NO_PIECE", "No varnished piece to read.");
    piece.strain = piece.varnish === "even" ? "holds" : "fails";
    done(ctx, `Strain colors say the repair ${piece.strain}.`);
  },
  traceSkyline(ctx) {
    if (!ctx.world.weather.day) fail("NO_LIGHT", "The camera lucida needs daylight.");
    ctx.world.flags.sketchReady = true;
    reading(ctx, "lucida", "skyline");
    done(ctx, "Skyline traced on the card.");
  },
  alignPost(ctx) {
    const post = requirePlace(ctx, ctx.op.id ?? "post", "NO_POST", "No post to align.");
    if (post.photo !== true) fail("NO_PHOTO", "The ghost image needs the first-life photograph.");
    post.aligned = true;
    done(ctx, "The new post sits on the old photograph, growth and all.");
  },
  hoodLamp(ctx) {
    const lamp = lampOf(ctx, ctx.op.id ?? "lamp");
    if (!lamp.lit) fail("LAMP_OUT", "There is no flame to hood.");
    lamp.mode = "hooded";
    done(ctx, "Slide down. The lamp stays lit and throws no pool. This is a cover, not a retune.");
  },
  contactPrint(ctx) {
    const sheets = ctx.world.materials.blueprint ?? 0;
    if (sheets < 1) fail("NO_SHEET", "The dark slide holds one sheet, and it is empty.");
    ctx.world.materials.blueprint = sheets - 1;
    ctx.world.flags.printMade = true;
    done(ctx, "Contact print pulled. The sheet is spent.");
  },
  readGreen(ctx) {
    const page = requirePlace(ctx, ctx.op.id ?? "ledger", "NO_PAGE", "No ledger under the green glass.");
    if (page.ink !== "green") fail("WRONG_INK", "This glass only lifts faded green ink, not spectrum-ink.");
    const doc = ctx.world.documents[ctx.op.s ?? "ledger"];
    if (doc) doc.revealed = true;
    page.read = true;
    done(ctx, "Green-ink figures come up. Other inks stay faded.");
  },
  ripeness(ctx) {
    const tray = requirePlace(ctx, ctx.op.id ?? "tray", "NO_TRAY", "No seed tray to judge.");
    const ready = Number(tray.sugar ?? 0) >= 12;
    tray.called = ready ? "ready" : "wait";
    done(ctx, ready ? "Color match says ready." : "Color match says wait.");
  },
  colinear(ctx) {
    const posts = requirePlace(ctx, ctx.op.id ?? "posts", "NO_STEEPLE", "No steeple in the tube.");
    if (posts.steeple !== true) fail("NO_STEEPLE", "The collimator wants a steeple, or some other far mark.");
    posts.reported = posts.trueLine === true;
    reading(ctx, "collimator", posts.reported ? "colinear" : "off");
    done(ctx, posts.reported ? "Posts and steeple stand in one line." : "The line breaks before the steeple.");
  },
  birdBearing(ctx) {
    const corridor = ctx.op.s ?? "lane";
    ctx.world.flags.birdBearing = corridor;
    put(ctx, "release", "bearing", corridor);
    done(ctx, `Release bearing set down ${corridor}. The winding bird will take the corridor if you loose it.`);
  },
  readFlame(ctx) {
    const burner = requirePlace(ctx, ctx.op.id ?? "burner", "NO_FLAME", "The slit reads a flame, not a cold lamp.");
    if (burner.flame !== true) fail("NO_FLAME", "The slit reads a flame, not a cold lamp.");
    burner.named = String(burner.element ?? "unknown");
    done(ctx, `Flame names ${burner.named}.`);
  },
  assayGlass(ctx) {
    const glass = requirePlace(ctx, ctx.op.id ?? "glass", "NO_GLASS", "No glass sample.");
    glass.assay = String(glass.truth ?? "soda");
    done(ctx, `The glass assays ${glass.assay}.`);
  },
  rangeFind(ctx) {
    const mark = requirePlace(ctx, ctx.op.id ?? "mark", "NO_MARK", "No far mark.");
    const yards = Number(mark.yards ?? 0);
    if (yards < 10) fail("TOO_CLOSE", "The coincidence finder is useless under ten yards.");
    mark.errorPct = 4;
    mark.estimate = yards;
    reading(ctx, "range", `${yards} yd ±4%`);
    done(ctx, `${yards} yards, within four percent.`);
  },
  straightedge(ctx) {
    ctx.world.flags.straightedge = true;
    reading(ctx, "straightedge", "20 cm");
    done(ctx, "Twenty-centimeter edge is true enough for the card.");
  },
  stereoDiff(ctx) {
    const pair = requirePlace(ctx, ctx.op.id ?? "pair", "NO_CARD", "The stereo pair is missing a card.");
    if (pair.missing === true) fail("NO_CARD", "A card is missing from the pair.");
    pair.changes = String(pair.truth ?? "fence-moved");
    done(ctx, `Fourteen years in the stereoscope: ${pair.changes}.`);
  },
  rumorTrade(ctx) {
    const pair = requirePlace(ctx, ctx.op.id ?? "pair", "NO_VISITOR", "Nobody is waiting for a look.");
    if (pair.visitor !== true) fail("NO_VISITOR", "Nobody is waiting for a look.");
    ctx.world.flags.rumorHeard = true;
    ctx.world.notes.push(String(pair.rumor ?? "The ferry kept the old bell."));
    done(ctx, "A look at the pair buys one local rumor.");
  },
  seeSmoke(ctx) {
    const room = requirePlace(ctx, ctx.op.id ?? "room", "CLEAR_AIR", "The smoke glass does nothing in clear air.");
    if (room.smoke !== true) fail("CLEAR_AIR", "The smoke glass does nothing in clear air.");
    room.seen = true;
    done(ctx, "Scatter cut enough to show the doorway's shape.");
  },
  jarLift(ctx) {
    put(ctx, ctx.op.id ?? "jar", "open", true);
    done(ctx, "The rim unscrews as a jar lifter.");
  },
  dewTrace(ctx) {
    if (!ctx.world.weather.dawn) fail("NOT_DAWN", "Dew traces last until the sun is fully up, and it is not dawn.");
    const trail = requirePlace(ctx, ctx.op.id ?? "trail", "NO_DEW", "No dew on this ground.");
    trail.prints = true;
    done(ctx, "Footprints in the dew, gone by full day.");
  },
  edgeGlance(ctx) {
    const door = requirePlace(ctx, ctx.op.id ?? "door", "NO_DOOR", "No door edge.");
    door.edgeSeen = true;
    done(ctx, "A dull glance around the edge. It does not pull anyone's attention.");
  },
  sunAlt(ctx) {
    if (ctx.world.weather.overcast) fail("OVERCAST", "No sun for the cross-staff.");
    ctx.world.flags.midday = ctx.world.hour === 12;
    reading(ctx, "cross-staff", ctx.world.hour === 12 ? "midday" : `hour ${ctx.world.hour}`);
    done(ctx, ctx.world.flags.midday === true ? "Sun says midday." : "Sun is off midday.");
  },
  shadowSeason(ctx) {
    const mark = requirePlace(ctx, ctx.op.id ?? "mark", "NO_MARK", "No scratched shadow-mark.");
    mark.seasonMatch = mark.sameSeason === true;
    reading(ctx, "gnomon-shadow", mark.seasonMatch ? "same season" : "season shifted");
    done(ctx, mark.seasonMatch ? "Shadow meets the first-life scratch." : "The shadow misses the old scratch.");
  },
  sundial(ctx) {
    const card = bag(ctx, "dial");
    if (card.level !== true) fail("UNLEVELED", "The gnomon card lies unless you level it.");
    if (!ctx.world.weather.day || ctx.world.weather.overcast) fail("NO_SUN", "No sun on the card.");
    ctx.world.flags.dialHour = ctx.world.hour;
    done(ctx, `Dial reads ${ctx.world.hour}, give or take a quarter hour.`);
  },
  punchMap(ctx) {
    put(ctx, ctx.op.id ?? "map", "tick", true);
    done(ctx, "One survey tick in the margin.");
  },
  readHallmark(ctx) {
    const piece = requirePlace(ctx, ctx.op.id ?? "piece", "NO_PIECE", "No hallmark under the loupe.");
    if (piece.faint === true && ctx.world.flags.graphite !== true) fail("TOO_FAINT", "Too faint for the loupe alone. Graphite dust would find it.");
    piece.maker = String(piece.truth ?? "unknown");
    done(ctx, `Hallmark: ${piece.maker}.`);
  },
  aidFineRestore(ctx) {
    ctx.world.flags.fineAid = true;
    addMod(ctx.self, "loupe-ready");
    done(ctx, "Loupe seated. The next restoration on this bench is less likely to slip.");
  },
  measureAngle(ctx) {
    const marks = requirePlace(ctx, ctx.op.id ?? "marks", "NO_MARKS", "No two landmarks in the arc.");
    const deg = Number(marks.degrees ?? 0);
    if (deg > 40) fail("PAST_ARC", "The broken arc stops at forty degrees. It will not guess.");
    marks.readAngle = deg;
    reading(ctx, "broken-arc", `${deg}°`);
    done(ctx, `${deg} degrees on the surviving arc.`);
  },
  yieldRouge(ctx) {
    if (ctx.self.condition <= 0 && ctx.self.mods.includes("mirror-stripped")) {
      fail("ALREADY_STRIPPED", "The index mirror is already gone.");
    }
    ctx.self.condition = 0;
    addMod(ctx.self, "mirror-stripped");
    ctx.world.materials.rouge = (ctx.world.materials.rouge ?? 0) + 1;
    done(ctx, "Index mirror sacrificed. One rouge polish for the hand prism.");
  },
  revealCompartment(ctx) {
    if (!ctx.self.mods.includes("calibrated")) {
      fail("UNCALIBRATED", "Touch the reference fork to the horn before it will match a hertz.");
    }
    if (ctx.world.weather.wind === "fresh") fail("WIND_MASK", "A fresh breeze masks the resonator.");
    const c = compOf(ctx, ctx.op.id ?? "hide");
    const hz = argNum(ctx, "hz", ctx.op.n ?? 0);
    if (hz !== c.hertz) fail("WRONG_PLATE", `Plate ${hz} does not match this board.`);
    c.revealed = true;
    if (!ctx.self.mods.includes("padded")) {
      for (const e of ofKind(ctx, "rhythm")) {
        if (e.rangeYd <= 4) {
          e.alert = "drawn";
          e.timer = 5;
        }
      }
    }
    done(ctx, c.revealed
      ? "The board rattles on the matching plate. The compartment is located, not opened."
      : "No rattle.");
  },
  identifySound(ctx) {
    if (ctx.world.weather.wind === "fresh") fail("WIND_MASK", "A fresh breeze fills the horn.");
    const hidden = ctx.world.hiddenSounds[0];
    const near = ctx.world.sounds[0];
    const heard = hidden ?? near;
    if (!heard) fail("NOTHING_QUIET", "The folded horn hears neither a hidden tone nor a near one.");
    ctx.world.identifiedSound = heard.id;
    done(ctx, `The horn names ${heard.label}. It does not keep the sound.`);
  },
  recordSound(ctx) {
    const soundId = argStr(ctx, "soundId");
    if (soundId.startsWith("speech:")) fail("SPEECH_REFUSED", "The wax takes an environmental sound, not a person's speech.");
    const audible = ctx.world.sounds.some((s) => s.id === soundId) || ctx.world.identifiedSound === soundId;
    if (!audible) fail("NOT_HEARD", `${soundId} is not in the air, and the horn has not named it.`);
    const previous = ctx.self.recorded;
    ctx.self.recorded = soundId;
    ctx.self.plays = 3;
    done(ctx, previous
      ? `Wax overwritten. ${previous} is destroyed. One take: ${soundId}. Three playbacks.`
      : `One take cut: ${soundId}. Three playbacks before the wax goes flat.`);
  },
  playRecording(ctx) {
    const p = puzzleOf(ctx, ctx.op.id ?? "sound-lock");
    if (ctx.self.plays <= 0) fail("WAX_FLAT", "The wax is flat. Recast a blank before another play.");
    if (ctx.self.recorded !== p.expects) fail("WRONG_SOUND", `The lock wants ${p.expects}. The cylinder holds ${ctx.self.recorded ?? "nothing"}.`);
    ctx.self.plays -= 1;
    p.solved = true;
    p.detail = ctx.self.recorded ?? "";
    done(ctx, `The lock takes ${ctx.self.recorded}. Playbacks left: ${ctx.self.plays}.`);
  },
  givePitch(ctx) {
    const bell = requirePlace(ctx, ctx.op.id ?? "bell", "NO_BELL", "No bell to compare.");
    if (bell.crushed === true) fail("REED_STUCK", "The pitch pipe's reed is stuck.");
    bell.cents = Number(bell.truth ?? 0);
    ctx.world.flags.pitchA = true;
    reading(ctx, "pitch-pipe", `${bell.cents} cents`);
    done(ctx, `Reference A. The bell sits ${bell.cents} cents off.`);
  },
  measureGapInches(ctx) {
    const n = ctx.op.n ?? 3;
    if (n < 2 || n > 4) fail("OUT_OF_SLIDE", "The slide marks two to four inches only.");
    put(ctx, ctx.op.id ?? "gap", "inches", n);
    done(ctx, `Gap marked at ${n} inches.`);
  },
  hailFerry(ctx) {
    if (ctx.world.flags.conchUsed === true) fail("NEED_BREATH", "One blast, then you need your breath back.");
    const basin = requirePlace(ctx, ctx.op.id ?? "basin", "NO_WATER", "The conch hails across water.");
    if (basin.water !== true) fail("NO_WATER", "The conch hails across water.");
    basin.ferry = "approaching";
    ctx.world.flags.conchUsed = true;
    done(ctx, "The low blast crosses the basin. The ferry turns.");
  },
  startleFlock(ctx) {
    if (ctx.world.flags.conchUsed === true) fail("NEED_BREATH", "One blast, then you need your breath back.");
    const flock = ofKind(ctx, "flock").filter((e) => e.rangeYd <= (ctx.op.n ?? 30));
    if (!flock.length) fail("NO_FLOCK", "No flock in earshot to startle.");
    for (const e of flock) {
      e.alert = "startled";
      e.timer = 5;
    }
    ctx.world.flags.conchUsed = true;
    done(ctx, "The blast startles the flock off the path for a few seconds. It does not touch a narrow attention.");
  },
  freezeRhythm(ctx) {
    const rows = ofKind(ctx, "rhythm");
    if (!rows.length) fail("NO_RHYTHM", "Nothing here entrains to a beat.");
    const beats = ctx.op.n ?? 6;
    for (const e of rows) {
      e.alert = "frozen";
      e.timer = beats;
    }
    for (const e of ofKind(ctx, "narrow")) {
      if (e.rangeYd <= 8) {
        e.alert = "drawn";
        e.timer = beats;
      }
    }
    done(ctx, `Rhythm holds for ${beats} beats. The tick can also draw a narrow ear.`);
  },
  beatLock(ctx) {
    const want = ctx.op.n ?? 8;
    const got = argNum(ctx, "beats", want);
    if (got !== want) fail("WRONG_BEAT", `The lock opens on beat ${want}.`);
    const p = puzzleOf(ctx, ctx.op.id ?? "beat");
    p.solved = true;
    p.detail = `beat ${want}`;
    done(ctx, `Beat ${want} lands. The lock opens.`);
  },
  loosePane(ctx) {
    const win = requirePlace(ctx, ctx.op.id ?? "window", "NOT_GLASS", "The reed buzzes glass, not this.");
    if (win.glass !== true) fail("NOT_GLASS", "The reed buzzes glass, not this.");
    win.foundLoose = Number(win.looseIndex ?? 0) > 0;
    done(ctx, win.foundLoose ? `Pane ${win.looseIndex} drinks the buzz. It is loose.` : "Every pane rings. None are loose.");
  },
  liftPane(ctx) {
    const win = requirePlace(ctx, ctx.op.id ?? "window", "UNKNOWN_PANE", "You have not found the loose pane.");
    if (win.foundLoose !== true) fail("UNKNOWN_PANE", "Find the loose pane before the reed will lift it.");
    win.lifted = true;
    done(ctx, "The loose pane lifts a hair. The reed does not open a compartment.");
  },
  sounding(ctx) {
    const water = requirePlace(ctx, ctx.op.id ?? "water", "NO_WATER", "The lead wants water.");
    if (water.water !== true) fail("NO_WATER", "The lead wants water.");
    water.band = String(water.depthBand ?? "arm");
    reading(ctx, "lead", String(water.band));
    done(ctx, `Sounding: ${water.band}.`);
  },
  bottomSample(ctx) {
    if (!ctx.self.mods.includes("tallowed")) fail("NO_TALLOW", "Arm the lead with tallow before it will bring up the bottom.");
    const water = requirePlace(ctx, ctx.op.id ?? "water", "NO_WATER", "No bottom to sample.");
    water.bottom = String(water.bottomTruth ?? "mud");
    done(ctx, `Tallow brings up ${water.bottom}.`);
  },
  muteBell(ctx) {
    const bell = requirePlace(ctx, ctx.op.id ?? "bell", "NO_BELL", "No bell in hand.");
    if (bell.absent === true) fail("NO_BELL", "No bell in hand.");
    bell.muted = true;
    done(ctx, "Strop on the clapper. The bell stays quiet.");
  },
  emitSound(ctx) {
    const bell = requirePlace(ctx, ctx.op.id ?? "bell", "NO_BELL", "No bell to click.");
    if (bell.absent === true) fail("NO_BELL", "No bell to click.");
    const soundId = ctx.op.s ?? "strop-click";
    if (!ctx.world.sounds.some((s) => s.id === soundId)) {
      ctx.world.sounds.push({ id: soundId, label: "strop click" });
    }
    ctx.world.identifiedSound = soundId;
    done(ctx, "One click. The wax recorder can take it as an environmental sound.");
  },
  drawFlock(ctx) {
    const flock = ofKind(ctx, "flock");
    if (!flock.length) fail("NO_FLOCK", "No flock to draw.");
    for (const e of flock) {
      e.alert = "drawn";
      e.timer = 10;
    }
    done(ctx, "The call draws the flock for ten seconds. Narrow attentions ignore it.");
  },
  gooseCadence(ctx) {
    const want = ctx.op.s ?? "low-high-low";
    const got = argStr(ctx, "sequence", want);
    const p = puzzleOf(ctx, ctx.op.id ?? "geese");
    if (got !== want) {
      for (const e of ofKind(ctx, "flock")) {
        e.alert = "startled";
        e.timer = 4;
      }
      fail("WRONG_CADENCE", `The flock knows ${want}. That call spooked them.`, true);
    }
    p.solved = true;
    p.detail = want;
    done(ctx, "The three-note call is the one they know.");
  },
  calibrateResonator(ctx) {
    const horn = needKit(ctx, ID.resonator, "MISSING_HORN", "The fork calibrates the folding resonator, and it is not in the kit.");
    addMod(horn, "calibrated");
    done(ctx, "Fork touched to the horn. The resonator can match a plate this scene.");
  },
  crackTest(ctx) {
    const cup = requirePlace(ctx, ctx.op.id ?? "cup", "NO_CUP", "No cup to test.");
    if (cup.cracked !== true) fail("RINGS_CLEAR", "The fork rings clear. This cup is whole.");
    cup.damped = true;
    done(ctx, "The fork damps. The cup is cracked.");
  },
  rainTell(ctx) {
    if (ctx.world.weather.wet) fail("HEAD_SAG", "The head is dew-sagged and will not speak.");
    const pitch = ctx.world.weather.rainComing ? "dropped" : "holding";
    put(ctx, "drum", "pitch", pitch);
    if (ctx.world.weather.rainComing && ctx.world.puzzles.weather) {
      ctx.world.puzzles.weather.solved = false;
      ctx.world.puzzles.weather.detail = "drum only";
    }
    done(ctx, pitch === "dropped" ? "Pitch dropped. Rain is in the scene." : "Pitch holds. The drum is not promising rain.");
  },
  storePattern(ctx) {
    const want = ctx.op.s ?? "1-2-4";
    const got = argStr(ctx, "pattern", want);
    const hits = got.split("-").filter(Boolean);
    if (hits.length > 4) fail("TOO_MANY", "The drum remembers four taps, not a song.");
    if (got !== want) fail("WRONG_TAP", `The password is ${want}.`);
    ctx.world.flags.tapPattern = got;
    const p = puzzleOf(ctx, ctx.op.id ?? "taps");
    p.solved = true;
    p.detail = got;
    done(ctx, "Four taps or fewer, stored as a pattern — not as an environmental sound.");
  },
  maskFootfalls(ctx) {
    const yard = requirePlace(ctx, "ground", "TANGLED", "No room to swing the cord.");
    if (Number(yard.clearYards ?? 0) < 3) fail("TANGLED", "The scarer wants three clear yards.");
    const ears = ofKind(ctx, "keen-ear");
    if (!ears.length) fail("NO_EARS", "No keen ear to mask.");
    for (const e of ears) {
      e.alert = "masked";
      e.timer = 6;
    }
    done(ctx, "The roar masks footfalls for six seconds. It is a shepherd's scarer, not a rite.");
  },
  pitchGate(ctx) {
    const want = ctx.op.s ?? "second-knot";
    const got = argStr(ctx, "knot", want);
    if (got !== want) fail("WRONG_KNOT", "The gate is listening for the second knot's pitch.");
    const p = puzzleOf(ctx, ctx.op.id ?? "gate");
    p.solved = true;
    done(ctx, "Cord length matches the gate's pitch.");
  },
  nearSpeech(ctx) {
    const room = requirePlace(ctx, ctx.op.id ?? "room", "OPEN_AIR", "The trumpet wants a plaster room.");
    if (room.plaster !== true) fail("OPEN_AIR", "The trumpet wants a plaster room.");
    room.topic = String(room.topicTruth ?? "the cellar");
    done(ctx, `Through the wall, the topic is “${room.topic}”. Not the whole conversation.`);
  },
  directedHail(ctx) {
    const win = requirePlace(ctx, ctx.op.id ?? "window", "NO_WINDOW", "No window to hail.");
    win.hailed = true;
    ctx.world.flags.yardHeard = false;
    done(ctx, "The reversed horn puts the voice on that window, not in the yard.");
  },
  echoRange(ctx) {
    const surface = requirePlace(ctx, ctx.op.id ?? "surface", "NO_WALL", "Nothing here returns an echo.");
    if (surface.reflect !== true) fail("NO_WALL", "Nothing here returns an echo.");
    surface.distance = Number(surface.truthYd ?? 0);
    reading(ctx, "echo-cup", `${surface.distance} yd`);
    done(ctx, `Echo puts the surface at ${surface.distance} yards.`);
  },
  softWallHint(ctx) {
    const surface = requirePlace(ctx, ctx.op.id ?? "surface", "NO_WALL", "No wall to test.");
    if (surface.soft !== true) fail("HARD_WALL", "The echo comes back hard. Not a hay-soft compartment wall.");
    ctx.world.flags.softHint = true;
    done(ctx, "The echo dies. Something soft is behind the wall. The cup does not reveal a compartment.");
  },
  signalFriend(ctx) {
    const want = ctx.op.s ?? "two-note";
    const got = argStr(ctx, "phrase", want);
    if (got !== want) fail("WRONG_PHRASE", "One note is not the old signal.");
    ctx.world.flags.friendApproaching = true;
    done(ctx, "Both notes. Someone from the first life still answers. No one is conjured — they were already in the county.");
  },
  singleNoteAlert(ctx) {
    const ears = ofKind(ctx, "keen-ear");
    if (!ears.length) fail("NO_EARS", "No keen ear in the lane.");
    for (const e of ears) {
      e.alert = "drawn";
      e.timer = 8;
    }
    ctx.world.flags.friendApproaching = false;
    done(ctx, "A single note draws a keen ear and summons nobody.");
  },
  freezeBurrow(ctx) {
    const rows = ofKind(ctx, "burrow").filter((e) => e.rangeYd <= 3);
    if (!rows.length) fail("NO_BURROW", "Nothing in the wall or the bank is close enough.");
    for (const e of rows) {
      e.alert = "frozen";
      e.timer = 6;
    }
    done(ctx, "The low groan freezes whatever is burrowed nearby.");
  },
  harvestCord(ctx) {
    if (ctx.self.mods.includes("cord-taken")) fail("CORD_TAKEN", "The waxed cord is already out of the drum.");
    addMod(ctx.self, "cord-taken");
    ctx.world.materials.cord = (ctx.world.materials.cord ?? 0) + 1;
    done(ctx, "Waxed cord harvested. The line beetle can use it if its own line is gone.");
  },
  shiftBalance(ctx) {
    const b = balOf(ctx, ctx.op.id ?? "balance");
    if (b.overhead && !b.hanger) fail("NEEDS_HANGER", "Overhead work needs the jack chain as a hanger.");
    const add = argNum(ctx, "ounces", ctx.self.massOz || (ctx.op.n ?? 0));
    if (add < 2 || add > 24) fail("MASS_RANGE", "The pocket counterweight offsets 2 to 24 ounces, in steps of 2.");
    if (add % 2 !== 0) fail("MASS_RANGE", "Set the mass in steps of 2 ounces.");
    const next = b.currentOz + add;
    if (Math.abs(next - b.targetOz) > b.tolerance) {
      fail("SHORT_OF_BALANCE", `Hanging ${add} oz leaves the balance at ${next}, target ${b.targetOz}.`);
    }
    b.currentOz = next;
    b.held = true;
    done(ctx, `Counterweight seated at ${add} oz. The balance holds.`);
  },
  verifyMerchant(ctx) {
    needKit(ctx, ID.pennies, "NO_REFERENCE", "Without the penny set you will not accuse a weight.");
    const m = ctx.world.merchant;
    const off = Math.abs(m.actualOz - m.markedOz);
    if (off <= 0.25) fail("HONEST_WEIGHT", "The merchant's weight matches within a quarter ounce.");
    m.shortFlagged = true;
    done(ctx, `Short by ${off} oz against the penny set.`);
  },
  repairPulley(ctx) {
    const win = requirePlace(ctx, ctx.op.id ?? "window", "NO_WINDOW", "No window is missing its sheave.");
    if (win.missing === true) fail("NO_WINDOW", "No window is missing its sheave.");
    win.runs = true;
    done(ctx, "Sheave seated. The sash weight runs again.");
  },
  gaugeCord(ctx) {
    const cord = requirePlace(ctx, ctx.op.id ?? "cord", "NO_CORD", "No cord in the groove.");
    cord.diameter = String(cord.truth ?? "3/8");
    reading(ctx, "sheave", String(cord.diameter));
    done(ctx, `Cord gauges ${cord.diameter}.`);
  },
  dogShutter(ctx) {
    const shutter = requirePlace(ctx, ctx.op.id ?? "shutter", "NO_SHUTTER", "No shutter.");
    if (shutter.period !== true) fail("MODERN_PINTLE", "The dog only fits a period pintle.");
    shutter.dogged = true;
    done(ctx, "Shutter dogged open against the wind.");
  },
  dogDoor(ctx) {
    const door = requirePlace(ctx, ctx.op.id ?? "door", "NO_DOOR", "No door.");
    door.gapInches = 4;
    door.entry = false;
    done(ctx, "Door dogged a hand's width. Enough for a voice or a lamp stripe, not for entry.");
  },
  silenceCreak(ctx) {
    const room = bag(ctx, ctx.op.id ?? "room");
    room.creak = false;
    for (const e of ofKind(ctx, "keen-ear")) {
      if (e.alert === "drawn") e.alert = "idle";
    }
    done(ctx, "Bed bolts tight. The room stops announcing your steps.");
  },
  unlatchRevealed(ctx) {
    const c = compOf(ctx, ctx.op.id ?? "hide");
    if (!c.revealed) fail("STILL_HIDDEN", "The wrench opens a compartment only after the resonator has located it.");
    c.unlatched = true;
    done(ctx, "Bolt drawn. The located compartment is open.");
  },
  windTarget(ctx) {
    const target = needKit(ctx, ctx.op.id ?? ID.bird, "NO_CLOCK", "No clockwork in the kit takes this key.");
    if (target.winds >= (ctx.op.n2 ?? 3)) fail("FULL_BARREL", "That barrel is already at three winds.");
    target.winds += ctx.op.n ?? 1;
    done(ctx, `Keyed one grade. Winds now ${target.winds}.`);
  },
  riskyDrive(ctx) {
    const bolt = requirePlace(ctx, ctx.op.id ?? "bolt", "NOT_A_BED", "This is not a bed bolt.");
    if (bolt.kind !== "bed") fail("NOT_A_BED", "The largest key square is only a risky stand-in for a bed bolt.");
    const wrench = kitOf(ctx, ID.wrench);
    bolt.open = true;
    bolt.rounded = !wrench;
    done(ctx, wrench
      ? "The bed-bolt wrench is here. Use that — the key was not needed, and the square is unhurt."
      : "The key turned the bed bolt and rounded the square. It will be worse next time.");
  },
  markPegs(ctx) {
    const n = ctx.op.n ?? 6;
    put(ctx, "pegs", "count", n);
    ctx.world.flags.pegsMarked = true;
    done(ctx, `${n} pegs marked to one length.`);
  },
  checkStraight(ctx) {
    const edge = requirePlace(ctx, ctx.op.id ?? "edge", "NO_EDGE", "No edge to ride.");
    if (edge.gone === true) fail("NO_EDGE", "No edge to ride.");
    edge.straight = edge.truth !== false;
    done(ctx, edge.straight ? "The fence says this edge is straight." : "The fence says this edge wanders.");
  },
  turnbuckle(ctx) {
    const wire = bag(ctx, ctx.op.id ?? "wire");
    const next = Number(wire.takeInches ?? 0) + (ctx.op.n ?? 0);
    if (next < -4 || next > 4) fail("STRIPPED", "Four inches of take-up, no more.");
    wire.takeInches = next;
    done(ctx, next >= 0 ? `Wire shortened. Take-up ${next} in.` : `Wire eased. Take-up ${next} in.`);
  },
  pinClevis(ctx) {
    put(ctx, ctx.op.id ?? "gate", "pinned", true);
    done(ctx, "Cotter in. The tailgate stays up.");
  },
  hingePinStandIn(ctx) {
    const horn = needKit(ctx, ID.resonator, "MISSING_HORN", "The cotter stands in for the resonator's hinge pin, which is not here.");
    addMod(horn, "pin-replaced");
    done(ctx, "Cotter seated as a hinge pin. The horn will fold again.");
  },
  stopCellarWet(ctx) {
    const spout = bag(ctx, "spout");
    if (spout.done === true) fail("ALREADY_SPOUTED", "One spout is already spiked.");
    spout.done = true;
    put(ctx, ctx.op.id ?? "cellar", "wet", false);
    done(ctx, "Downspout anchored. The cellar stops taking this water.");
  },
  crimpCord(ctx) {
    put(ctx, ctx.op.id ?? "cord", "crimped", true);
    done(ctx, "Ferrule crimped. The cord end will not unravel.");
  },
  swingClear(ctx) {
    const door = requirePlace(ctx, ctx.op.id ?? "door", "NO_DOOR", "No door for the parliament hinge.");
    if (door.gone === true) fail("NO_DOOR", "No door for the parliament hinge.");
    door.flat = true;
    door.edgeRevealed = true;
    done(ctx, "The door opens flat. A painted edge shows. It is not a compartment.");
  },
  clampAid(ctx) {
    ctx.world.flags.clampReady = true;
    done(ctx, "The two plates and the pin will clamp a cracked case on the bench.");
  },
  boreWood(ctx) {
    const board = requirePlace(ctx, ctx.op.id ?? "board", "NO_BOARD", "Nothing to bore.");
    if (board.metal === true) fail("NOT_WOOD", "The gimlet is not a lockpick and will not bore metal.");
    board.pilot = true;
    ctx.world.flags.holeVisible = true;
    done(ctx, "Eighth-inch pilot. The hole is visible to anyone who looks.");
  },
  listeningHole(ctx) {
    const board = requirePlace(ctx, ctx.op.id ?? "board", "NO_PILOT", "Bore the pilot before it will pass a voice.");
    if (board.pilot !== true) fail("NO_PILOT", "Bore the pilot before it will pass a voice.");
    ctx.world.flags.listenReady = true;
    done(ctx, "The pilot will take the ear trumpet. You have also left a hole.");
  },
  fitCatch(ctx) {
    put(ctx, ctx.op.id ?? "door", "caught", true);
    done(ctx, "Turn-catch fitted. The door can hold against a counterweight's pull.");
  },
  sealTin(ctx) {
    const wax = needKit(ctx, ID.recorder, "NO_TIN", "The catch seals the wax recorder's tin, and the recorder is not in the kit.");
    wax.sealed = true;
    wax.stored = "tin";
    done(ctx, "Tin shut. The cylinder takes no dust, and damp does not reach it.");
  },
  hideKeyhole(ctx) {
    put(ctx, ctx.op.id ?? "lock", "hidden", true);
    done(ctx, "Escutcheon over the keyhole. The pawl bit is not hidden from the lock, only from the hall.");
  },
  weakGlance(ctx) {
    const door = requirePlace(ctx, ctx.op.id ?? "door", "NO_DOOR", "No edge to glance.");
    if (door.gone === true) fail("NO_DOOR", "No edge to glance.");
    door.edgeSeen = true;
    door.glance = "dull";
    door.prints = false;
    done(ctx, "A dull brass glance. No dew-trace, even at dawn.");
  },
  chainDoor(ctx) {
    put(ctx, ctx.op.id ?? "door", "travelInches", 4);
    done(ctx, "Jack chain on. The door travels four inches.");
  },
  attachHanger(ctx) {
    const b = balOf(ctx, ctx.op.id ?? "balance");
    b.hanger = true;
    done(ctx, "Chain hung. The pocket counterweight can clip overhead.");
  },
  exposeLightWeight(ctx) {
    if (ctx.world.flags.markedShort === true) fail("ALREADY_MARKED", "You already marked the light penny. Passing it as honest would be the grocer's trick.");
    put(ctx, "penny", "lightOz", 0.4);
    ctx.world.flags.markedShort = true;
    done(ctx, "One weight in the set is four tenths light. Marked, so it cannot fool you.");
  },
  clerkRead(ctx) {
    ctx.world.merchant.ledgerRead = true;
    ctx.world.flags.clerkPose = true;
    done(ctx, "The set in the window lets you pass as a clerk long enough to read the ledger.");
  },
  feltClock(ctx) {
    put(ctx, ctx.op.id ?? "clock", "walks", false);
    done(ctx, "Felt under the feet. The clock stays where you set it.");
  },
  padResonator(ctx) {
    const horn = needKit(ctx, ID.resonator, "MISSING_HORN", "The pads go under the resonator.");
    addMod(horn, "padded");
    done(ctx, "Pads on. A rhythm-class listener will not wake when you sweep.");
  },
  chainMeasure(ctx) {
    if (ctx.world.flags.lineLevel !== true) fail("UNLEVELED", "The half-chain lies unless a hand level or a clinometer has declared the line level.");
    if (ctx.world.flags.tallyLie === true) fail("TALLY_LIE", "A tally mark is missing. The chain will not pretend.");
    const yards = ctx.op.n ?? 33;
    put(ctx, "line", "yards", yards);
    reading(ctx, "half-chain", `${yards} ft`);
    done(ctx, `Level line: ${yards} feet. A half-chain, not a guess.`);
  },
  balkFlock(ctx) {
    const flock = ofKind(ctx, "flock");
    if (!flock.length) fail("NO_FLOCK", "No flock is crossing.");
    for (const e of flock) {
      e.alert = "balked";
      e.timer = 8;
    }
    done(ctx, "Chain at knee height. The flock balks. Nothing is snared.");
  },
  drawRay(ctx) {
    const board = requirePlace(ctx, "board", "NO_BOARD", "The alidade wants a board, or the back of a card.");
    if (board.present !== true) fail("NO_BOARD", "The alidade wants a board, or the back of a card.");
    board.ray = true;
    reading(ctx, "alidade", "ray");
    done(ctx, "A ray is on the board. Two rays would fix the point.");
  },
  ruleSketch(ctx) {
    if (ctx.world.flags.sketchReady !== true && ctx.world.places.sketch?.ready !== true) {
      fail("NO_SKETCH", "Nothing is traced for the edge to rule.");
    }
    ctx.world.flags.sketchRuled = true;
    done(ctx, "The alidade's edge rules the lucida sketch.");
  },
  soilCore(ctx) {
    const n = Number(ctx.world.flags.boreCount ?? 0);
    if (n >= 3) fail("AUGER_FULL", "Empty the auger. Three cores is the tube.");
    const hole = bag(ctx, ctx.op.id ?? "hole");
    hole.soil = String(hole.truth ?? "clay");
    hole.disturbed = hole.wasDug === true;
    ctx.world.flags.boreCount = n + 1;
    reading(ctx, "auger", String(hole.soil));
    done(ctx, hole.disturbed ? `Core is ${hole.soil}, and the soil was dug before.` : `Core is ${hole.soil}.`);
  },
  moistureHint(ctx) {
    const hole = requirePlace(ctx, ctx.op.id ?? "hole", "NO_CORE", "No core to feel.");
    hole.moisture = String(hole.moistureTruth ?? "damp");
    ctx.world.flags.soilDamp = hole.moisture === "wet";
    done(ctx, `The core feels ${hole.moisture}.`);
  },
  readSlope(ctx) {
    const line = requirePlace(ctx, ctx.op.id ?? "line", "NO_LINE", "No line to slope.");
    line.degrees = Number(line.truthDeg ?? 0);
    ctx.world.flags.slopeKnown = true;
    reading(ctx, "clinometer", `${line.degrees}°`);
    done(ctx, `Slope ${line.degrees} degrees.`);
  },
  bobStandIn(ctx) {
    if (kitOf(ctx, ID.weight)) fail("HAVE_THE_WEIGHT", "The traveler's counterweight is in the kit. Use that, not the eight-ounce bob.");
    const b = balOf(ctx, ctx.op.id ?? "balance");
    if (b.overhead && !b.hanger) fail("NEEDS_HANGER", "Even the bob needs the jack chain overhead.");
    const next = b.currentOz + 8;
    if (Math.abs(next - b.targetOz) > b.tolerance) fail("SHORT_OF_BALANCE", "Eight ounces is all the bob can lend, and it does not meet the target.");
    b.currentOz = next;
    b.held = true;
    done(ctx, "Clinometer bob hung at a fixed eight ounces.");
  },
  bearing(ctx) {
    const iron = ctx.world.kit.some((k) => k.stored === "pocket" && IRON_IDS.has(k.lootId) && k.lootId !== ctx.self.lootId);
    if (iron) fail("IRON_DEVIATION", "Iron in the same pocket pulls the dry compass. Move it to belt or pack.");
    const mark = requirePlace(ctx, ctx.op.id ?? "mark", "NO_MARK", "No landmark to take.");
    const value = String(mark.truth ?? "NE");
    mark.bearing = value;
    reading(ctx, "dry-compass", value);
    done(ctx, `Bearing ${value}.`);
  },
  magneticFetch(ctx) {
    const crack = requirePlace(ctx, ctx.op.id ?? "crack", "NO_PIN", "No pin in the crack.");
    if (crack.pin !== true) fail("NO_PIN", "The needle finds nothing ferrous in the crack.");
    crack.pinRetrieved = true;
    done(ctx, "The needle lifts a cotter pin out of the crack.");
  },
  confirmPressure(ctx) {
    const drumAgrees = ctx.world.places.drum?.pitch === "dropped";
    if (ctx.world.weather.pressure !== "falling" || !drumAgrees) {
      fail("ONE_INSTRUMENT", "One instrument is a rumor. The aneroid and the rain drum must agree.");
    }
    const p = puzzleOf(ctx, ctx.op.id ?? "weather");
    p.solved = true;
    p.detail = "rain confirmed";
    done(ctx, "Pressure falling, drum dropped. Rain is a fact for this scene.");
  },
  sacrificeGlass(ctx) {
    if (ctx.self.mods.includes("glass-spent")) fail("ALREADY_STRIPPED", "The capsule's glass is already gone.");
    ctx.self.condition = 0;
    addMod(ctx.self, "glass-spent");
    ctx.world.materials.glassChip = (ctx.world.materials.glassChip ?? 0) + 1;
    done(ctx, "Dial glass given up as a spare for the smoke lens. The aneroid is done.");
  },
  tempBand(ctx) {
    const t = ctx.world.weather.tempF;
    const low = ctx.op.n ?? 55;
    const high = ctx.op.n2 ?? 70;
    const p = puzzleOf(ctx, ctx.op.id ?? "cider");
    if (t < low || t > high) fail("WAIT", `${t}°F is outside ${low}–${high}. Move the crock or wait.`);
    p.solved = true;
    p.detail = `${t}°F`;
    done(ctx, `${t}°F is in the yeasting band.`);
  },
  heatCheck(ctx) {
    const journal = requirePlace(ctx, ctx.op.id ?? "journal", "NO_JOURNAL", "No bearing journal to feel.");
    if (journal.missing === true) fail("NO_JOURNAL", "No bearing journal to feel.");
    const hot = journal.hot === true;
    ctx.world.flags.stopWind = hot;
    done(ctx, hot ? "The journal is hot. Stop before the third wind." : "The journal is cool enough to wind.");
  },
  boilElevation(ctx) {
    const water = ctx.world.materials.water ?? 0;
    if (water < 1) fail("NO_WATER", "The cup wants a spoon of water.");
    const heat = ctx.world.flags.flame === true || ctx.world.flags.ember === true || ctx.world.lamps.some((l) => l.lit && APPROVED_LAMPS.includes(l.kind));
    if (!heat) fail("NO_HEAT", "Boil it on an approved lamp or an ember from the reading lens. A cold cup does not read a hill.");
    ctx.world.materials.water = water - 1;
    const hill = requirePlace(ctx, "hill", "NO_HILL", "No hill is in question.");
    hill.name = String(hill.truth ?? "snake");
    reading(ctx, "hypsometer", String(hill.name));
    done(ctx, `Boiling point names ${hill.name}.`);
  },
  enableRecast(ctx) {
    ctx.world.flags.waxRecastReady = true;
    done(ctx, "The cup is clean enough to recast a wax blank. The recorder's restore can use it.");
  },
  treeGirth(ctx) {
    const tree = requirePlace(ctx, ctx.op.id ?? "tree", "NO_TREE", "No trunk in the jaws.");
    if (tree.gone === true) fail("NO_TREE", "No trunk in the jaws.");
    tree.inches = Number(tree.truthIn ?? 0);
    const old = Number(tree.oldIn ?? tree.inches);
    tree.delta = Math.round((Number(tree.inches) - old) * 10) / 10;
    reading(ctx, "calipers", `${tree.inches} in`);
    done(ctx, `Girth ${tree.inches} in. Change since the first life: ${tree.delta} in.`);
  },
  clampGlue(ctx) {
    ctx.world.flags.glueClamped = true;
    done(ctx, "Jaws clamped. Glue on a cracked case can set.");
  },
  ringCount(ctx) {
    const taken = Number(ctx.world.flags.coresTaken ?? 0);
    if (taken >= 1) fail("ONE_CORE", "One core a scene. Do not riddle the tree.");
    const tree = requirePlace(ctx, ctx.op.id ?? "tree", "NO_TREE", "No trunk to bore.");
    tree.rings = Number(tree.truthRings ?? 0);
    tree.olderThanReturn = Number(tree.rings) >= 14;
    ctx.world.flags.coresTaken = 1;
    const p = puzzleOf(ctx, "rings");
    p.solved = true;
    p.detail = `${tree.rings} rings`;
    reading(ctx, "borer", `${tree.rings} rings`);
    done(ctx, `${tree.rings} rings. ${tree.olderThanReturn ? "Older than the fourteen-year return." : "Younger than the return."}`);
  },
  siphonOil(ctx) {
    if (ctx.self.mods.includes("siphoned")) fail("DRY_BIT", "The bit already gave up its thimble of oil.");
    addMod(ctx.self, "siphoned");
    const n = ctx.op.n ?? 1;
    ctx.world.materials.clockOil = (ctx.world.materials.clockOil ?? 0) + n;
    done(ctx, "A thimble of clock oil, siphoned. Enough for one restore.");
  },
  declareLevel(ctx) {
    ctx.world.flags.lineLevel = true;
    put(ctx, "line", "level", true);
    reading(ctx, "hand-level", "level");
    done(ctx, "The hand level says this line is horizontal. Chain and reel can be honest.");
  },
  halfGlance(ctx) {
    const door = requirePlace(ctx, ctx.op.id ?? "door", "NO_DOOR", "No edge in the vial's mirror.");
    if (door.missing === true) fail("NO_DOOR", "No edge in the vial's mirror.");
    door.edgeSeen = true;
    door.glance = "half";
    done(ctx, "Half-range glance off the Locke mirror. Weaker than the dew mirror.");
  },
  jotNote(ctx) {
    const used = Number(ctx.world.flags.pagesUsed ?? 0);
    if (used >= 16) fail("BOOK_FULL", "Sixteen pages. The book is full.");
    if (ctx.world.weather.wet && !ctx.self.sealed) fail("WET_PAGE", "Wet paper locks. Dry it or case it before you write.");
    const text = argStr(ctx, "text", ctx.op.s ?? "noted");
    ctx.world.notes.push(text);
    ctx.world.flags.pagesUsed = used + 1;
    ctx.world.flags.lastNote = text;
    done(ctx, `Noted: ${text}`);
  },
  graphiteMark(ctx) {
    const piece = requirePlace(ctx, ctx.op.id ?? "piece", "NO_PIECE", "No hallmark to dust.");
    piece.faintSeen = true;
    ctx.world.flags.graphite = true;
    done(ctx, "Graphite finds the worn mark the loupe alone missed.");
  },
  probeSack(ctx) {
    const sack = requirePlace(ctx, ctx.op.id ?? "sack", "NOT_YOURS", "The probe does not pierce a sack you have not been allowed to open.");
    if (sack.open !== true) fail("NOT_YOURS", "The probe does not pierce a sack you have not been allowed to open.");
    sack.bottom = String(sack.bottomTruth ?? "oats");
    done(ctx, `Under the show layer: ${sack.bottom}. The top said ${String(sack.show ?? "wheat")}.`);
  },
  notchDepth(ctx) {
    const inches = ctx.op.n ?? 1;
    put(ctx, "gauge", "inches", inches);
    done(ctx, `Depth notch set at ${inches} in for the peg gauge.`);
  },
  sugarRead(ctx) {
    const cider = requirePlace(ctx, ctx.op.id ?? "cider", "NO_CIDER", "No cider on the plate.");
    const brix = Number(cider.truthBrix ?? 0);
    cider.brix = brix;
    cider.ready = brix >= 12;
    const p = puzzleOf(ctx, "press");
    if (cider.ready === true) p.solved = true;
    else p.detail = "not ready";
    reading(ctx, "refractometer", `${brix} brix`);
    done(ctx, cider.ready ? `${brix} brix. The press is ready.` : `${brix} brix. Not ready.`);
  },
  diffusePrism(ctx) {
    needKit(ctx, ID.prism, "NO_PRISM", "The diffuser rides the hand prism, and the prism is not in the kit.");
    const lamp = lampOf(ctx, ctx.op.id ?? "lamp");
    if (lamp.mode !== "spectrum-stripe") fail("NOT_MOUNTED", "Mount the prism in spectrum-stripe before the plate will soften it.");
    lamp.mode = "diffused-stripe";
    done(ctx, "Daylight plate over the stripe. Spectrum-ink can be read without standing in the hard beam.");
  },
  flagPin(ctx) {
    const n = Number(ctx.world.flags.pinCount ?? 0);
    if (n >= 4) fail("OUT_OF_PINS", "Four pins. That is the bundle.");
    put(ctx, ctx.op.id ?? "point", "pinned", true);
    ctx.world.flags.pinCount = n + 1;
    done(ctx, "Pin set. The point stays when you leave the scene.");
  },
  splint(ctx) {
    if (ctx.world.weather.wet) fail("TAPE_SLIP", "Wet flagging will not hold a split handle.");
    const targetId = ctx.op.id ?? ID.calipers;
    const target = needKit(ctx, targetId, "MISSING_HANDLE", "No split handle in the kit to bind.");
    addMod(target, "splinted");
    ctx.world.flags.splintOneScene = true;
    done(ctx, "Flagging binds the split for this scene only.");
  },
  changedPlace(ctx) {
    const site = requirePlace(ctx, ctx.op.id ?? "site", "NO_PAGE", "This page has no old reading to disagree with.");
    site.changed = site.truthChanged === true;
    reading(ctx, "offset-book", String(site.delta ?? "changed"));
    done(ctx, site.changed
      ? `The old reading and the ground disagree: ${String(site.delta ?? "changed")}. The past line is not corrected.`
      : "The old reading still matches.");
  },
  armAutoLog(ctx) {
    ctx.world.flags.autoLog = true;
    ctx.world.flags.bookDisplayed = true;
    done(ctx, "The offset book is on the shelf. Field readings this scene write themselves in.");
  },
};

export const IMPLEMENTED_OPS: ReadonlySet<string> = new Set(Object.keys(impl));

export function applyOp(ctx: FxCtx): void {
  const fn = impl[ctx.op.op];
  if (!fn) fail("UNKNOWN_OP", `No handler for ${ctx.op.op}.`);
  fn(ctx);
}
