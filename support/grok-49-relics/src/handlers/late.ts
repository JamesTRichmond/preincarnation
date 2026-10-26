import type { Handler } from "../effect-types.ts";
import { relicId } from "../ids.ts";
import { carried, debtBlocksRestore, isResult, nightLocked, no, ok, owns, take } from "./util.ts";

const COAT = relicId(4);
const RING = relicId(6);
const UNRULER = relicId(2);

export const lateHandlers: Record<string, Handler> = {
  "spring-stone"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("sunk", "The stone has already gone into the spring.");
    if (ctx.intent.kind !== "skip") return no("intent-refused", "The stone skips one refill's memory-cost, once.");
    if (ctx.world.flags["at.spring"] !== true && ctx.world.sceneId !== "scene.spring") {
      return no("not-at-spring", "The stone only spends itself at the veinspring.");
    }
    ctx.world.flags["cup.freeRefill"] = true;
    inst.state = "spent";
    return ok("cost-skipped", "The first stone sinks. The next refill of the veinspring cup will not ask for a memory, and the echo may come out crooked.");
  },

  "marble-mirror"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.world.flags["reflection.missing"] === true && ctx.intent.kind === "uncover") {
      return no("no-reflection", "The scraped portrait has taken reflection itself. The mirror cannot show an age.");
    }
    if (ctx.intent.kind === "cover") {
      ctx.world.flags["mirror.uncovered"] = false;
      ctx.world.actor.ageShown = 29;
      ctx.world.locks = ctx.world.locks.filter((lock) => lock.group !== "face" || lock.ownerId !== ctx.relic.id);
      return ok("covered", "Covered, the mirror stops telling the room he is forty-three.");
    }
    if (ctx.intent.kind !== "uncover") return no("intent-refused", "The mirror is uncovered or covered.");
    ctx.world.flags["mirror.uncovered"] = true;
    ctx.world.actor.ageShown = 43;
    ctx.world.actor.recognized += 1;
    return ok("aged", "The marble backing shows the age he would be if the fourteen years had stayed in him. Anyone looking with him updates their recognition.", undefined, true, 99);
  },

  "unspoken-grace"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "pray") return no("intent-refused", "The grace is said at a table with an empty place.");
    const table = ctx.world.tables.find((entry) => entry.id === ctx.intent.targetId);
    if (!table?.guest) return no("no-guest", "There is no empty place here to pray over.");
    if (!ctx.world.actor.foreignHunger) return no("not-hungry", "He is not carrying anyone else's hunger.");
    ctx.world.actor.foreignHunger = false;
    ctx.world.flags["clue.shortened"] = table.id;
    table.clue = table.clue.split(" ").slice(0, 4).join(" ");
    return ok("grace", "The foreign hunger leaves. The guest's clue is shorter than it would have been.");
  },

  "quarrel-nail"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "freeze") return no("intent-refused", "The nail freezes one survey mark against the ring.");
    const bound = ctx.world.boundaries.find((entry) => entry.id === ctx.intent.targetId);
    if (!bound) return no("no-target", "There is no such mark.");
    if (bound.class !== "survey-mark") return no("class-refused", "Campaign boundaries are not survey marks, and the nail will not pretend.");
    bound.frozen = true;
    ctx.world.flags["lineage.looking"] = true;
    return ok("frozen", `${bound.label} will not shift. The hammering brings a neighbor to the fence.`);
  },

  "ticket-punch"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "punch") return no("intent-refused", "The punch only validates the tomorrow-ticket.");
    if (ctx.intent.targetId !== "loot.relic.015" && ctx.intent.targetId !== "ticket") {
      if (ctx.intent.targetId === "doc.notice") {
        ctx.world.flags["doc.notice.ruined"] = true;
        const notice = ctx.world.documents.find((entry) => entry.id === "doc.notice");
        if (notice) notice.ruined = true;
        return ok("ruined-paper", "The punch clips the death notice instead of the ticket. Careless, and now the clerk cannot read it.");
      }
      return no("not-the-ticket", "The punch has to be aimed at the ferry ticket. It will happily ruin another paper if you aim it there.");
    }
    if (!owns(ctx.world, relicId(15))) return no("no-ticket", "There is no tomorrow-ticket to punch.");
    ctx.world.flags["ticket.punched"] = true;
    return ok("punched", "The remembered conductor's punch takes. The ticket can board, if the date is honest.");
  },

  "thimble-rain"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("spent", "The thimble has already rained.");
    if (ctx.intent.kind !== "release") return no("intent-refused", "The thimble releases one authored roof-leak.");
    const leak = ctx.world.opportunities.find((entry) => entry.id === "env.leak");
    const insc = ctx.world.inscriptions.find((entry) => entry.id === "insc.attic");
    if (!leak || !insc) return no("no-leak", "There is no authored leak.");
    if (leak.lost || !leak.available) return no("no-leak", "The leak has already been used.");
    leak.available = false;
    leak.lost = true;
    insc.revealed = true;
    inst.state = "spent";
    ctx.world.flags["attic.dry"] = true;
    return ok("leak-revealed", `Rain finds the beam once: “${insc.text}” Then the attic is dry and the letters will fade if they are not copied.`);
  },

  "dog-collar"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "follow") return no("intent-refused", "The collar is followed in the yard, not worn as a charm.");
    const cache = ctx.world.caches.find((entry) => entry.id === "cache.yard");
    if (cache) cache.found = true;
    const maeve = ctx.world.people.find((entry) => entry.id === "maeve");
    if (maeve) maeve.present = false;
    ctx.world.flags["maeve.absent"] = true;
    return ok("cache-found", "The dog's unrealized old age walks him to the oilcloth bundle. Maeve leaves the scene and will not acknowledge anything until tomorrow.", [
      { person: "Maeve Voss", response: "She cannot look at the collar. She goes inside and shuts a real door." },
    ]);
  },

  "half-scissors"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "cut") return no("intent-refused", "The half-scissors cut only a vein-thread.");
    const link = ctx.world.links.find((entry) => entry.id === ctx.intent.targetId && !entry.cut);
    if (!link) return no("no-thread", "There is no uncut vein-thread by that name. They will not cut rope, plot, or a protected ribbon.");
    const protectedEnd = ctx.world.objects.find((entry) => (entry.id === link.from || entry.id === link.to) && entry.protected);
    if (protectedEnd) return no("protected-object", "One end is protected. The blade refuses.");
    link.cut = true;
    return ok("cut", "The thread parts. The other half of the scissors is not in the world, so this cannot become a pair.");
  },

  "unpreached-sermon"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "read") return no("intent-refused", "The sermon is read under a hoarse bell.");
    const sound = ctx.world.sounds.find((entry) => entry.id === "sound.nave");
    if (!sound?.hoarse) return no("bell-healthy", "The upper bell is still itself. The sermon has nothing to cover.");
    const quest = ctx.world.quests.find((entry) => entry.id === "quest.sermon");
    if (quest?.protected) return no("quest-holds", "The preacher's quest is protected. The sermon will not substitute, and Ellis is heard fumbling.");
    ctx.world.flags["sermon.substituted"] = true;
    ctx.world.flags["sermon.publicUnder"] = true;
    if (quest) quest.note = "The preacher doubts the sermon was his.";
    return ok("substituted", "A quiet sermon covers the missing upper bell, so the under-layer can be heard in public. The preacher's unprotected sermon takes a doubt.");
  },

  "calder-level"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "sight") return no("intent-refused", "The level only reads a mark. It does not move one.");
    const bound = ctx.world.boundaries.find((entry) => entry.id === ctx.intent.targetId);
    if (!bound) return no("no-target", "There is no such mark.");
    if (bound.class !== "survey-mark") return no("class-refused", "The level is for pencil marks, not campaign seals.");
    ctx.world.flags[`known.${bound.id}`] = bound.notch;
    ctx.world.actor.fatigue += 1;
    return ok("level-read", `${bound.label} sits at notch ${bound.notch} (origin ${bound.originNotch}). Ellis's eyes will not trust the Unruler until this scene turns.`, undefined, true);
  },

  "chipped-cup"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "place") return no("intent-refused", "The cup is set in front of one living person.");
    const who = ctx.world.people.find((entry) => entry.id === ctx.intent.targetId);
    if (!who?.present) return no("not-here", "They are not at the table.");
    if (who.protectedAccuser || !who.petty) return no("protected-secret", "The chip toward him will not pull a protected secret.");
    who.resentment += 1;
    ctx.world.flags[`petty.${who.id}`] = who.petty;
    return ok("petty-truth", `${who.name} says a small true thing: ${who.petty} They will resent the intimacy.`);
  },

  "pressed-nightshirt"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "sleep") return no("intent-refused", "The nightshirt works only if he sleeps in it at Silt Lane.");
    if (ctx.world.sceneId !== "scene.silt" && ctx.intent.extra?.atSilt !== true) {
      return no("not-silt", "Anywhere else it is only clean cloth.");
    }
    ctx.world.flags["vein.debt"] = false;
    ctx.world.actor.veinDebt = false;
    const fractured =
      ctx.world.inventory.find((item) => item.state === "fractured" && item.relicId !== ctx.relic.id) ??
      ctx.world.placed.find((place) => place.instance.state === "fractured")?.instance;
    const dawn = ctx.world.opportunities.find((entry) => entry.id === "env.dawn");
    if (dawn?.available) {
      dawn.available = false;
      dawn.lost = true;
    }
    if (!fractured) return ok("slept", "He sleeps. Any vein-debt from the handkerchief is paid. No fractured relic was waiting for a hint.");
    const record = ctx.catalog.find((entry) => entry.id === fractured.relicId);
    const step = record?.restoration.steps[0] ?? "No restoration was authored.";
    ctx.world.flags["hint.restoration"] = step;
    ctx.world.flags["hint.for"] = fractured.relicId;
    return ok("hinted", `The pressed nightshirt dreams the next repair for ${record?.name ?? fractured.relicId}: ${step}`);
  },

  "vein-dust"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("spent", "The spare dust is gone.");
    const debt = debtBlocksRestore(ctx.world);
    if (debt) return debt;
    if (ctx.intent.kind !== "sprinkle") return no("intent-refused", "The dust is sprinkled on a fractured relic.");
    const target =
      ctx.world.inventory.find((item) => item.instanceId === ctx.intent.targetId || item.relicId === ctx.intent.targetId) ??
      ctx.world.placed.find((place) => place.instance.instanceId === ctx.intent.targetId || place.instance.relicId === ctx.intent.targetId)?.instance;
    if (!target) return no("no-target", "That relic is not here.");
    if (target.state !== "fractured") return no("not-fractured", "Dust only moves a fractured relic to mending. It does not restore what is whole, and it does not finish a lineage rite.");
    target.state = "mending";
    inst.state = "spent";
    return ok("dusted", "The fracture pales to mending. If the relic still needs a person from its house, dust has not replaced them.");
  },

  "torn-page"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "unspend") return no("intent-refused", "The torn page only tries to unspend one birthday.");
    const day = ctx.world.birthdays.find((entry) => entry.id === ctx.intent.targetId);
    if (!day) return no("no-target", "That day is not real to the page.");
    if (day.protected) return no("protected-birthday", "The page refuses a protected name-day.");
    if (!day.spent) return no("not-spent", "That birthday has not been spent.");
    day.spent = false;
    ctx.world.flags["birthday.lie"] = day.id;
    inst.state = "spent";
    return ok("lie-restored", `${day.who} looks unspent, and the gift-memory is now a lie Ellis will have to correct or be caught in.`);
  },

  "hidden-drawer"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "open") return no("intent-refused", "This key opens one drawer and no door.");
    if (ctx.intent.targetId !== "door.drawer") return no("not-the-drawer", "Maeve hid this key from herself, not from the parish. It does not open doors.");
    const door = ctx.world.doors.find((entry) => entry.id === "door.drawer");
    if (door) door.locked = false;
    ctx.world.flags["maeve.knowsDrawer"] = true;
    ctx.world.flags["drawer.hint"] = "The coat's button was in the oilcloth, or the letter under the tread.";
    return ok("drawer-open", "The drawer opens. Inside is the hint she pretended not to keep. She will know it was opened.", [
      { person: "Maeve Voss", response: "She does not speak. She looks at the drawer's empty lip." },
    ]);
  },

  "wrong-bank-wind"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("spent", "The knot has already been untied.");
    if (ctx.intent.kind !== "release") return no("intent-refused", "The handkerchief releases one gust.");
    const bank = ctx.world.opportunities.find((entry) => entry.id === "env.bank");
    if (bank?.available) {
      bank.available = false;
      bank.lost = true;
    }
    ctx.world.flags["fog.tileCleared"] = true;
    ctx.world.flags["gust.used"] = true;
    inst.state = "spent";
    return ok("gust", "One gust clears a single fog-tile or pushes the skiff without the oar. The far bank's weather is spent.");
  },

  "four-windows"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "show") return no("intent-refused", "The drawing is shown to Maeve.");
    const maeve = ctx.world.people.find((entry) => entry.id === "maeve");
    if (!maeve?.present) return no("not-here", "Maeve has to see it. The drawing does not work on a wall.");
    ctx.world.flags["key.extraHomestead"] = "room.fourth-window";
    ctx.world.flags["window.sticks"] = true;
    return ok("annex-remembered", "Maeve names the room he would have built. The spare key can now open that remembered annex. The real north window sticks until he planes it.", [
      { person: "Maeve Voss", response: "She says the room's name as if it had always been on the tax paper." },
    ]);
  },

  "erasure-ink"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("empty", "The bottle is empty.");
    if (ctx.intent.kind !== "blackout") return no("intent-refused", "The ink blacks out one survey mark for a day.");
    const bound = ctx.world.boundaries.find((entry) => entry.id === ctx.intent.targetId);
    if (!bound) return no("no-target", "There is no such mark.");
    if (bound.class !== "survey-mark") return no("class-refused", "The ink will not drink a campaign line.");
    bound.readable = false;
    ctx.world.flags[`inked.${bound.id}`] = true;
    ctx.world.flags["ink.boundary"] = bound.id;
    ctx.world.flags["ink.returnTick"] = ctx.world.tick + 1;
    inst.state = "spent";
    return ok(
      "inked",
      `${bound.label} is gone for the day, not merely shifted. Calder's pencil cannot put it back while the ink holds.`,
      [{ person: "Calder Voss", response: "Anger, from a man who is not alive to shout." }],
      true,
    );
  },

  "short-rope"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (nightLocked(ctx.world)) return no("night-quiet", "The rope's bell will not climb over the lullaby.");
    if (inst.state === "fractured") return no("snapped", "The rope is snapped. It needs a splice of vein-thread.");
    if (ctx.intent.kind === "splice") {
      const thread = ctx.world.links.find((entry) => !entry.cut);
      if (!thread && ctx.world.flags["thread.spare"] !== true) return no("needs-thread", "Splicing wants the red vein-thread.");
      inst.state = "intact";
      inst.bound.fray = 0;
      return ok("spliced", "The rope is long enough to be short again.");
    }
    if (ctx.intent.kind !== "ring") return no("intent-refused", "The shortened rope rings the nave bell from the yard.");
    const fray = (typeof inst.bound.fray === "number" ? inst.bound.fray : 0) + 1;
    inst.bound.fray = fray;
    if (fray >= 3) inst.state = "fractured";
    ctx.world.flags["yard.heard"] = ctx.world.sounds.find((entry) => entry.id === "sound.nave")?.layer0 ?? "";
    return ok("yard-bell", "From the yard, the public bell speaks once. The under-layer still requires the bell beneath the bell. The rope frays.");
  },

  "stained-recipe"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "cook") return no("intent-refused", "The card is cooked, not read for a blessing.");
    if (ctx.world.sceneId !== "scene.pell" && ctx.intent.extra?.atPell !== true) {
      return no("not-pell", "Ione's card cooks in the Pell kitchen.");
    }
    ctx.world.flags["true-object.silt"] = true;
    ctx.world.actor.fatigue += 1;
    ctx.world.flags["afternoon.spent"] = true;
    return ok("silt-bread", "The loaf is a true lived object from the Silt Lane recipe. It can be offered to restore Maeve's door. The afternoon is gone.");
  },

  "fourteen-watch"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "close") {
      ctx.world.flags["watch.open"] = false;
      ctx.world.flags["true.calendar"] = false;
      return ok("watch-shut", "Shut, his time stalls again. Tomorrow's ticket may no longer match the date.");
    }
    if (ctx.intent.kind !== "open") return no("intent-refused", "The watch opens onto the true date, or shuts.");
    ctx.world.flags["watch.open"] = true;
    ctx.world.flags["true.calendar"] = true;
    ctx.world.actor.fatigue += 1;
    return ok("true-calendar", "The watch shows the present date, all fourteen years included. Ellis feels every one of them in his knees.");
  },

  "unset-splint"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "brace") return no("intent-refused", "The splint braces one rotten homestead hinge.");
    if (ctx.world.inventory.some((item) => item.relicId === COAT && item.bound.worn === true)) {
      return no("coat-on", "He cannot brace a hinge in the coat and keep the arm the splint wants.");
    }
    const door = ctx.world.doors.find((entry) => entry.id === ctx.intent.targetId);
    if (!door || door.kind !== "remembered-homestead") return no("not-homestead", "The splint will not brace a campaign gate.");
    door.braced = true;
    door.locked = false;
    ctx.world.flags["arm.ache"] = true;
    return ok("braced", `${door.label} stays open on its bad hinge. His arm aches, and the coat is a poor companion to this work.`);
  },

  "pressed-june"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("crumbled", "The flower is already dust.");
    if (ctx.intent.kind !== "witness") return no("intent-refused", "The flower is shown to Junie.");
    const junie = ctx.world.people.find((entry) => entry.id === "junie");
    if (!junie?.present) return no("not-here", "Junie has to see it.");
    ctx.world.flags["june.witnessed"] = true;
    const jarHeld = ctx.world.inventory.some((item) => item.relicId === relicId(3)) || ctx.world.flags["june.inJar"] === true;
    if (jarHeld || ctx.world.opportunities.some((entry) => entry.tag === "last-june" && (entry.sealedIn !== "" || entry.localTicks > 0 || !entry.available))) {
      ctx.world.flags["june.stable"] = true;
    } else {
      ctx.world.flags["junie.knows"] = true;
    }
    inst.state = "spent";
    return ok(
      "june-witnessed",
      ctx.world.flags["june.stable"] === true
        ? "Junie witnesses the lost afternoon. If the jar's June is released, it can settle back into the meadow instead of vanishing."
        : "There is no June in the jar. Junie believes him anyway, and cries, and the meadow only gains her knowing.",
    );
  },

  "false-finger"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "confess") {
      if (ctx.world.flags["shrine.insulted"] !== true) return no("nothing-to-confess", "The shrine is not angry.");
      ctx.world.flags["shrine.insulted"] = false;
      return ok("confessed", "Said aloud in the nave, the false bone stops insulting the quarry saint. The glass eye can see again.");
    }
    if (ctx.intent.kind !== "present") return no("intent-refused", "The false finger is presented at the shrine, or confessed later.");
    ctx.world.flags["shrine.insulted"] = true;
    ctx.world.flags["false.relic"] = ctx.relic.id;
    return ok("shrine-insulted", "The shrine knows the bone is a town lie. The glass eye of the quarry saint will not work until Ellis confesses the falsehood.");
  },

  "fox-doorstop"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "wedge") return no("intent-refused", "The fox holds a remembered door that is already open to him.");
    const door = ctx.world.doors.find((entry) => entry.id === ctx.intent.targetId);
    if (!door || door.kind !== "remembered-homestead") return no("not-remembered", "The fox will not hold a campaign gate or a padlock.");
    if (door.refused) return no("refused", "A refusal is not a door the fox can prop. That wants the split chair-leg, once.");
    door.locked = false;
    ctx.world.actor.recognized += 1;
    ctx.world.flags["cousin.told"] = true;
    return ok("wedged", `${door.label} stays open without another witness-count on the spare key. Cousin Ruthe recognizes the carving and tells the town Ellis is back.`);
  },

  "unfinished-lullaby"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "hum") return no("intent-refused", "The lullaby is hummed at the unused crib.");
    if (ctx.intent.targetId !== "crib.unused") return no("not-crib", "It only belongs to the unused crib.");
    ctx.world.flags["sound.nightLock"] = true;
    ctx.world.flags["sound.nightUntilTick"] = ctx.world.tick + 4;
    if (ctx.world.flags["blanket.placed"] === true) {
      ctx.world.flags["nightTerror.nextNight"] = true;
      return ok("lullaby", "With the blanket already there, the terror stays cancelled tomorrow night as well. No other sound relic will speak until the lullaby thins.", undefined, true, 4);
    }
    ctx.world.flags["house.quiet"] = true;
    return ok("lullaby", "The house goes quiet. Without the blanket, that is all: no terror is cancelled. Other night-sounds stay locked a while.", undefined, true, 4);
  },

  "coffin-invoice"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "show") return no("intent-refused", "The invoice is shown to the undertaker.");
    ctx.world.flags["coldroom.entry"] = true;
    ctx.world.flags["undertaker.billed"] = true;
    const door = ctx.world.doors.find((entry) => entry.id === "door.undertaker");
    if (door) door.locked = true;
    return ok("cold-room", "The undertaker lets him into the cold room where the coat first arrived. He is billed. Until the bill is a chore he finishes, that mundane door will not open — and the spare key was never going to open it.");
  },

  "bloodless-cloth"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "ready") return no("intent-refused", "The handkerchief is made ready in a pocket. It does not heal on command.");
    if (inst.state !== "intact") return no("spent", "It has already taken a death.");
    inst.bound.ready = true;
    return ok("staunch-ready", "Folded ready, it can answer one bounded killing blow if the coat is not the thing that answers. The debt afterward is sleep at Silt Lane.");
  },

  "corner-stone"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "place") return no("intent-refused", "The fieldstone is set where a survey corner moved.");
    if (owns(ctx.world, COAT) && ctx.world.inventory.some((item) => item.relicId === COAT)) {
      return no("coat-too-much", "The stone and the coat will not be carried together. Leave the coat.");
    }
    if (ctx.world.spatial.some((entry) => entry.id === "span.fieldstone")) {
      return no("already-set", "The corner is already down.");
    }
    ctx.world.spatial.push({
      id: "span.fieldstone",
      label: "Temporary corner the Unruler may measure",
      approved: true,
      context: "puzzle",
      a: 3,
      b: 8,
      swapped: false,
      temporary: true,
    });
    take(ctx.world, inst, "mark.corner");
    return ok("anchor-set", "A temporary approved span exists for this scene only. The Unruler may use it. It is not a campaign anchor, and it will not survive the scene.");
  },

  "measuring-tape"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "measure") return no("intent-refused", "The tape measures Ellis for the coat.");
    if (!owns(ctx.world, COAT)) return no("no-coat", "There is no coat to fit.");
    ctx.world.flags["coat.generous"] = true;
    ctx.world.flags["coat.unavailable"] = true;
    const coat = ctx.world.inventory.find((item) => item.relicId === COAT);
    if (coat) {
      coat.bound.worn = false;
      take(ctx.world, coat, "maeve.sewing");
    }
    return ok("fit-noted", "The tape says the coat still fits, barely. Maeve takes it for a day to ease the shoulders. The next wearing, if it is restored to him, answers a slightly wider near-death band.", [
      { person: "Maeve Voss", response: "She pins and does not discuss the fourteen years. The pins discuss them." },
    ]);
  },

  "ferry-coal"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("ash", "The coal is ash.");
    if (ctx.intent.kind !== "light") return no("intent-refused", "The coal lights the ferry stove for one stamp.");
    const doc = ctx.world.documents.find((entry) => entry.id === ctx.intent.targetId);
    if (!doc) return no("no-target", "There is no such paper.");
    if (doc.protected) return no("protected-paper", "The unrealized clerk apologizes. That document belongs to a protected matter.");
    doc.stamped = true;
    ctx.world.flags["stove.cold"] = true;
    inst.state = "spent";
    return ok("stamped", `${doc.label} takes the successor's stamp. The stove is cold afterward; the ferry lantern cannot be lit from it.`);
  },

  "wake-wax-lid"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "recover") return no("intent-refused", "The lid only tries to recover a shattered June.");
    const june = ctx.world.opportunities.find((entry) => entry.tag === "last-june");
    if (!june?.lost) return no("not-lost", "June is not lost. The lid is only a lid.");
    if (ctx.world.flags["june.witnessed"] === true) {
      return ok("coaster", "Junie already witnessed the flower. The wax lid cannot call a ghost of that June. It is a coaster.");
    }
    june.lost = false;
    june.pendingLoss = true;
    june.localTicks = 1;
    june.available = false;
    ctx.world.actor.mourningVisible = true;
    ctx.world.flags["ghost.june"] = true;
    return ok("ghost-june", "A shorter, unresealable June stands up for one beat. The wax still smells of the wake.");
  },

  "census-line"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "show") return no("intent-refused", "The census line is shown to one skeptical person.");
    const who = ctx.world.people.find((entry) => entry.id === ctx.intent.targetId);
    if (!who) return no("no-target", "No such person.");
    if (who.protectedAccuser) return no("protected-accuser", "The inquest's accuser is not persuaded by a smudged carbon.");
    ctx.world.flags[`delayed.${who.id}`] = true;
    ctx.world.flags["neighbor.childUnborn"] = true;
    return ok("delayed", `${who.name} delays the 'you're dead' sentence for one scene. Somewhere else a neighbor's child is listed unborn, and that door slams.`);
  },

  "hem-bell"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "sew") return no("intent-refused", "The tiny bell is sewn into the coat's hem.");
    if (!owns(ctx.world, COAT)) return no("no-coat", "There is no coat to sew it into.");
    ctx.world.flags["coat.hearth"] = "hearth.silt";
    ctx.world.flags["coat.jingles"] = true;
    ctx.world.actor.mourningVisible = true;
    return ok("hem-set", "Wherever the coat walks home, Ellis will hear which hearth it chose: Silt Lane. It jingles. Mournful rooms will not hide him.");
  },

  "unruler-case"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "open-careless") {
      const last = ctx.world.flags["unruler.lastPair"];
      const pair = ctx.world.spatial.find((entry) => entry.id === last);
      if (!pair) return no("no-memory", "The case remembers no span.");
      if (!pair.approved) {
        return no("refused-unapproved", "The case starts to replay a measurement onto a span that was never approved. The vein stops it cold.");
      }
      const swap = pair.a;
      pair.a = pair.b;
      pair.b = swap;
      pair.swapped = !pair.swapped;
      return ok("replayed", "Careless, the case replays the last approved swap.");
    }
    if (ctx.intent.kind !== "retrieve") return no("intent-refused", "The case retrieves the Unruler, or it is opened carelessly.");
    const placed = ctx.world.placed.find((place) => place.instance.relicId === UNRULER);
    if (!placed) return no("not-lost", "The Unruler is not lying where the case can call it.");
    placed.instance.state = placed.instance.state === "spent" ? "spent" : "fractured";
    ctx.world.inventory.push(placed.instance);
    ctx.world.placed = ctx.world.placed.filter((place) => place !== placed);
    return ok("retrieved", "The case calls the Unruler back at the next safe thought. It returns fractured.");
  },

  "double-exposure"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "expose") return no("intent-refused", "The photograph is used at an open year-window.");
    if (ctx.world.actor.outOfYear === null) return no("shut", "The window is not open. The double exposure has only one year to show.");
    const past = ctx.world.objects.find((entry) => entry.id === ctx.intent.extra?.past);
    const present = ctx.world.objects.find((entry) => entry.id === ctx.intent.extra?.present);
    if (!past || !present) return no("needs-pair", "Choose one past object and one present object.");
    if (past.protected || present.protected) {
      return no("protected-object", "A protected turn-in stays as it is. The photograph will not help it.");
    }
    past.uncertain = true;
    present.uncertain = true;
    ctx.world.flags["photo.uncertain"] = true;
    return ok("double-touch", `He touches ${past.label} and ${present.label} in one beat. Both are uncertain until a living person confirms one. Neither can be turned in to a quest while uncertain.`);
  },

  "bent-spoon"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "share") return no("intent-refused", "The bent spoon shares foreign hunger with someone who agrees.");
    if (!ctx.world.actor.foreignHunger) return no("not-hungry", "He is not full of someone else's hunger.");
    const who = ctx.world.people.find((entry) => entry.id === ctx.intent.targetId);
    if (!who?.present || who.closed) return no("unwilling", "They are not present and willing.");
    ctx.world.actor.foreignHunger = false;
    ctx.world.flags[`${who.id}.foreignHunger`] = true;
    if (who.id === "maeve") ctx.world.flags["maeve.forbidsSecondSpoon"] = true;
    return ok("hunger-shared", `${who.name} takes the foreign hunger. Ellis can eat as himself. Maeve, if it was her, forbids the second spoon in her house for a day.`, [
      { person: who.name, response: "They swallow and look personally offended by a hunger that is not theirs." },
    ]);
  },

  "ring-peg"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "hang") return no("intent-refused", "The peg is for the ring, in the remembered shed.");
    const shed = ctx.world.doors.find((entry) => entry.id === "door.shed");
    if (!shed || shed.locked) return no("shed-shut", "The peg only exists in the remembered shed. The spare key has to have opened it.");
    if (!owns(ctx.world, RING)) return no("no-ring", "There is no ring to hang.");
    ctx.world.flags["ring.spreadPaused"] = true;
    return ok("spread-paused", "Hung on the peg, the erased ring will not smear a second survey mark this scene.");
  },

  "junie-note"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("written", "The note has already been written.");
    if (ctx.intent.kind !== "write") return no("intent-refused", "Junie writes the note, or nobody does.");
    if (ctx.world.flags["june.witnessed"] !== true) return no("no-witness", "The paper stays blank until Junie has witnessed June.");
    const junie = ctx.world.people.find((entry) => entry.id === "junie");
    if (!junie?.present) return no("not-here", "Junie has to be the one who writes.");
    inst.state = "spent";
    ctx.world.flags["true-object.junie-note"] = true;
    ctx.world.flags["junie.note"] = "He was supposed to come back and the grass was supposed to stay.";
    return ok("note-written", "Junie writes: “He was supposed to come back and the grass was supposed to stay.” It counts as a true object for one homestead restoration. Maeve may not want to read it.");
  },

  "cracked-twin"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (nightLocked(ctx.world)) return no("night-quiet", "The dock bell will not talk over the lullaby.");
    if (ctx.intent.kind !== "ring") return no("intent-refused", "The cracked twin is rung at the dock.");
    const nave = ctx.world.sounds.find((entry) => entry.id === "sound.nave");
    const timer = ctx.world.timers.find((entry) => entry.id === "timer.boat");
    if (timer && !timer.protected) timer.remaining = Math.max(0, timer.remaining - 1);
    if (!nave?.revealed) {
      ctx.world.flags["gulls"] = true;
      return ok("gulls", "The under-layer was never revealed, so the twin only scares gulls. The ferry schedule still skips a beat.");
    }
    ctx.world.flags["dock.repeated"] = nave.under;
    return ok("repeated", `The dock bell repeats the hidden sentence once: ${nave.under} The evening boat's timer loses a beat.`);
  },

  "colder-gloves"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "remove") {
      ctx.world.flags["gloves.cold"] = false;
      ctx.world.actor.clumsy = false;
      return ok("ungloved", "Bare hands again. The cold year in the window is no longer his to enter unprotected.");
    }
    if (ctx.intent.kind !== "wear") return no("intent-refused", "The gloves are worn or taken off.");
    ctx.world.flags["gloves.cold"] = true;
    ctx.world.actor.clumsy = true;
    return ok("gloved", "He can enter the window's cold year without the quilt. In the present, key and ring and spoon are too fine for these fingers.");
  },

  "sealed-argument"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.world.actor.outOfYear !== 2011) {
      return no("wrong-year", "The argument is only enterable when the north window stands in the quarrel year, 2011.");
    }
    if (ctx.intent.kind !== "revise") return no("intent-refused", "Inside, he may revise one unprotected sentence he said.");
    const line = ctx.world.sentences.find((entry) => entry.id === ctx.intent.targetId);
    if (!line) return no("no-line", "That sentence is not in the room.");
    if (line.protected) return no("protected-line", "That line is behind glass. It is quest canon, and the room will not change it.");
    if (line.speaker !== "Ellis") return no("not-his", "He can only change a sentence that was his.");
    if (line.revised) return no("already-revised", "He has already spent the room's one revision.");
    line.text = line.alternate;
    line.revised = true;
    ctx.world.flags["argument.hardened"] = line.id;
    return ok("revised", `He says instead: “${line.alternate}” The other person's answering sentence hardens in the present.`, [
      { person: "Maeve Voss", response: "In the present she is sharper about the nail, as if she had been warned and still left it up." },
    ]);
  },

  "marble-soap"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("spent", "The soap is a sliver already used.");
    if (ctx.intent.kind !== "wash") return no("intent-refused", "The soap washes a stolen name back early.");
    if (!ctx.world.actor.cannotSayOwnName) return no("has-name", "His name is already in his mouth.");
    ctx.world.actor.cannotSayOwnName = false;
    ctx.world.flags["ash.untilDawn"] = false;
    ctx.world.flags["name.wrong"] = true;
    inst.state = "spent";
    return ok("name-washed", "He can speak again before dawn, but the name comes out as the census has it, slightly wrong. Maeve will correct him in public.", [
      { person: "Maeve Voss", response: "She corrects the syllable in front of whoever is listening." },
    ]);
  },

  "split-chair"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.world.flags["chair.used"] === true) return no("already-used", "The leg has already been wedged once.");
    if (ctx.intent.kind !== "wedge") return no("intent-refused", "The split leg wedges a refusing homestead door, once.");
    const door = ctx.world.doors.find((entry) => entry.id === ctx.intent.targetId);
    if (!door || door.kind !== "remembered-homestead") return no("not-remembered", "It will not wedge a campaign lock.");
    if (!door.refused && ctx.world.flags["maeve.refusing"] !== true) {
      return no("not-refusing", "The door is not refusing him. Use a key, not a broken chair.");
    }
    door.locked = false;
    door.refused = false;
    ctx.world.flags["chair.used"] = true;
    ctx.world.flags["kettle.blocked"] = true;
    ctx.world.flags["maeve.refusingResume"] = true;
    return ok("forced-entry", "One entry, without clearing the witness-debt. The refusal resumes after. Maeve will find the split, and the kettle will not call her until the chair is repaired.");
  },

  "medicine-veinwater"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("drunk", "The bottle is empty.");
    if (ctx.intent.kind !== "sip") return no("intent-refused", "One sip diagnoses the inventory.");
    const fractured = [...ctx.world.inventory, ...ctx.world.placed.map((place) => place.instance)]
      .filter((item) => item.state === "fractured")
      .map((item) => item.relicId);
    const falseId = ctx.world.flags["false.relic"];
    ctx.world.flags["diagnosed"] = true;
    inst.state = "spent";
    if (ctx.world.flags["spoon.memory"]) ctx.world.actor.foreignHunger = true;
    const detail = `Veinwater names fractured relics [${fractured.join(", ") || "none"}] and the false relic [${typeof falseId === "string" && falseId ? falseId : "none"}].`;
    return ok("diagnosed", ctx.world.actor.foreignHunger ? `${detail} Because he had eaten for a guest, the foreign hunger wakes.` : detail);
  },

  "wrong-wreath"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "tie") return no("intent-refused", "The ribbon is tied on a grave.");
    const grave = ctx.world.graves.find((entry) => entry.id === ctx.intent.targetId);
    if (!grave) return no("no-target", "There is no such grave.");
    if (grave.protected) return no("protected-grave", "The ribbon falls off. This grave will not take a wrong wreath.");
    const mode = String(ctx.intent.extra?.mode ?? "");
    ctx.world.actor.recognized += 1;
    if (mode === "refuse") {
      ctx.world.flags["ash.withheld"] = true;
      return ok("wreath-refused", "He chooses not to disturb the name. The ash, if he still has it, will not be consumed here. A living mourner sees the wrong name on the ribbon.");
    }
    if (mode !== "kinder") return no("need-mode", "Say whether the wreath makes the question kinder or refuses it.");
    ctx.world.flags[`${grave.id}.fuller`] = true;
    return ok("wreath-kinder", "The next question at this grave, if the ash is asked, will answer more fully. A mourner sees Ellis's name where another name should be.");
  },

  "return-ticket"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "leave") return no("intent-refused", "The ticket leaves at the county line, or it stays in the pocket.");
    const finale = ctx.world.quests.find((entry) => entry.id === "quest.finale");
    if (finale?.protected && finale.status === "active") {
      return no("finale-open", "The return ticket will not punch through an unfinished, protected ending.");
    }
    if (ctx.intent.targetId !== "door.county") return no("not-the-line", "It only works at the authored county line, not at a campaign gate.");
    for (const item of ctx.world.inventory) {
      if (item.relicId === ctx.relic.id) continue;
      if (item.state === "fractured") {
        ctx.world.placed.push({ where: "hearth.silt", instance: item });
      } else {
        if (item.relicId === relicId(40)) item.state = "dormant";
        ctx.world.veinBank.push(item);
      }
    }
    ctx.world.inventory = ctx.world.inventory.filter((item) => item.relicId === ctx.relic.id);
    const ticket = ctx.world.inventory.find((item) => item.relicId === ctx.relic.id);
    if (ticket) ticket.state = "spent";
    ctx.world.actor.ageShown = 43;
    ctx.world.flags["band.too-small"] = true;
    ctx.world.flags["left.county"] = true;
    return ok("left", "He crosses the county line on the real road. Whole relics bank in the vein. Fractured ones stay at the hearth. The mirror's age catches him, and the unworn band goes too small.");
  },

  "marble-heart"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("already-set", "The heart is already set. It does not get a second choosing.");
    const open = ctx.world.quests.some((entry) => entry.protected && entry.status === "active");
    if (open) {
      return no("waits", "The heart stays in his hand. A protected matter is still open, and it will not let him choose around it.");
    }
    if (ctx.intent.kind === "set-hearth") {
      if (ctx.world.flags["coat.acknowledged"] !== true) {
        return no("needs-acknowledgement", "Maeve or Ione has to have acknowledged the coat before the heart will sit in that hearth.");
      }
      ctx.world.flags["heart.set"] = "hearth";
      ctx.world.flags["persist.restored"] = true;
      inst.state = "spent";
      return ok("set-hearth", "Set in the Silt Lane hearth, every relic he has already restored stays restored across death.");
    }
    if (ctx.intent.kind === "set-shrine") {
      ctx.world.flags["heart.set"] = "shrine";
      ctx.world.flags["key.allowanceCleared"] = true;
      ctx.world.flags["key.extraHomestead"] = "";
      inst.state = "spent";
      return ok("set-shrine", "Set in the quarry shrine, restored relics will persist, and Maeve's doors forget the spare key's allowance.", [
        { person: "Maeve Voss", response: "She does not feel the forgetting. The nail simply stops meaning a person." },
      ]);
    }
    return no("intent-refused", "The heart is set in the hearth or in the shrine. It does not work as a weapon or a key.");
  },
};
