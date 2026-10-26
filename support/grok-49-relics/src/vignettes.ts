import { acquire, resolve } from "./kernel.ts";
import { resolveBlow } from "./death.ts";
import { RELICS } from "./catalog.ts";
import { advance } from "./settle.ts";
import { relicId, type RelicId } from "./ids.ts";
import type { EffectResult, Intent, World } from "./types.ts";
import { createBench, speak } from "./index.ts";

export interface VignetteAction {
  id: string;
  label: string;
  detail: string;
  run: (world: World) => EffectResult;
}

export interface Vignette {
  id: string;
  relicId: RelicId;
  title: string;
  lede: string;
  actions: VignetteAction[];
}

function enact(world: World, intent: Intent): EffectResult {
  return resolve(world, intent, RELICS);
}

function take(id: RelicId): (world: World) => EffectResult {
  return (world) => {
    const relic = RELICS.find((entry) => entry.id === id);
    if (!relic) return { ok: false, code: "unknown-relic", detail: "Missing relic.", world };
    return acquire(world, relic);
  };
}

export const VIGNETTES: Vignette[] = [
  {
    id: "silt",
    relicId: relicId(1),
    title: "The nail by the north window",
    lede: "Maeve's spare key is in your hand. The mill still has a padlock. The quarry still has a seal. Only houses the vein remembers will open, and each one pulls out a chair.",
    actions: [
      { id: "mill", label: "Try the mill padlock", detail: "A locksmith's lock, not a memory.", run: (world) => enact(world, { relicId: relicId(1), kind: "use", targetId: "door.mill" }) },
      { id: "quarry", label: "Try the quarry seal", detail: "A campaign gate.", run: (world) => enact(world, { relicId: relicId(1), kind: "use", targetId: "door.quarry" }) },
      { id: "silt", label: "Open Silt Lane as Maeve remembers it", detail: "An authored homestead.", run: (world) => enact(world, { relicId: relicId(1), kind: "use", targetId: "door.silt" }) },
      { id: "pell", label: "Open the Pell kitchen memory", detail: "Second witnessing.", run: (world) => enact(world, { relicId: relicId(1), kind: "use", targetId: "door.pell" }) },
      { id: "hart", label: "Open the Hart porch memory", detail: "Third witnessing. Maeve's door will refuse after this.", run: (world) => enact(world, { relicId: relicId(1), kind: "use", targetId: "door.hart" }) },
      { id: "again", label: "Try Silt Lane again", detail: "The extra chairs have a cost.", run: (world) => enact(world, { relicId: relicId(1), kind: "use", targetId: "door.silt" }) },
      { id: "bread", label: "Offer Ione's silt-bread", detail: "Sets the true-object flag, then asks the door to forgive.", run: (world) => {
        const next = structuredClone(world);
        next.flags["true-object.silt"] = true;
        return enact(next, { relicId: relicId(1), kind: "restore" });
      } },
    ],
  },
  {
    id: "span",
    relicId: relicId(2),
    title: "The missing inch",
    lede: "The Unruler swaps one approved gap or one approved reach. The distance to the inquest door is not a puzzle and not a fight.",
    actions: [
      { id: "gap", label: "Swap the orchard gap", detail: "Approved puzzle span.", run: (world) => enact(world, { relicId: relicId(2), kind: "use", targetId: "span.gap" }) },
      { id: "reach", label: "Swap the bruiser's reach", detail: "Will fail if the gap's beat is still held.", run: (world) => enact(world, { relicId: relicId(2), kind: "use", targetId: "span.reach" }) },
      { id: "wait", label: "Let the beat pass", detail: "Advances time so the spatial lock expires.", run: (world) => ({ ok: true, code: "time", detail: "The measurement debt is still there. The beat is not.", world: advance(world, 1) }) },
      { id: "inquest", label: "Try the distance to the inquest", detail: "Not an approved span.", run: (world) => enact(world, { relicId: relicId(2), kind: "use", targetId: "span.inquest" }) },
      { id: "map", label: "Take the left-handed map and flip the switchback", detail: "Same spatial-rewrite group.", run: (world) => {
        const got = take(relicId(11))(world);
        if (!got.ok) return got;
        return enact(got.world, { relicId: relicId(11), kind: "mirror", targetId: "path.orchard" });
      } },
    ],
  },
  {
    id: "june",
    relicId: relicId(3),
    title: "Last June in glass",
    lede: "The meadow's lost afternoon is a specific chance, not a weather slot. Seal it, give it back unopened, or spend it.",
    actions: [
      { id: "seal", label: "Seal Last June", detail: "The meadow loses it.", run: (world) => enact(world, { relicId: relicId(3), kind: "seal", targetId: "env.last-june" }) },
      { id: "august", label: "Try to seal ordinary August in this jar", detail: "Wrong tag.", run: (world) => enact(world, { relicId: relicId(3), kind: "seal", targetId: "env.august" }) },
      { id: "return", label: "Return it unopened to the meadow", detail: "Restoration, not a use.", run: (world) => enact(world, { relicId: relicId(3), kind: "restore", extra: { atOrigin: true } }) },
      { id: "spend", label: "Seal it again and open it here", detail: "Spends the preserve as a short local window.", run: (world) => {
        const sealed = enact(world, { relicId: relicId(3), kind: "seal", targetId: "env.last-june" });
        if (!sealed.ok) return sealed;
        return enact(sealed.world, { relicId: relicId(3), kind: "release" });
      } },
      { id: "dawn", label: "Let the loose June end", detail: "Three ticks, then it is lost unless Junie witnessed it.", run: (world) => ({ ok: true, code: "time", detail: "Time takes the loose afternoon.", world: advance(world, 3) }) },
    ],
  },
  {
    id: "coat",
    relicId: relicId(4),
    title: "The chair it left",
    lede: "The coat answers one kind of death: a bounded blow that is not already written. A script, a protected ending, or a fall outside that band still kills.",
    actions: [
      { id: "wear", label: "Put the coat on", detail: "Mourning becomes visible.", run: (world) => enact(world, { relicId: relicId(4), kind: "wear" }) },
      { id: "nick", label: "Take a small cut", detail: "Not fatal.", run: (world) => resolveBlow(world, { amount: 2, source: "a splinter", scripted: false, protected: false, bounded: true }, RELICS) },
      { id: "knife", label: "Take the yard knife", detail: "Bounded, lethal, not scripted.", run: (world) => resolveBlow(world, { amount: 20, source: "the yard knife", scripted: false, protected: false, bounded: true }, RELICS) },
      { id: "script", label: "Meet the death the inquest already wrote", detail: "The coat does not bargain.", run: (world) => resolveBlow(world, { amount: 20, source: "the written death", scripted: true, protected: false, bounded: true }, RELICS) },
    ],
  },
  {
    id: "nave",
    relicId: relicId(5),
    title: "Under the nave bell",
    lede: "There is a second bell only where a second layer was authored. The inquest stair has a second ringing too, and it is not yours to open.",
    actions: [
      { id: "nave", label: "Ring the nave bell", detail: "Reveals the under-layer and hoarsens the upper.", run: (world) => enact(world, { relicId: relicId(5), kind: "ring", targetId: "sound.nave" }) },
      { id: "again", label: "Ring it again", detail: "Hoarse until it rests.", run: (world) => enact(world, { relicId: relicId(5), kind: "ring", targetId: "sound.nave" }) },
      { id: "secret", label: "Ring the inquest stair", detail: "Protected under-layer.", run: (world) => enact(world, { relicId: relicId(5), kind: "ring", targetId: "sound.secret" }) },
      { id: "rest", label: "Let the nave be quiet", detail: "Restores the upper bell.", run: (world) => enact(world, { relicId: relicId(5), kind: "rest", targetId: "sound.nave" }) },
    ],
  },
  {
    id: "survey",
    relicId: relicId(6),
    title: "Pencil, not a border",
    lede: "Calder's ring moves a surveyor's pencil mark one notch and smears another. The quarry gate is a different class of line.",
    actions: [
      { id: "orchard", label: "Shift the orchard pencil line", detail: "Survey-mark. Another line goes unreadable.", run: (world) => enact(world, { relicId: relicId(6), kind: "shift", targetId: "mark.orchard" }) },
      { id: "gate", label: "Try the quarry campaign gate", detail: "Wrong class.", run: (world) => enact(world, { relicId: relicId(6), kind: "shift", targetId: "gate.quarry" }) },
      { id: "border", label: "Try the region border", detail: "Wrong class.", run: (world) => enact(world, { relicId: relicId(6), kind: "shift", targetId: "border.region" }) },
      { id: "redraw", label: "Bring Calder's pencil and redraw the orchard", detail: "Acquires the stub if needed, then redraws.", run: (world) => {
        const owns = world.inventory.some((item) => item.relicId === relicId(16));
        const next = owns ? { ok: true, code: "held", detail: "The pencil is already in hand.", world } : take(relicId(16))(world);
        if (!next.ok) return next;
        return enact(next.world, { relicId: relicId(6), kind: "redraw", targetId: "mark.orchard" });
      } },
    ],
  },
  {
    id: "spoon",
    relicId: relicId(7),
    title: "One place past the living",
    lede: "The second spoon eats only for a guest the table was authored to miss. The ferry counter has no such place.",
    actions: [
      { id: "silt", label: "Eat for the winter lodger", detail: "Leaves his memory, and his hunger.", run: (world) => enact(world, { relicId: relicId(7), kind: "eat", targetId: "table.silt" }) },
      { id: "counter", label: "Try the ferry counter", detail: "No unrealized guest.", run: (world) => enact(world, { relicId: relicId(7), kind: "eat", targetId: "table.plain" }) },
      { id: "grace", label: "Say the unspoken grace", detail: "Clears the hunger and shortens the clue.", run: (world) => {
        const got = world.inventory.some((item) => item.relicId === relicId(51)) ? { ok: true, code: "held", detail: "The grace is already in hand.", world } : take(relicId(51))(world);
        if (!got.ok) return got;
        return enact(got.world, { relicId: relicId(51), kind: "pray", targetId: "table.silt" });
      } },
    ],
  },
  {
    id: "days",
    relicId: relicId(8),
    title: "Days that were not had",
    lede: "The ledger can spend Junie's unlived name-day. It cannot spend a birthday the campaign is keeping as a reward.",
    actions: [
      { id: "junie", label: "Open Junie's unlived name-day", detail: "The gift is spent forever.", run: (world) => enact(world, { relicId: relicId(8), kind: "open", targetId: "bday.unlived" }) },
      { id: "again", label: "Try to open it again", detail: "Already spent.", run: (world) => enact(world, { relicId: relicId(8), kind: "open", targetId: "bday.unlived" }) },
      { id: "sealed", label: "Try the sealed quest name-day", detail: "Protected.", run: (world) => enact(world, { relicId: relicId(8), kind: "open", targetId: "bday.sealed" }) },
    ],
  },
  {
    id: "window",
    relicId: relicId(9),
    title: "The sash in the wrong year",
    lede: "The north window will show 2012. It will not show the campaign's present. While it is open, Maeve cannot quite hear you.",
    actions: [
      { id: "look", label: "Look into 2012", detail: "The year he died.", run: (world) => enact(world, { relicId: relicId(9), kind: "look", targetId: "window.silt", extra: { year: 2012 } }) },
      { id: "speak", label: "Speak to Maeve", detail: "Present speech.", run: (world) => speak(world, "maeve") },
      { id: "future", label: "Try to look into 2026", detail: "A protected year.", run: (world) => enact(world, { relicId: relicId(9), kind: "look", targetId: "window.silt", extra: { year: 2026 } }) },
      { id: "close", label: "Close the window", detail: "The mouth comes back.", run: (world) => enact(world, { relicId: relicId(9), kind: "close", targetId: "window.silt" }) },
    ],
  },
  {
    id: "ash",
    relicId: relicId(10),
    title: "A name the yard did not cut",
    lede: "The ash will ask one unprotected unspoken grave. The inquest's dead stay sealed. Afterward you cannot say your own name, and the inquest does not fail for that.",
    actions: [
      { id: "ask", label: "Ask the unspoken Pell grave", detail: "One answer. The pile is spent.", run: (world) => enact(world, { relicId: relicId(10), kind: "ask", targetId: "grave.unspoken" }) },
      { id: "sealed", label: "Ask the inquest's grave", detail: "Protected.", run: (world) => enact(world, { relicId: relicId(10), kind: "ask", targetId: "grave.sealed" }) },
      { id: "name", label: "Try to introduce yourself to Maeve", detail: "The quest waits. It does not fail.", run: (world) => speak(world, "maeve") },
      { id: "dawn", label: "Wait for dawn", detail: "The name returns.", run: (world) => ({ ok: true, code: "time", detail: "Dawn.", world: advance(world, 1) }) },
    ],
  },
  {
    id: "map",
    relicId: relicId(11),
    title: "The wrong hand",
    lede: "The map flips the orchard switchback, which is mirror-safe. The quarry processional is a campaign road. Your hands stay wrong until you fold the crease.",
    actions: [
      { id: "orchard", label: "Mirror the orchard switchback", detail: "Hands flip with it.", run: (world) => enact(world, { relicId: relicId(11), kind: "mirror", targetId: "path.orchard" }) },
      { id: "road", label: "Try the quarry processional", detail: "Not mirror-safe.", run: (world) => enact(world, { relicId: relicId(11), kind: "mirror", targetId: "path.campaign" }) },
      { id: "fold", label: "Fold it on the crease", detail: "Hands return.", run: (world) => enact(world, { relicId: relicId(11), kind: "fold" }) },
    ],
  },
  {
    id: "cup",
    relicId: relicId(12),
    title: "The spring under the quarry",
    lede: "One drink hears the unrealized winter in the shed. Refilling costs a memory. The oath you owe the inquest is not a memory the cup may drink.",
    actions: [
      { id: "drink", label: "Drink", detail: "The shed-laugh, once.", run: (world) => enact(world, { relicId: relicId(12), kind: "drink" }) },
      { id: "oath", label: "Try to refill by forgetting the inquest oath", detail: "Protected memory, at the spring.", run: (world) => {
        const next = structuredClone(world);
        next.flags["at.spring"] = true;
        return enact(next, { relicId: relicId(12), kind: "refill", extra: { journalId: "journal.oath" } });
      } },
      { id: "morning", label: "Refill by forgetting a ferry morning", detail: "Unprotected journal.", run: (world) => {
        const next = structuredClone(world);
        next.flags["at.spring"] = true;
        return enact(next, { relicId: relicId(12), kind: "refill", extra: { journalId: "journal.morning" } });
      } },
    ],
  },
];

export function startVignette(vignette: Vignette): World {
  const world = createBench();
  world.sceneId = `vignette.${vignette.id}`;
  const got = acquire(world, RELICS.find((entry) => entry.id === vignette.relicId)!);
  if (!got.ok) throw new Error(got.detail);
  return got.world;
}
