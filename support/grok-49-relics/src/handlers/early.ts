import type { Handler } from "../effect-types.ts";
import { relicId } from "../ids.ts";
import { carried, debtBlocksRestore, isResult, nightLocked, no, num, ok, str, strs } from "./util.ts";

const PENCIL = relicId(16);

export const earlyHandlers: Record<string, Handler> = {
  "remembered-door"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.world.actor.clumsy) return no("clumsy", "The colder-year gloves make his fingers too thick for a key.");
    const homes = strs(ctx.relic.params, "homesteadIds");
    const refusalId = str(ctx.relic.params, "refusalHomesteadId");
    const refusalAfter = num(ctx.relic.params, "refusalAfter");
    const trueFlag = str(ctx.relic.params, "trueObjectFlag");
    const world = ctx.world;

    if (ctx.intent.kind === "restore") {
      const debt = debtBlocksRestore(world);
      if (debt) return debt;
      if (world.flags[trueFlag] !== true) {
        return no("restore-incomplete", "The house will not take a substitute. It wants an object that was truly lived with.");
      }
      world.flags[trueFlag] = false;
      world.flags["maeve.refusing"] = false;
      const home = world.doors.find((door) => door.homesteadId === refusalId);
      if (home) home.refused = false;
      inst.state = "intact";
      return ok("restored", "Maeve's door will have him again. The extra chair is still in the memory, but the refusal is gone.", [
        { person: "Maeve Voss", response: "She takes the offered thing without thanking him. That is how she used to forgive." },
      ]);
    }

    if (ctx.intent.kind !== "use") return no("intent-refused", "The spare key is only for remembered homestead doors.");
    if (world.flags["key.allowanceCleared"] === true) {
      return no("heart-shrined", "The Marble Heart was set in the quarry. Maeve's doors have forgotten the shape of this key.");
    }
    const door = world.doors.find((entry) => entry.id === ctx.intent.targetId);
    if (!door) return no("no-target", "There is no such door.");
    if (door.kind === "campaign-gate") {
      return no("campaign-gate", "The key does not recognize a campaign gate as a house.");
    }
    if (door.kind !== "remembered-homestead") {
      return no("not-remembered", "This lock was made by a locksmith, not by a memory. The spare key does nothing.");
    }
    const allowed =
      (door.homesteadId && homes.includes(door.homesteadId)) ||
      (door.homesteadId !== "" && world.flags["key.extraHomestead"] === door.homesteadId);
    if (!allowed) return no("not-authored", "The vein never kept this house. The key will not invent it.");
    if (door.refused || (door.homesteadId === refusalId && world.flags["maeve.refusing"] === true)) {
      return no("lineage-refuses", "Maeve has seen the extra chair too often. Her door stays a memory he is locked out of.");
    }
    door.locked = false;
    door.witnessed += 1;
    const witnesses = numFlag(world, "maeve.witnesses") + 1;
    world.flags["maeve.witnesses"] = witnesses;
    world.flags[`door.extraChair.${door.id}`] = true;
    if (witnesses >= refusalAfter) {
      world.flags["maeve.refusing"] = true;
      const home = world.doors.find((entry) => entry.homesteadId === refusalId);
      if (home) home.refused = true;
    }
    return ok(
      "opened",
      `${door.label} opens on the house as it was kept, not as it is locked. A chair has been pulled out for someone who did not live there.`,
      [
        {
          person: "Maeve Voss",
          response:
            door.homesteadId === refusalId
              ? "She looks at the extra chair and says his name like a question."
              : "The remembered keeper of that house notices a chair they did not set.",
        },
      ],
    );
  },

  "spatial-swap"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "use") return no("intent-refused", "The Unruler only swaps an approved span.");
    const measureLock = ctx.world.locks.find((lock) => lock.group === "measure" && lock.untilTick > ctx.world.tick);
    if (measureLock) {
      return no("measure-sick", "Calder's level has left Ellis unable to trust a second measurement this scene.");
    }
    const pair = ctx.world.spatial.find((entry) => entry.id === ctx.intent.targetId);
    if (!pair) return no("no-target", "There is no such span.");
    if (!pair.approved || pair.context === "quest") {
      return no("not-approved", "The Unruler only changes an approved puzzle gap or an approved combat reach. Quest distances stay put.");
    }
    if (ctx.world.flags["unruler.debt"] === true) {
      pair.a *= 2;
      pair.b *= 2;
      ctx.world.flags["unruler.debt"] = false;
    } else {
      ctx.world.flags["unruler.debt"] = true;
    }
    const swap = pair.a;
    pair.a = pair.b;
    pair.b = swap;
    pair.swapped = !pair.swapped;
    ctx.world.flags["unruler.lastPair"] = pair.id;
    return ok(
      "swapped",
      `${pair.label} exchanges its measures (${pair.a} against ${pair.b}). The missing inches are a debt.`,
      [{ person: "Calder Voss", response: "A dead surveyor would call this dishonest and, quietly, useful." }],
      true,
    );
  },

  "seal-fleeting"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    const tag = str(ctx.relic.params, "tag");
    const conflict = typeof ctx.relic.params.conflictTag === "string" ? ctx.relic.params.conflictTag : "";
    const world = ctx.world;
    const heldId = typeof inst.bound.contents === "string" ? inst.bound.contents : "";

    if (ctx.intent.kind === "seal") {
      const chance = world.opportunities.find((entry) => entry.id === ctx.intent.targetId);
      if (!chance) return no("no-target", "There is no such fleeting thing.");
      if (chance.tag !== tag) {
        return no("wrong-tag", `This jar keeps only ${tag}. It will not preserve a different weather.`);
      }
      if (chance.lost) return no("already-lost", "That chance is already gone from the world.");
      if (chance.sealedIn) return no("already-sealed", "It is already in glass.");
      if (conflict) {
        const other = world.opportunities.find((entry) => entry.tag === conflict);
        if (other && (other.localTicks > 0 || other.sealedIn !== "")) {
          return no("season-clash", "June and ordinary August will not be open in the same air.");
        }
      }
      chance.available = false;
      chance.sealedIn = inst.instanceId;
      inst.bound.contents = chance.id;
      return ok("sealed", `${chance.description} The site outside the glass loses it.`);
    }

    if (ctx.intent.kind === "release") {
      const chance = world.opportunities.find((entry) => entry.id === heldId);
      if (!chance) return no("empty-jar", "The jar is empty.");
      chance.localTicks = 3;
      chance.pendingLoss = true;
      chance.sealedIn = "";
      chance.available = false;
      inst.bound.contents = "";
      inst.state = "spent";
      return ok("released", `The preserved ${tag} opens here for a short while, and the jar cannot keep it again.`);
    }

    if (ctx.intent.kind === "shatter") {
      const chance = world.opportunities.find((entry) => entry.id === heldId);
      if (chance) {
        chance.lost = true;
        chance.available = false;
        chance.sealedIn = "";
        chance.pendingLoss = false;
      }
      inst.bound.contents = "";
      inst.state = "fractured";
      return ok("shattered", "The glass goes and the chance goes with it. The meadow does not get its weather back.");
    }

    if (ctx.intent.kind === "restore") {
      if (ctx.intent.extra?.atOrigin !== true) {
        return no("not-origin", "It can only be returned at the site it was taken from.");
      }
      const chance = world.opportunities.find((entry) => entry.id === heldId);
      if (!chance || chance.lost) return no("nothing-to-return", "There is nothing left in the jar to give back.");
      chance.available = true;
      chance.sealedIn = "";
      chance.localTicks = 0;
      chance.pendingLoss = false;
      inst.bound.contents = "";
      inst.state = "intact";
      return ok("returned-to-site", "Unopened, the chance goes back into its place. The jar is only glass again, and can be filled once more.");
    }

    return no("intent-refused", "The jar can seal, release, shatter, or be returned at its origin.");
  },

  "coat-wear"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "wear") {
      if (ctx.world.flags["coat.unavailable"] === true) {
        return no("at-the-tailor", "Maeve has the coat and will not give it back until tomorrow.");
      }
      if (inst.state !== "intact") {
        return no("needs-restoration", "The coat will not be worn until it is mended and someone from the house acknowledges it.");
      }
      inst.bound.worn = true;
      ctx.world.actor.mourningVisible = true;
      return ok(
        "worn",
        "Ellis puts the coat on. Anyone who remembers the funeral can see that a dead man's coat is walking.",
        [{ person: "Ione Pell", response: "She goes still in the shoulders, the way she did when it first came home alone." }],
      );
    }
    if (ctx.intent.kind === "doff") {
      inst.bound.worn = false;
      return ok("doffed", "He takes the coat off. The room gets less like a wake.");
    }
    if (ctx.intent.kind === "restore") {
      const debt = debtBlocksRestore(ctx.world);
      if (debt) return debt;
      const who = String(ctx.intent.extra?.person ?? "");
      if (who !== "maeve" && who !== "ione") {
        return no("needs-lineage", "Only Maeve or Ione can acknowledge the coat. A stranger's sympathy does nothing.");
      }
      const speaker = ctx.world.people.find((entry) => entry.id === who);
      if (!speaker?.present) return no("not-here", `${who} is not here to say it.`);
      if (inst.state === "fractured") {
        return no("still-torn", "The cloth is still torn open at the blow. Mend it before a word will seat it.");
      }
      if (inst.state !== "mending") return no("not-torn", "The coat is not waiting on a word.");
      inst.state = "intact";
      ctx.world.flags["coat.improper"] = false;
      ctx.world.flags["coat.acknowledged"] = true;
      return ok("restored", `${speaker.name} puts a hand on the coat and does not take it back. It can be worn again.`, [
        { person: speaker.name, response: "They say his name in the present tense, once, and then look angry about it." },
      ]);
    }
    return no("intent-refused", "The coat is worn, taken off, or acknowledged. It does not open doors.");
  },

  "sound-underlayer"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (nightLocked(ctx.world)) return no("night-quiet", "The lullaby is still in the house. No bell will speak over it.");
    const sound = ctx.world.sounds.find((entry) => entry.id === ctx.intent.targetId);
    if (ctx.intent.kind === "rest") {
      const hoarse = sound ?? ctx.world.sounds.find((entry) => entry.hoarse);
      if (!hoarse) return no("no-target", "Nothing is hoarse.");
      hoarse.hoarse = false;
      return ok("bell-rested", "Silence in the nave lets the upper bell find its note again.");
    }
    if (ctx.intent.kind !== "ring") return no("intent-refused", "The under-bell is rung, or rested.");
    if (!sound) return no("no-target", "There is no such sounding.");
    if (!sound.under) return no("no-underlayer", "This sound has no second layer. The relic will not invent one.");
    if (sound.underProtected) {
      return no(
        "protected-underlayer",
        "A second ringing is there, and it belongs to a protected quest. The bell under the bell will not speak it.",
      );
    }
    if (sound.hoarse) return no("hoarse", "The upper bell is hoarse and the under-bell will not repeat itself until the nave has been quiet.");
    sound.revealed = true;
    sound.hoarse = true;
    return ok("underlayer", `The upper bell goes hoarse. Beneath it: ${sound.under}`);
  },

  "boundary-shift"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.world.actor.clumsy) return no("clumsy", "The colder-year gloves will not let him turn a ring that small.");
    const bound = ctx.world.boundaries.find((entry) => entry.id === ctx.intent.targetId);
    if (!bound) return no("no-target", "There is no such mark.");
    if (bound.class !== "survey-mark") {
      return no("class-refused", "The ring only moves a surveyor's pencil mark. Campaign gates, quest locks, and region borders do not answer it.");
    }
    if (ctx.intent.kind === "redraw") {
      const debt = debtBlocksRestore(ctx.world);
      if (debt) return debt;
      if (ctx.world.flags[`inked.${bound.id}`] === true) {
        return no("ink-holds", "That erasure was ink. The pencil skids off it until the ink gives itself back.");
      }
      const pencil = ctx.world.inventory.find((item) => item.relicId === PENCIL && item.state === "intact");
      if (!pencil) return no("needs-pencil", "Redrawing wants Calder's pencil stub, not a finger.");
      bound.notch = bound.originNotch;
      bound.readable = true;
      const uses = (typeof pencil.bound.uses === "number" ? pencil.bound.uses : 0) + 1;
      pencil.bound.uses = uses;
      if (uses >= 3) pencil.state = "spent";
      return ok("redrawn", `${bound.label} is back at its original notch.`);
    }
    if (ctx.intent.kind !== "shift") return no("intent-refused", "The ring shifts a survey mark or, with the pencil, redraws one.");
    if (bound.frozen) return no("frozen", "A nail bent by a quarrel is holding this line still.");
    if (ctx.world.flags["ring.spreadPaused"] === true) {
      return no("pegged", "The ring is on Calder's peg and will not eat another line while it hangs.");
    }
    if (ctx.world.flags[`inked.${bound.id}`] === true) return no("ink-holds", "Ink already ate this mark.");
    bound.notch += 1;
    const other = ctx.world.boundaries.find(
      (entry) => entry.class === "survey-mark" && entry.id !== bound.id && entry.readable && !entry.protected,
    );
    if (other) {
      other.readable = false;
      ctx.world.flags["ring.smeared"] = other.id;
    }
    return ok(
      "shifted",
      `${bound.label} moves one notch. Another pencil line in the district goes unreadable, because erasure spreads.`,
      [{ person: "Calder Voss", response: "He would have hated the smear more than the shift." }],
      true,
    );
  },

  "absent-meal"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.world.actor.clumsy) return no("clumsy", "He cannot hold the second spoon in those gloves.");
    if (ctx.world.flags["maeve.forbidsSecondSpoon"] === true && ctx.world.sceneId === "scene.silt") {
      return no("forbidden", "Maeve has forbidden the second spoon in her house until tomorrow.");
    }
    if (ctx.intent.kind !== "eat") return no("intent-refused", "The spoon only eats for an unrealized guest.");
    const table = ctx.world.tables.find((entry) => entry.id === ctx.intent.targetId);
    if (!table) return no("no-target", "There is no such table.");
    if (!table.guest) return no("no-guest", "This table has no authored empty place. The spoon is only a spoon.");
    ctx.world.actor.foreignHunger = true;
    ctx.world.flags["spoon.memory"] = table.memory;
    return ok("guest-memory", `Ellis eats for ${table.guest}. What remains is their memory: ${table.memory}`, [
      { person: "Maeve Voss", response: "She sets a plate she will not admit is for the lodger." },
    ]);
  },

  "spend-birthday"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "open") return no("intent-refused", "The ledger only opens an unlived birthday.");
    const day = ctx.world.birthdays.find((entry) => entry.id === ctx.intent.targetId);
    if (!day) return no("no-target", "That day is not in the ledger.");
    if (day.protected) return no("protected-birthday", "That name-day is a protected quest reward. The threadbare ledger will not spend it.");
    if (day.spent) return no("already-spent", "That unlived birthday has already been spent. It does not come back.");
    day.spent = true;
    return ok("spent-birthday", `${day.who} yields its gift once: ${day.gift}`);
  },

  "year-window"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    const win = ctx.world.windows.find((entry) => entry.id === (ctx.intent.targetId ?? "window.silt"));
    if (!win) return no("no-target", "There is no such window.");
    if (ctx.intent.kind === "close") {
      win.openYear = null;
      ctx.world.actor.outOfYear = null;
      return ok("window-shut", "The glass is only glass. Ellis is back in the year he returned to.");
    }
    if (ctx.intent.kind === "speak") {
      if (ctx.world.actor.outOfYear !== null) {
        return no("out-of-year", "His mouth is still in the other year. They hear a shape, not a sentence.");
      }
      return ok("spoke", "He speaks in the present, and is heard.");
    }
    if (ctx.intent.kind === "touch") {
      if (ctx.world.actor.outOfYear === null) return no("shut", "The window is shut. There is no past object to touch.");
      const obj = ctx.world.objects.find((entry) => entry.id === ctx.intent.targetId);
      if (!obj) return no("no-target", "That object is not in the room.");
      if (obj.protected) return no("protected-object", "That object is a protected exhibit. The window will not hand it over.");
      ctx.world.flags[`held.${obj.id}`] = true;
      return ok("touched", `Ellis touches ${obj.label} as it exists in ${ctx.world.actor.outOfYear}.`);
    }
    if (ctx.intent.kind !== "look") return no("intent-refused", "The window looks, touches, or closes.");
    const year = Number(ctx.intent.extra?.year);
    if (win.protectedYears.includes(year)) {
      return no("year-refused", "That year is sealed as a campaign fact. The glass stays dark.");
    }
    if (!win.approvedYears.includes(year)) return no("year-refused", "The window was not authored for that year.");
    if (ctx.world.flags["mirror.uncovered"] === true && year !== 2012) {
      return no("mirror-fixed", "The marble-backed mirror holds the window on the year he died.");
    }
    if (year === 2010 && ctx.world.flags["gloves.cold"] !== true && ctx.world.flags["quilt.warmth"] !== true) {
      return no("too-cold", "The cold year in that glass needs the missed-winter quilt or the colder-year gloves.");
    }
    win.openYear = year;
    ctx.world.actor.outOfYear = year;
    return ok("year-open", `The room becomes ${year}. People standing in the present cannot quite be answered.`);
  },

  "grave-question"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (inst.state === "spent") return no("ash-spent", "The ash was only enough for one question.");
    if (ctx.intent.kind !== "ask") return no("intent-refused", "The ash asks one unspoken name, and only that.");
    if (ctx.world.flags["ash.withheld"] === true) {
      return no("wreath-refused", "The wrong wreath asked that this grave be left alone. The ash will not cross it.");
    }
    const grave = ctx.world.graves.find((entry) => entry.id === ctx.intent.targetId);
    if (!grave) return no("no-target", "There is no such grave.");
    if (grave.protected) return no("protected-grave", "The ash slides off. This grave is sealed by a protected rite.");
    if (grave.asked) return no("already-asked", "That name already answered.");
    grave.asked = true;
    inst.state = "spent";
    ctx.world.actor.cannotSayOwnName = true;
    ctx.world.flags["ash.untilDawn"] = true;
    ctx.world.flags["ash.dawnTick"] = ctx.world.tick;
    const fuller = ctx.world.flags[`${grave.id}.fuller`] === true;
    const answer = fuller ? `${grave.answer} They would have waited at the dock anyway.` : grave.answer;
    return ok("asked", `The unspoken name answers once: ${answer} Ellis cannot say his own name until dawn.`);
  },

  "mirror-path"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "fold") {
      ctx.world.actor.handsMirrored = false;
      ctx.world.locks = ctx.world.locks.filter((lock) => !(lock.group === "spatial-rewrite" && lock.ownerId === ctx.relic.id));
      return ok("folded", "Folded on the printed crease, the map lets his hands go back to their own sides.");
    }
    if (ctx.intent.kind !== "mirror") return no("intent-refused", "The map mirrors one safe path, or it is folded away.");
    if (ctx.world.flags["maps.marginOpen"] === true) {
      return no("margin-blank", "The margin where he wrote Home has blanked every other map.");
    }
    const path = ctx.world.paths.find((entry) => entry.id === ctx.intent.targetId);
    if (!path) return no("no-target", "There is no such path.");
    if (!path.mirrorSafe) return no("not-mirror-safe", "This path is not marked mirror-safe. The map will not flip a campaign road.");
    path.facing = path.facing === "left" ? "right" : "left";
    ctx.world.actor.handsMirrored = true;
    return ok("mirrored", `${path.label} now faces ${path.facing}. Ellis's hands stay mirrored until the map is folded.`, undefined, true);
  },

  "vein-cup"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "drink") {
      if (ctx.world.flags["cup.filled"] === false) return no("cup-empty", "The cup has already been drunk.");
      ctx.world.flags["cup.filled"] = false;
      const distorted = ctx.world.flags["cup.distorted"] === true;
      const line = distorted
        ? "A voice near the spring says a name that is almost Maeve's and is not."
        : "The unrealized life nearest the spring is the winter Ellis came home. He is laughing in the shed, and the laugh is his.";
      ctx.world.flags["echo.heard"] = line;
      if (distorted) ctx.world.flags["cup.distorted"] = false;
      return ok("echo", line);
    }
    if (ctx.intent.kind === "truth") {
      if (ctx.world.flags["at.spring"] !== true && ctx.world.sceneId !== "scene.spring") {
        return no("not-at-spring", "The spring has to hear it.");
      }
      ctx.world.flags["cup.distorted"] = false;
      ctx.world.flags["spring.told"] = true;
      return ok("told", "He tells the spring the plain version. The next echo, if there is one, can come out straight.");
    }
    if (ctx.intent.kind !== "refill") return no("intent-refused", "The cup is drunk or refilled at the spring.");
    if (ctx.world.flags["at.spring"] !== true && ctx.world.sceneId !== "scene.spring") {
      return no("not-at-spring", "It only refills at the veinspring.");
    }
    if (ctx.world.flags["cup.freeRefill"] === true) {
      ctx.world.flags["cup.freeRefill"] = false;
      ctx.world.flags["cup.filled"] = true;
      ctx.world.flags["cup.distorted"] = ctx.world.flags["spring.told"] === true ? false : true;
      return ok("refilled", "The spring's first stone pays the memory-cost once. Unless he has told the truth, the echo will come out crooked.");
    }
    const entry = ctx.world.journal.find((item) => item.id === ctx.intent.extra?.journalId);
    if (!entry) return no("no-memory", "He has to choose a memory to forget.");
    if (entry.protected) return no("protected-memory", "The cup refuses. That memory is still owed to a protected matter.");
    if (entry.forgotten) return no("already-forgotten", "That memory is already gone.");
    entry.forgotten = true;
    ctx.world.flags["cup.filled"] = true;
    return ok("refilled", `The cup fills. Ellis no longer has this: ${entry.text}`);
  },

  "season-nail"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "return-nail") {
      ctx.world.flags["nail.hole"] = false;
      inst.bound.hung = false;
      return ok("nail-returned", "The nail goes back into the remembered board. The present wall stops drafting.");
    }
    if (ctx.intent.kind !== "hang") return no("intent-refused", "The nail hangs one remembered thing, or it is returned.");
    const door = ctx.world.doors.find((entry) => entry.id === ctx.intent.targetId);
    if (!door || door.kind !== "remembered-homestead") {
      return no("not-remembered", "The nail only seats into a remembered mudroom board, not a present wall.");
    }
    inst.bound.hung = true;
    ctx.world.flags["nail.hungOn"] = door.id;
    ctx.world.flags["nail.hole"] = true;
    return ok("hung", `The nail takes a place in ${door.label}. In the present house, a draft finds a hole that was not there.`);
  },

  "unsent-letter"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind === "burn" || ctx.intent.kind === "return") {
      ctx.world.flags["letter.burned"] = ctx.intent.kind === "burn";
      ctx.world.flags["letter.read"] = false;
      ctx.world.flags["ione.ferryClosed"] = false;
      inst.state = ctx.intent.kind === "burn" ? "spent" : "intact";
      return ok(ctx.intent.kind === "burn" ? "burned" : "returned", "Ione's present speech about the ferry is hers again.");
    }
    if (ctx.intent.kind !== "read") return no("intent-refused", "The letter is read, returned, or burned.");
    if (ctx.world.sceneId !== "scene.pell" && ctx.intent.extra?.atTable !== true) {
      return no("wrong-table", "The unsent letter only opens its old answer at the Pell kitchen table.");
    }
    ctx.world.flags["letter.read"] = true;
    ctx.world.flags["ione.ferryClosed"] = true;
    const full = ctx.world.flags["letter.full"] === true;
    return ok(
      "letter-open",
      full
        ? "Because the unworn band was shown, the letter finishes: she would have said yes and hated the ferry anyway."
        : "Ione-from-fourteen-years-ago answers one line: she would have met him at the loft if he had sent this.",
      [{ person: "Ione Pell", response: "The living Ione will not discuss the ferry until the letter is burned or put back in her hand." }],
    );
  },

  "remembered-crossing"(ctx) {
    const inst = carried(ctx.instance, ctx.relic.name);
    if (isResult(inst)) return inst;
    if (ctx.intent.kind !== "board") return no("intent-refused", "The ticket only boards the unrealized next-day boat.");
    if (ctx.intent.targetId === "water.campaign") {
      return no("campaign-water", "The ticket is not a way through the campaign river gate.");
    }
    if (ctx.world.flags["board.noEvening"] !== true) {
      return no("no-boat", "The board does not say the evening boat is cancelled. Tomorrow's unrealized crossing is not offered.");
    }
    if (ctx.world.flags["ticket.punched"] !== true) {
      return no("needs-punch", "The remembered conductor will not take an unpunched ticket.");
    }
    if (ctx.world.flags["true.calendar"] !== true && ctx.world.flags["watch.open"] !== true) {
      return no("stalled-time", "Ellis's own time is still stalled. The watch that gained fourteen years has to be open for the date to match.");
    }
    ctx.world.tick += 1;
    ctx.world.flags["crossed.tomorrow"] = true;
    inst.state = "spent";
    return ok("crossed", "He rides the boat that only existed as tomorrow. The night is gone and he is still on this bank, a morning later.");
  },
};

function numFlag(world: { flags: Record<string, string | number | boolean> }, key: string): number {
  const value = world.flags[key];
  return typeof value === "number" ? value : 0;
}
