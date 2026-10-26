import type { RelicId } from "./ids.ts";
import type { Actor, World } from "./types.ts";

export function actor(): Actor {
  return {
    id: "ellis",
    name: "Ellis Voss",
    hp: 8,
    hpMax: 8,
    alive: true,
    cannotSayOwnName: false,
    handsMirrored: false,
    foreignHunger: false,
    mourningVisible: false,
    outOfYear: null,
    fatigue: 0,
    recognized: 0,
    veinDebt: false,
    lost: false,
    clumsy: false,
    ageShown: 29,
    weaponsBlocked: false,
    ateOwnRationsBlocked: false,
    truthfulWithMaeve: false,
    official: false,
  };
}

export function benchWorld(relics: { id: RelicId; sourceId: string }[]): World {
  const sources: World["sources"] = {};
  for (const relic of relics) {
    sources[relic.sourceId] = { relicId: relic.id, available: true, consumed: false };
  }
  return {
    tick: 0,
    region: "marrow-crossing",
    sceneId: "bench",
    actor: actor(),
    inventory: [],
    placed: [],
    veinBank: [],
    sources,
    doors: [
      { id: "door.silt", kind: "remembered-homestead", homesteadId: "silt-lane", label: "Silt Lane as Maeve remembers it", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.pell", kind: "remembered-homestead", homesteadId: "pell-kitchen", label: "Pell kitchen, the evening he did not propose", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.ferry-loft", kind: "remembered-homestead", homesteadId: "ferry-loft", label: "Ferry loft with the lamp still low", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.hart", kind: "remembered-homestead", homesteadId: "hart-porch", label: "Hart porch before Junie was born", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.shed", kind: "remembered-homestead", homesteadId: "calder-shed", label: "Calder's shed, pencil smell", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.fourth", kind: "remembered-homestead", homesteadId: "room.fourth-window", label: "The fourth window, a room the house never grew", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.mill", kind: "mundane-lock", homesteadId: "", label: "Mill padlock", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.quarry", kind: "campaign-gate", homesteadId: "", label: "Quarry seal", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.drawer", kind: "drawer", homesteadId: "silt-lane", label: "Maeve's unswept drawer", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.hesitation", kind: "hesitation", homesteadId: "", label: "Yard gate where his boot stopped", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.burned", kind: "burned-memory", homesteadId: "north-cottage", label: "North cottage that burned", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.undertaker", kind: "mundane-lock", homesteadId: "", label: "Undertaker's cold-room door", locked: true, witnessed: 0, refused: false, braced: false },
      { id: "door.county", kind: "county-line", homesteadId: "", label: "County line beyond the last ferry post", locked: true, witnessed: 0, refused: false, braced: false },
    ],
    boundaries: [
      { id: "mark.orchard", class: "survey-mark", label: "Orchard pencil line", notch: 2, originNotch: 2, readable: true, frozen: false, marked: false, protected: false },
      { id: "mark.lane", class: "survey-mark", label: "Lane pencil line", notch: 4, originNotch: 4, readable: true, frozen: false, marked: false, protected: false },
      { id: "mark.shed", class: "survey-mark", label: "Shed pencil line", notch: 1, originNotch: 1, readable: true, frozen: false, marked: false, protected: false },
      { id: "gate.quarry", class: "campaign-gate", label: "Quarry campaign gate", notch: 0, originNotch: 0, readable: true, frozen: false, marked: false, protected: true },
      { id: "border.region", class: "region-border", label: "Crossing region border", notch: 0, originNotch: 0, readable: true, frozen: false, marked: false, protected: true },
      { id: "lock.inquest", class: "quest-lock", label: "Inquest threshold", notch: 0, originNotch: 0, readable: true, frozen: false, marked: false, protected: true },
    ],
    spatial: [
      { id: "span.gap", label: "Gap between the two orchard stones", approved: true, context: "puzzle", a: 6, b: 2, swapped: false, temporary: false },
      { id: "span.reach", label: "Reach between Ellis and the ferry-yard bruiser", approved: true, context: "combat", a: 1, b: 4, swapped: false, temporary: false },
      { id: "span.inquest", label: "Distance to the inquest door", approved: false, context: "quest", a: 9, b: 9, swapped: false, temporary: false },
    ],
    opportunities: [
      { id: "env.last-june", tag: "last-june", siteId: "meadow.junie", description: "The June afternoon the town lost: fireflies early, cut grass, no funeral weather.", available: true, sealedIn: "", lost: false, localTicks: 0, pendingLoss: false },
      { id: "env.august", tag: "ordinary-august", siteId: "field.upper", description: "An ordinary August: wasps, dry grass, shirts stuck to chairs.", available: true, sealedIn: "", lost: false, localTicks: 0, pendingLoss: false },
      { id: "env.fog", tag: "crossing-fog", siteId: "ferry.dock", description: "Crossing fog thick enough to hide the next piling.", available: true, sealedIn: "", lost: false, localTicks: 0, pendingLoss: false },
      { id: "env.leak", tag: "roof-leak", siteId: "attic.silt", description: "One rain that finds the attic beam and darkens a carved initial.", available: true, sealedIn: "", lost: false, localTicks: 0, pendingLoss: false },
      { id: "env.dawn", tag: "dawn-timed", siteId: "silt-lane", description: "The dawn Ellis would have planed the sash.", available: true, sealedIn: "", lost: false, localTicks: 0, pendingLoss: false },
      { id: "env.bank", tag: "bank-weather", siteId: "bank.opposite", description: "Weather that belonged to the far bank and not this one.", available: true, sealedIn: "", lost: false, localTicks: 0, pendingLoss: false },
    ],
    sounds: [
      { id: "sound.nave", label: "Nave bell", layer0: "The public bell, a little flat, calling nothing in particular.", under: "Under it, a second bell: the ferry left early, and someone still waiting was Ellis.", underProtected: false, revealed: false, hoarse: false, silenced: false },
      { id: "sound.secret", label: "Inquest stair", layer0: "Shoes on stone.", under: "The protected verdict the quest must speak for itself.", underProtected: true, revealed: false, hoarse: false, silenced: false },
    ],
    tables: [
      { id: "table.silt", label: "Silt Lane table", guest: "the winter lodger who never arrived", memory: "He would have fixed the north sash and eaten standing up.", clue: "The lodger's bundle is under the third tread, wrapped in oilcloth.", seated: false, crumb: false },
      { id: "table.plain", label: "Ferry counter", guest: "", memory: "", clue: "", seated: false, crumb: false },
    ],
    birthdays: [
      { id: "bday.unlived", who: "Junie Hart's unlived name-day", gift: "A whistle in the key of the meadow.", spent: false, protected: false },
      { id: "bday.ringer", who: "the nave ringer's uncelebrated name-day", gift: "A heel of bread left on the bell stand, still warm in the memory.", spent: false, protected: false },
      { id: "bday.sealed", who: "A quest-reward name-day", gift: "The campaign gift, which is not this ledger's to spend.", spent: false, protected: true },
    ],
    windows: [
      { id: "window.silt", label: "North window, Silt Lane", approvedYears: [2010, 2011, 2012], protectedYears: [2026], openYear: null },
    ],
    graves: [
      { id: "grave.unspoken", name: "a Pell child never entered in the book", unspoken: true, answer: "They would have been called Lowen, and they would have hated the ferry horn.", protected: false, asked: false },
      { id: "grave.sealed", name: "the inquest's dead", unspoken: true, answer: "Sealed by the inquest.", protected: true, asked: false },
    ],
    paths: [
      { id: "path.orchard", label: "Orchard switchback", mirrorSafe: true, facing: "left" },
      { id: "path.campaign", label: "Quarry processional", mirrorSafe: false, facing: "left" },
    ],
    journal: [
      { id: "journal.morning", text: "A morning on the ferry Ellis remembers owning.", protected: false, forgotten: false },
      { id: "journal.oath", text: "The oath he owes the inquest.", protected: true, forgotten: false },
    ],
    quests: [
      { id: "quest.inquest", protected: true, status: "active", note: "The county still needs a death that will stay dead." },
      { id: "quest.ione-choice", protected: true, status: "active", note: "Ione's choice is hers." },
      { id: "quest.finale", protected: true, status: "active", note: "The crossing is not finished." },
      { id: "quest.bell-secret", protected: true, status: "active", note: "The nave's true secret belongs to the quest, not the bell." },
      { id: "quest.sermon", protected: false, status: "active", note: "The preacher still means to give the sermon." },
    ],
    people: [
      { id: "maeve", name: "Maeve Voss", present: true, closed: false, resentment: 0, protectedAccuser: false, petty: "She still hides the good jam behind the bad jam." },
      { id: "ione", name: "Ione Pell", present: true, closed: false, resentment: 0, protectedAccuser: false, petty: "She kept his coat because throwing it out felt like a second funeral." },
      { id: "junie", name: "Junie Hart", present: true, closed: false, resentment: 0, protectedAccuser: false, petty: "She tells the meadow secrets and not her mother." },
      { id: "clerk", name: "Records clerk", present: true, closed: false, resentment: 0, protectedAccuser: false, petty: "He files the living and the dead in the same drawer when he is tired." },
      { id: "judge", name: "Inquest judge", present: true, closed: false, resentment: 0, protectedAccuser: true, petty: "" },
      { id: "neighbor", name: "Ada Pell's neighbor", present: true, closed: false, resentment: 0, protectedAccuser: false, petty: "She waters a plant that died in May so the window will not look empty." },
      { id: "undertaker", name: "Undertaker", present: true, closed: false, resentment: 0, protectedAccuser: false, petty: "He ironed the coffin invoice twice." },
      { id: "preacher", name: "Preacher", present: true, closed: false, resentment: 0, protectedAccuser: false, petty: "He skips the third verse because he never learned it." },
      { id: "cousin", name: "Cousin Ruthe", present: true, closed: false, resentment: 0, protectedAccuser: false, petty: "She knows who carved the fox and has told nobody yet." },
      { id: "ferryman", name: "The ferryman who missed the handshake", present: true, closed: false, resentment: 1, protectedAccuser: false, petty: "He still sets out two mugs." },
      { id: "calder", name: "Calder Voss", present: false, closed: true, resentment: 0, protectedAccuser: false, petty: "" },
    ],
    timers: [
      { id: "timer.boat", label: "Evening boat", protected: false, paused: false, remaining: 3 },
      { id: "timer.finale", label: "Finale clock", protected: true, paused: false, remaining: 5 },
    ],
    objects: [
      { id: "obj.past-sash", label: "North sash, 2012", protected: false, uncertain: false },
      { id: "obj.present-cup", label: "Present chipped cup", protected: false, uncertain: false },
      { id: "obj.turnin", label: "Inquest exhibit", protected: true, uncertain: false },
      { id: "obj.button", label: "Coat button", protected: false, uncertain: false },
    ],
    links: [],
    documents: [
      { id: "doc.notice", label: "Ellis's death notice", protected: false, stamped: false, ruined: false },
      { id: "doc.inquest", label: "Inquest warrant", protected: true, stamped: false, ruined: false },
    ],
    waters: [
      { id: "water.orchard", label: "Flooded orchard row", campaign: false },
      { id: "water.campaign", label: "Campaign river gate", campaign: true },
    ],
    climbs: [{ id: "climb.quarry", label: "Quarry face", revealedHolds: 0, blinded: false }],
    caches: [{ id: "cache.yard", label: "Oilcloth bundle under the third tread", found: false }],
    inscriptions: [{ id: "insc.attic", text: "E.V. planed this and did not finish.", revealed: false }],
    sentences: [
      { id: "line.quarrel", speaker: "Ellis", text: "I'll be back before the sash swells.", alternate: "I might not come back. Don't keep the key on the nail.", protected: false, revised: false },
      { id: "line.canon", speaker: "Ione", text: "The quest's canon line, behind glass.", alternate: "A replacement the vein is not allowed to write.", protected: true, revised: false },
    ],
    flags: {
      "papers.deathBlock": true,
    },
    lineage: [],
    log: [],
    death: null,
    locks: [],
  };
}

export function findInstance(world: World, relicId: RelicId) {
  return (
    world.inventory.find((item) => item.relicId === relicId) ??
    world.placed.find((place) => place.instance.relicId === relicId)?.instance ??
    world.veinBank.find((item) => item.relicId === relicId)
  );
}

export function holding(world: World, relicId: RelicId) {
  return world.inventory.find((item) => item.relicId === relicId);
}

export function person(world: World, id: string) {
  return world.people.find((entry) => entry.id === id);
}

export function flagNum(world: World, key: string): number {
  const value = world.flags[key];
  return typeof value === "number" ? value : 0;
}
