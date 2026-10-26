import type { Handler } from "../effect-types.ts";
import { relicId } from "../ids.ts";
import { carried, isResult, nightLocked, no, ok, take } from "./util.ts";

const HYMN = relicId(21);
const LEDGER = relicId(8);
const COAT = relicId(4);

export const midHandlers: Record<string, Handler> = {
  "pencil-stub"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("pencil-gone", "The stub is used up.");
    if (ctx.intent.kind !== "redraw") return no("intent-refused", "The pencil only redraws a survey note that is allowed to return.");
    const bound = ctx.world.boundaries.find((entry) => entry.id === ctx.intent.targetId);
    if (!bound) return no("no-target", "There is no such mark.");
    if (bound.class !== "survey-mark") return no("class-refused", "The pencil will not redraw a campaign gate or a region border.");
    if (ctx.world.flags[`inked.${bound.id}`] === true) return no("ink-holds", "Ink is holding that erasure. Graphite cannot argue with it yet.");
    if (bound.readable && bound.notch === bound.originNotch) return no("already-true", "That line is already where Calder left it.");
    bound.readable = true;
    bound.notch = bound.originNotch;
    const uses = (typeof inst.bound.uses === "number" ? inst.bound.uses : 0) + 1;
    inst.bound.uses = uses;
    if (uses >= 3) inst.state = "spent";
    return ok("noted", `${bound.label} is redrawn. The stub is shorter.`);
  },

  "empty-chair"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "place") return no("intent-refused", "The chair is placed at an authored table.");
    const table = ctx.world.tables.find((entry) => entry.id === ctx.intent.targetId);
    if (!table) return no("no-target", "There is no such table.");
    if (!table.guest) return no("no-guest", "No unrealized person is authored for this table. The chair stays wood.");
    table.seated = true;
    ctx.world.flags["speaker.skipped"] = table.id;
    return ok("seated", `The chair makes a seat for ${table.guest}. A living person at that table loses their next turn to speak.`);
  },

  "missed-quilt"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "sleep") return no("intent-refused", "The quilt only works if he sleeps under it.");
    ctx.world.flags["quilt.warmth"] = 1;
    ctx.world.actor.truthfulWithMaeve = true;
    return ok("warmed", "He banks one warmth against the next authored frost. The dream was Maeve's, and he will not be able to lie to her next.");
  },

  "hesitation-boot"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "step") return no("intent-refused", "The boot only takes the step he once refused.");
    const door = ctx.world.doors.find((entry) => entry.id === ctx.intent.targetId);
    if (!door) return no("no-target", "There is no such threshold.");
    if (door.kind === "campaign-gate") return no("campaign-gate", "The boot will not cross a campaign gate.");
    if (door.kind !== "hesitation") return no("not-hesitation", "This threshold was not authored as the place he stopped.");
    ctx.world.flags[`threshold.crossed.${door.id}`] = true;
    ctx.world.flags["limp"] = true;
    inst.bound.leftBehind = true;
    return ok("stepped", "He crosses the yard gate without firing its old hesitation. The other boot stays behind, and he limps the rest of the scene.");
  },

  "quarry-eye"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "look") return no("intent-refused", "The glass eye only looks at the authored quarry face.");
    if (ctx.world.flags["shrine.insulted"] === true) {
      return no("shrine-insulted", "The shrine is insulted by the false bone. The glass eye shows only dust.");
    }
    const climb = ctx.world.climbs.find((entry) => entry.id === (ctx.intent.targetId ?? "climb.quarry"));
    if (!climb) return no("no-target", "That is not the authored face.");
    climb.revealedHolds = 3;
    ctx.world.flags["depth.fail"] = true;
    return ok("inclusions", "Marble inclusions mark the safe holds on this face. Every other climb loses its depth until the eye is pocketed.");
  },

  "hymn-card"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "dormant") return no("dull", "The card is dull and needs the nave's quiet before it will sing again.");
    if (nightLocked(ctx.world)) return no("night-quiet", "The lullaby has the night. The hymn will not start.");
    if (ctx.intent.kind !== "sing") return no("intent-refused", "The card supplies a verse only while the congregation is already singing.");
    if (ctx.world.flags["congregation.singing"] !== true) {
      return no("no-congregation", "Nobody is singing the authored hymn. The card will not start it.");
    }
    ctx.world.flags["hymn.verse3"] = true;
    ctx.world.actor.recognized += 1;
    ctx.world.flags["recognized.in-nave"] = true;
    return ok("verse", "Ellis supplies the missing third verse. A mourner hears a living voice in a dead man's mouth.", [
      { person: "Preacher", response: "He is grateful and frightened, in that order." },
    ]);
  },

  "name-chip"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("spent", "The chip was only one surname.");
    if (ctx.intent.kind !== "press") return no("intent-refused", "The chip is pressed into a blank, unprotected stone.");
    const grave = ctx.world.graves.find((entry) => entry.id === ctx.intent.targetId);
    if (!grave) return no("no-target", "There is no such stone.");
    if (grave.protected) return no("protected-grave", "The chip will not cut a protected stone.");
    grave.asked = false;
    ctx.world.flags[`${grave.id}.surname`] = "Voss-not-quite";
    ctx.world.flags["stone.letterLost"] = "grave.sealed-neighbor";
    inst.state = "spent";
    return ok("surnamed", `${grave.name} carries a surname for one scene. A living family's nearby letter flakes off until the chip's debt is restored.`);
  },

  "two-kettle"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.world.flags["kettle.blocked"] === true) {
      return no("kettle-blocked", "The split chair has to be repaired before the kettle will call anyone.");
    }
    if (ctx.intent.kind !== "boil") return no("intent-refused", "The kettle is boiled at the Silt Lane hearth.");
    if (ctx.world.sceneId !== "scene.silt" && ctx.intent.extra?.atHearth !== true) {
      return no("not-hearth", "It only boils for two at Silt Lane.");
    }
    const maeve = ctx.world.people.find((entry) => entry.id === "maeve");
    if (!maeve?.present || maeve.closed) {
      ctx.world.flags["rest.lost"] = true;
      ctx.world.actor.fatigue += 1;
      return ok("empty-boil", "The kettle sings to an empty chair. Ellis loses the rest he meant to take.");
    }
    ctx.world.flags["maeve.sat"] = true;
    ctx.world.flags["maeve.witnesses"] = (typeof ctx.world.flags["maeve.witnesses"] === "number" ? ctx.world.flags["maeve.witnesses"] : 0) + 1;
    return ok("second-cup", "A second cup appears in the sound of the kettle. Maeve sits. The spare key's witness-count ticks, because a chair was involved.", [
      { person: "Maeve Voss", response: "She drinks and does not ask where he has been. That is the mercy and the bill." },
    ]);
  },

  "ferry-lantern"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "light") return no("intent-refused", "The lantern is lit in crossing fog.");
    if (ctx.world.flags["stove.cold"] === true) return no("stove-cold", "The ferry stove's last coal is gone. This wick will not catch.");
    const fog = ctx.world.opportunities.find((entry) => entry.id === "env.fog");
    if (!fog?.available) return no("no-fog", "The lantern only burns inside authored crossing fog.");
    const memory = ctx.world.journal.find((entry) => !entry.protected && !entry.forgotten);
    if (memory) memory.forgotten = true;
    else ctx.world.actor.fatigue += 1;
    const shown = (typeof ctx.world.flags["piling.revealed"] === "number" ? ctx.world.flags["piling.revealed"] : 0) + 1;
    ctx.world.flags["piling.revealed"] = shown;
    return ok("piling", `The wick shows piling ${shown} and no further. A daylight memory is the cost.`);
  },

  "missed-glove"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "offer") return no("intent-refused", "The glove is offered to one missed introduction.");
    const who = ctx.world.people.find((entry) => entry.id === ctx.intent.targetId);
    if (!who) return no("no-target", "That person is not authored here.");
    if (who.protectedAccuser) return no("protected-accuser", "The glove will not rewrite a protected accuser.");
    if (ctx.world.flags[`greeted.${who.id}`] === true) return no("already-greeted", "That missed hello has already been spent.");
    ctx.world.flags[`greeted.${who.id}`] = true;
    ctx.world.flags[`grievance.pending.${who.id}`] = true;
    who.resentment += 1;
    return ok("greeted", `${who.name} takes the handshake fourteen years late. The grievance is postponed, not solved, and it will come back heavier.`);
  },

  "junie-whistle"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (nightLocked(ctx.world)) return no("night-quiet", "The lullaby has the air. The whistle stays in the pocket.");
    if (ctx.world.flags["junie.refusesWhistle"] === true) return no("refused", "Junie will not come to the whistle for the rest of the day.");
    if (ctx.intent.kind !== "blow") return no("intent-refused", "The whistle only calls Junie.");
    if (ctx.world.flags["junie.listening"] !== true) {
      return no("not-listening", "Junie is not in the almost-listening state at the meadow. The whistle is only tin.");
    }
    ctx.world.flags["junie.presentAtJar"] = true;
    ctx.world.flags["hart.socialLock"] = true;
    return ok("called", "Junie comes to the jar-site. Her mother hears a child she did not have, and the Hart door stays socially shut for the day.");
  },

  "broken-inch"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "fractured") return no("already-spent", "The inch is already broken off.");
    if (ctx.intent.kind !== "restore-span") return no("intent-refused", "The broken inch only gives one swapped span back.");
    const pair = ctx.world.spatial.find((entry) => entry.id === ctx.intent.targetId);
    if (!pair) return no("no-target", "There is no such span.");
    if (!pair.approved) return no("not-approved", "The inch will not edit a span the Unruler was never allowed to touch.");
    if (!pair.swapped && ctx.world.flags["unruler.debt"] !== true) return no("nothing-owed", "That span is not carrying a measurement debt.");
    if (pair.swapped) {
      const swap = pair.a;
      pair.a = pair.b;
      pair.b = swap;
      pair.swapped = false;
    }
    ctx.world.flags["unruler.debt"] = false;
    inst.state = "fractured";
    return ok("unswapped", `${pair.label} is put back. The inch stays broken.`, undefined, true);
  },

  "oven-stone"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state !== "intact") return no("cracked", "The oven stone has already spent its heat.");
    if (ctx.intent.kind !== "bank") return no("intent-refused", "The stone only lengthens a June that is already loose in the air.");
    const june = ctx.world.opportunities.find((entry) => entry.tag === "last-june");
    if (!june || june.localTicks <= 0) return no("no-june", "There is no released Last June to lengthen. The stone will not create one.");
    june.localTicks += 1;
    inst.state = "spent";
    return ok("extended", "The oven stone gives the loose June one more beat of heat, and cracks.");
  },

  "coat-button"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "return") return no("intent-refused", "The button is returned to the coat.");
    const coat = ctx.world.placed.find((place) => place.instance.relicId === COAT)?.instance ?? ctx.world.inventory.find((item) => item.relicId === COAT);
    if (!coat) return no("no-coat", "The coat is not anywhere Ellis can reach.");
    if (coat.state !== "fractured") return no("not-torn", "The coat is not waiting on its button.");
    coat.state = "mending";
    inst.state = "spent";
    return ok("button-returned", "The button is back on the thread. The coat is mending, and still needs a person from the house to acknowledge it.");
  },

  "scraped-portrait"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "turn-wall") {
      ctx.world.flags["reflection.missing"] = false;
      ctx.world.locks = ctx.world.locks.filter((lock) => lock.group !== "face" || lock.ownerId !== ctx.relic.id);
      return ok("turned", "Face to the wall, the portrait gives Ellis his reflection back.");
    }
    if (ctx.intent.kind !== "hang") return no("intent-refused", "The portrait is hung or turned to the wall.");
    ctx.world.flags["reflection.missing"] = true;
    ctx.world.flags["portrait.name"] = "Ellis Voss, said by someone who scraped it off";
    return ok(
      "face-scraped",
      "Hung in the hall, the scraped portrait makes a relative say the name. Ellis's own reflection is missing until it is turned.",
      [{ person: "Maeve Voss", response: "She says the scraped name once and then will not look at the frame." }],
      true,
      99,
    );
  },

  "burned-keys"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "enter") return no("intent-refused", "These keys only enter houses that have already burned.");
    const door = ctx.world.doors.find((entry) => entry.id === ctx.intent.targetId);
    if (!door) return no("no-target", "There is no such ruin.");
    if (door.kind !== "burned-memory") return no("still-standing", "The keyring will not open a house that is still standing.");
    ctx.world.flags["smoke.cling"] = true;
    ctx.world.flags[`memory.entered.${door.id}`] = true;
    return ok("memory-entered", `${door.label} plays its interior. Ellis cannot bring any object out. Smoke clings for the next outdoor meeting.`);
  },

  "vein-thread"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "tie") return no("intent-refused", "The thread ties two authored kin-objects.");
    const from = String(ctx.intent.extra?.from ?? "");
    const to = String(ctx.intent.extra?.to ?? "");
    if (!from || !to) return no("needs-pair", "Name both ends.");
    const protectedEnd = ctx.world.objects.find((entry) => (entry.id === from || entry.id === to) && entry.protected);
    if (protectedEnd) return no("protected-object", "The thread will not tie a protected quest object.");
    const id = `link.${from}.${to}`;
    ctx.world.links.push({ id, from, to, cut: false });
    ctx.world.flags["thread.stumble"] = true;
    inst.bound.lastLink = id;
    return ok("threaded", "The red thread hums between the two things. In the next chase, it will catch Ellis's ankle once.");
  },

  "death-clock"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "wind") return no("intent-refused", "The clock is wound against one unprotected timer.");
    const timer = ctx.world.timers.find((entry) => entry.id === ctx.intent.targetId);
    if (!timer) return no("no-target", "There is no such timer.");
    if (timer.protected) return no("protected-timer", "The clock's hands slide off a protected campaign timer.");
    if (timer.paused) return no("already-paused", "That timer is already held.");
    timer.paused = true;
    ctx.world.actor.fatigue += 2;
    return ok("paused", `${timer.label} holds for a beat. Ellis's own body clock runs double after.`);
  },

  "absent-bread"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("eaten", "The bread has already been left.");
    if (ctx.intent.kind !== "leave") return no("intent-refused", "The bread is left at an empty place.");
    const table = ctx.world.tables.find((entry) => entry.id === ctx.intent.targetId);
    if (!table?.guest) return no("no-guest", "There is no authored absent place at this table.");
    table.crumb = true;
    inst.state = "spent";
    ctx.world.actor.ateOwnRationsBlocked = true;
    ctx.world.flags["crumb.note"] = table.clue;
    return ok("crumb", `By the next visit the unrealized guest has eaten. Left behind: ${table.clue} Ellis cannot eat his own rations this scene.`);
  },

  "wool-clapper"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    const sound = ctx.world.sounds.find((entry) => entry.id === ctx.intent.targetId);
    if (!sound) return no("no-target", "There is no such bell.");
    if (ctx.intent.kind === "unwrap") {
      sound.silenced = false;
      return ok("unwrapped", "Wool off, the public bell can be heard again.");
    }
    if (ctx.intent.kind !== "wrap") return no("intent-refused", "The wool wraps a clapper or comes off it.");
    sound.silenced = true;
    return ok("silenced", `${sound.label} loses its public voice. Only the bell under the bell can still hear what is underneath, and only if that layer was authored.`);
  },

  "survey-ribbon"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "tie") return no("intent-refused", "The ribbon ties to a survey mark so it can be found again.");
    const bound = ctx.world.boundaries.find((entry) => entry.id === ctx.intent.targetId);
    if (!bound) return no("no-target", "There is no such mark.");
    if (bound.class !== "survey-mark") return no("class-refused", "The ribbon will not mark a campaign boundary.");
    bound.marked = true;
    ctx.world.actor.official = true;
    return ok("ribboned", `${bound.label} is flagged with the faded ribbon. Ellis reads as a county man to anyone watching the quarry road.`);
  },

  "other-apron"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "remove") {
      ctx.world.flags["maeve.easy"] = false;
      const door = ctx.world.doors.find((entry) => entry.homesteadId === "silt-lane");
      if (door) door.refused = true;
      ctx.world.flags["maeve.refusing"] = true;
      return ok("apron-off", "The week collapses. Maeve remembers all fourteen years at once, and her remembered door locks him out until the kettle or the quilt is used in kindness.");
    }
    if (ctx.intent.kind !== "wear") return no("intent-refused", "The apron is worn at Silt Lane, or taken off.");
    if (ctx.world.sceneId !== "scene.silt" && ctx.intent.extra?.atHearth !== true) {
      return no("not-silt", "The apron only shortens the years inside Silt Lane.");
    }
    ctx.world.flags["maeve.easy"] = true;
    return ok("week-long", "Maeve speaks as if he had been gone a week. It will cost the whole fourteen years when the apron comes off.", [
      { person: "Maeve Voss", response: "She asks him to fetch the jam, which is a kind of forgiveness with a deadline." },
    ]);
  },

  "dry-oar"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "launch") return no("intent-refused", "The oar sets one remembered current.");
    const water = ctx.world.waters.find((entry) => entry.id === ctx.intent.targetId);
    if (!water) return no("no-target", "There is no such water.");
    if (water.campaign) return no("campaign-water", "The oar will not cross the campaign river gate.");
    ctx.world.flags["skiff.away"] = water.id;
    take(ctx.world, inst, `boat.${water.id}`);
    return ok("skiff-set", `The oar puts a remembered current under the skiff on ${water.label}. Ellis will come back on foot. The oar stays with the boat.`);
  },

  "ungiven-band"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.world.flags["band.too-small"] === true || inst.state === "dormant") {
      return no("too-small", "Fourteen years caught up at the county line. The band does not fit a finger until he comes back younger in the vein's count.");
    }
    if (ctx.intent.kind !== "present") return no("intent-refused", "The band is presented to Ione, not worn as a charm.");
    ctx.world.flags["letter.full"] = ctx.world.flags["letter.burned"] === true ? false : true;
    ctx.world.flags["household.fracture"] = true;
    ctx.world.flags["cannot.sleep.pell"] = true;
    return ok(
      "band-shown",
      ctx.world.flags["letter.full"] === true
        ? "Ione recognizes the band. The unsent letter, if it still exists, will show its last line. Her household cracks, and he cannot sleep there."
        : "Ione recognizes the band. The letter is already ash, so the last line is gone. The household still cracks.",
      [{ person: "Ione Pell", response: "She does not put it on. She also does not give it back." }],
    );
  },

  "milk-teeth"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("rattled", "The matchbox has already been shaken.");
    if (ctx.intent.kind !== "rattle") return no("intent-refused", "The teeth are rattled once, at the Hart porch.");
    if (ctx.intent.targetId === "record.protected") return no("protected-record", "A protected birth record stays shut. The teeth go quiet.");
    ctx.world.flags["sibling.name"] = "Lowen";
    ctx.world.flags["junie.refusesWhistle"] = true;
    inst.state = "spent";
    return ok("sibling-name", "The parents' unused name is Lowen. Junie will not answer the whistle for the rest of the day.");
  },

  "home-margin"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "fold") {
      ctx.world.flags["maps.marginOpen"] = false;
      ctx.world.locks = ctx.world.locks.filter((lock) => lock.group !== "maps" || lock.ownerId !== ctx.relic.id);
      return ok("margin-folded", "The margin is folded. Other maps can be read again.");
    }
    if (ctx.intent.kind !== "unfold") return no("intent-refused", "The margin is unfolded toward home, or folded.");
    if (ctx.world.region !== "marrow-crossing") return no("outside-region", "The word Home only points inside Marrow Crossing.");
    ctx.world.actor.lost = false;
    ctx.world.flags["maps.marginOpen"] = true;
    return ok("oriented", "The margin points at Silt Lane and clears his lostness. Every other map relic reads blank while it stays open.", undefined, true, 99);
  },

  "quarry-handbell"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (nightLocked(ctx.world)) return no("night-quiet", "The lullaby is thicker than this little bell.");
    if (ctx.intent.kind !== "ring") return no("intent-refused", "The small bell only rings in the quarry.");
    if (ctx.world.sceneId !== "scene.quarry" && ctx.intent.extra?.inQuarry !== true) {
      return no("not-quarry", "Outside the quarry the small bell is only brass.");
    }
    const climb = ctx.world.climbs.find((entry) => entry.id === "climb.quarry");
    if (climb) {
      climb.revealedHolds = Math.max(climb.revealedHolds, 1);
      climb.blinded = true;
    }
    return ok("hold-called", "The shift-change echo marks one safe hold. The dust wakes, and the next climb check is blind.");
  },

  "corrected-notice"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.world.flags["doc.notice.ruined"] === true) return no("ruined", "The punch went through the notice. The clerk cannot read the correction.");
    if (ctx.intent.kind !== "show") return no("intent-refused", "The notice is shown to the records clerk.");
    if (ctx.intent.targetId === "doc.inquest") return no("protected-paper", "The inquest will not be corrected by a newspaper.");
    ctx.world.flags["papers.deathBlock"] = false;
    ctx.world.flags["ione.bibleNotice"] = true;
    return ok("notice-corrected", "The clerk amends the homestead paper. A second notice appears in Ione's bible, and she will have to see it.", [
      { person: "Ione Pell", response: "She has not seen it yet. She will." },
    ]);
  },

  "crib-blanket"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "place") return no("intent-refused", "The blanket is placed in an unused crib.");
    if (ctx.intent.targetId !== "crib.unused") return no("not-unused", "This relic only answers an authored unused crib.");
    ctx.world.flags["blanket.placed"] = true;
    ctx.world.flags["nightTerror.cancelled"] = true;
    ctx.world.actor.weaponsBlocked = true;
    return ok("terror-stayed", "The night-terror in that house does not come. Ellis dreams the child's unlived morning and cannot raise a weapon until he washes.");
  },

  "chalk-tin"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("empty-tin", "The chalk is gone.");
    if (ctx.intent.kind !== "chalk") return no("intent-refused", "The tin chalks one survey mark back, briefly.");
    const bound = ctx.world.boundaries.find((entry) => entry.id === ctx.intent.targetId);
    if (!bound) return no("no-target", "There is no such mark.");
    if (bound.class !== "survey-mark") return no("class-refused", "Chalk will not redraw a campaign boundary.");
    bound.readable = true;
    ctx.world.flags["chalk.boundary"] = bound.id;
    ctx.world.flags["chalk.untilTick"] = ctx.world.tick + 1;
    inst.state = "spent";
    return ok("chalked", `${bound.label} can be read until the next beat. Then the chalk forgets.`);
  },

  "wake-shoehorn"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "force-wear") return no("intent-refused", "The shoehorn forces the coat on, badly.");
    const coat = ctx.world.inventory.find((item) => item.relicId === COAT);
    if (!coat) return no("no-coat", "The coat has to be in his hands, not already walked home.");
    coat.bound.worn = true;
    coat.bound.improper = true;
    ctx.world.flags["coat.improper"] = true;
    ctx.world.flags["ione.betrayed"] = true;
    ctx.world.actor.mourningVisible = true;
    return ok("improper-worn", "He gets the fractured coat on with the wake's shoehorn. It will not catch a killing blow. Ione, if she learns, will count it as a theft.", [
      { person: "Ione Pell", response: "She has not seen it yet. The vein has already taken her side." },
    ]);
  },

  "hymnal-bookmark"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "combine") return no("intent-refused", "The page only works at the lectern with both books.");
    const hymn = ctx.world.inventory.find((item) => item.relicId === HYMN);
    const ledger = ctx.world.inventory.find((item) => item.relicId === LEDGER);
    if (!hymn || !ledger) return no("missing-pair", "It stays a bookmark until Ellis holds both the hymn card and the birthday ledger.");
    const day = ctx.world.birthdays.find((entry) => entry.id === "bday.ringer");
    if (!day || day.protected) return no("protected-birthday", "That name-day is not theirs to unlock.");
    if (day.spent) return no("already-spent", "The ringer's name-day was already taken.");
    day.spent = true;
    hymn.state = "dormant";
    ledger.state = "dormant";
    ctx.world.flags["ringer.nameday"] = day.gift;
    return ok("nameday", `The lectern gives up the ringer's unlived name-day: ${day.gift} Both books go dull and need restoring.`);
  },
};
