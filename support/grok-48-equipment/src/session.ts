import { CATALOG, CHARGE_MAX, getItem, mustItem } from "./catalog.ts";
import { lootId } from "./ids.ts";
import { TOOL_IDS, type BodySlot, type EquipResult, type FormRef, type Session, type ToolId } from "./types.ts";

const SLOT_ORDER: BodySlot[] = ["mainHand", "head", "torso", "waist", "hands", "feet", "cloak", "trinket", "utility"];

export function cloneSession(session: Session): Session {
  return structuredClone(session);
}

export function equippedIds(session: Session): string[] {
  const ids: string[] = [];
  for (const slot of SLOT_ORDER) {
    const id = session.slots[slot];
    if (id) ids.push(id);
  }
  for (const tool of TOOL_IDS) {
    const id = session.attachments[tool];
    if (id) ids.push(id);
  }
  return ids;
}

export function ownsId(session: Session, id: string): boolean {
  return session.inventory.includes(id) || equippedIds(session).includes(id);
}

function allIds(session: Session): string[] {
  return [...equippedIds(session), ...session.inventory, ...session.lostAndFound];
}

export function createSession(): Session {
  const tools = Object.fromEntries(TOOL_IDS.map((id) => [id, true])) as Record<ToolId, boolean>;
  const charges: Record<string, number> = {};
  for (const [id, max] of Object.entries(CHARGE_MAX)) charges[id] = max;
  return {
    v: 2,
    slots: {},
    attachments: {},
    inventory: CATALOG.map((d) => d.id),
    lostAndFound: [],
    mods: {},
    charges,
    form: { id: "form.walker", tags: [] },
    suppressed: [],
    stowMemory: [],
    safeMark: null,
    x: 2,
    y: 2,
    flagX: null,
    flagY: null,
    storedProjectile: null,
    grainPin: null,
    warmthCharged: false,
    ashLiberated: false,
    lanternLocation: "carried",
    alive: true,
    tools,
    hasKey: false,
    compassDir: null,
    standingOnArmedFault: false,
  };
}

function blocks(id: string, slot: BodySlot, tags: Set<string>): boolean {
  const def = getItem(id);
  if (!def) return false;
  const list = id === lootId(30) && slot === "waist" ? def.suppressedBy.filter((t) => t !== "no-cloak") : def.suppressedBy;
  return list.some((t) => tags.has(t));
}

function refresh(session: Session): Session {
  const next = cloneSession(session);
  const tags = new Set(next.form.tags);
  if (next.slots.utility === lootId(112)) {
    const entries = SLOT_ORDER.map((slot) => [slot, next.slots[slot]] as const);
    for (const [slot, id] of entries) {
      if (!id || id === lootId(112)) continue;
      if (!blocks(id, slot, tags)) continue;
      delete next.slots[slot];
      if (!next.inventory.includes(id)) next.inventory.push(id);
      if (!next.stowMemory.includes(id)) next.stowMemory.push(id);
    }
  }
  const suppressed: string[] = [];
  for (const slot of SLOT_ORDER) {
    const id = next.slots[slot];
    if (!id) continue;
    if (blocks(id, slot, tags)) suppressed.push(id);
  }
  next.suppressed = suppressed;
  return next;
}

function fail(session: Session, reason: string): EquipResult {
  return { ok: false, reason, session };
}

export function equip(session: Session, id: string): EquipResult {
  const def = getItem(id);
  if (!def) return fail(session, "unknown");
  if (equippedIds(session).includes(id)) return fail(session, "already-equipped");
  if (!session.inventory.includes(id)) return fail(session, "not-owned");

  let next = cloneSession(session);

  if (def.slot === "attachment") {
    const tool = def.attachesTo;
    if (!tool) return fail(session, "not-a-slot");
    const prev = next.attachments[tool];
    if (prev) {
      delete next.attachments[tool];
      if (!next.inventory.includes(prev)) next.inventory.push(prev);
    }
    next.attachments[tool] = id;
    next.inventory = next.inventory.filter((x) => x !== id);
    return { ok: true, session: refresh(next) };
  }

  if (def.hands === 2 && next.slots.utility === lootId(119)) {
    return fail(session, "off-hand-reserved");
  }
  if (id === lootId(119)) {
    const main = next.slots.mainHand;
    if (main && mustItem(main).hands === 2) return fail(session, "off-hand-occupied-by-two-hand");
  }

  let slot: BodySlot = def.slot;
  if (id === lootId(30) && next.slots.trinket === lootId(71)) {
    slot = "waist";
  }
  if (id === lootId(71) && next.slots.cloak === lootId(30)) {
    const waist = next.slots.waist;
    if (waist) {
      delete next.slots.waist;
      if (!next.inventory.includes(waist)) next.inventory.push(waist);
    }
    next.slots.waist = lootId(30);
    delete next.slots.cloak;
  }

  const prev = next.slots[slot];
  if (prev && prev !== id) {
    delete next.slots[slot];
    if (!next.inventory.includes(prev)) next.inventory.push(prev);
  }
  next.slots[slot] = id;
  next.inventory = next.inventory.filter((x) => x !== id);
  next = refresh(next);
  return { ok: true, session: next };
}

export function unequip(session: Session, id: string): EquipResult {
  if (!equippedIds(session).includes(id)) return fail(session, "not-equipped");
  const next = cloneSession(session);
  for (const slot of SLOT_ORDER) {
    if (next.slots[slot] === id) delete next.slots[slot];
  }
  for (const tool of TOOL_IDS) {
    if (next.attachments[tool] === id) delete next.attachments[tool];
  }
  if (!next.inventory.includes(id)) next.inventory.push(id);
  if (id === lootId(71) && next.slots.waist === lootId(30) && !next.slots.cloak) {
    next.slots.cloak = lootId(30);
    delete next.slots.waist;
  }
  next.suppressed = next.suppressed.filter((x) => x !== id);
  return { ok: true, session: refresh(next) };
}

export function modify(session: Session, id: string, channel: string): EquipResult {
  const def = getItem(id);
  if (!def) return fail(session, "unknown");
  if (!def.channels.includes(channel)) return fail(session, "no-channel");
  if (!ownsId(session, id)) return fail(session, "not-owned");
  const next = cloneSession(session);
  next.mods[id] = channel;
  return { ok: true, session: next };
}

export function restoreMod(session: Session, id: string): Session {
  const next = cloneSession(session);
  delete next.mods[id];
  return next;
}

export function setForm(session: Session, form: FormRef): Session {
  const next = cloneSession(session);
  next.form = { id: form.id, tags: [...form.tags] };
  return refresh(next);
}

export function restoreStow(session: Session): Session {
  let next = cloneSession(session);
  const memory = [...next.stowMemory];
  next.stowMemory = [];
  for (const id of memory) {
    if (!next.inventory.includes(id)) continue;
    const trial = equip(next, id);
    next = trial.session;
  }
  return next;
}

export function onDeath(session: Session): Session {
  const next = cloneSession(session);
  next.alive = false;
  if (next.safeMark) next.safeMark = { ...next.safeMark, frozen: true };
  next.storedProjectile = null;
  const packet = next.slots.utility === lootId(120);
  if (!packet) {
    for (const slot of ["mainHand", "hands"] as const) {
      const id = next.slots[slot];
      if (!id) continue;
      delete next.slots[slot];
      if (!next.inventory.includes(id)) next.inventory.push(id);
    }
  }
  return refresh(next);
}

export function revive(session: Session): Session {
  const next = cloneSession(session);
  next.alive = true;
  return next;
}

export function setTool(session: Session, tool: ToolId, on: boolean): Session {
  const next = cloneSession(session);
  next.tools[tool] = on;
  if (tool === "tool.lantern.body") {
    next.lanternLocation = on ? (next.lanternLocation === "staked" ? "staked" : "carried") : "absent";
  }
  return next;
}

export function setTools(session: Session, on: boolean): Session {
  let next = session;
  for (const tool of TOOL_IDS) next = setTool(next, tool, on);
  return next;
}

export function setKey(session: Session, hasKey: boolean): Session {
  const next = cloneSession(session);
  next.hasKey = hasKey;
  return next;
}

export function moveBy(session: Session, dx: number, dy: number): Session {
  const next = cloneSession(session);
  next.x = Math.max(0, Math.min(7, next.x + dx));
  next.y = Math.max(0, Math.min(5, next.y + dy));
  return next;
}

export function applyPreset(indexes: number[]): Session {
  let session = createSession();
  for (const n of indexes) {
    const result = equip(session, lootId(n));
    if (result.ok) session = result.session;
  }
  return session;
}

function emptyKit(): Session {
  const session = createSession();
  session.inventory = [];
  return session;
}

function rememberCharge(session: Session, id: string, incoming: unknown, fillMax: boolean): void {
  const max = CHARGE_MAX[id];
  if (max == null) return;
  if (typeof incoming === "number" && Number.isFinite(incoming)) {
    session.charges[id] = Math.max(0, Math.min(max, incoming));
    return;
  }
  if (fillMax) session.charges[id] = max;
}

export function migrate(raw: unknown): Session {
  if (!raw || typeof raw !== "object") return createSession();
  const data = raw as Record<string, unknown>;
  if (data.v === 2 || data.v === 1) return loadStructured(data, data.v === 1);
  const ids = Array.isArray(data.ids) ? data.ids : Array.isArray(data.items) ? data.items : null;
  if (!ids) return createSession();
  return loadFlat(ids);
}

function loadFlat(ids: unknown[]): Session {
  let session = emptyKit();
  const seen = new Set<string>();
  for (const rawId of ids) {
    if (typeof rawId !== "string" || seen.has(rawId)) continue;
    seen.add(rawId);
    const def = getItem(rawId);
    if (!def) {
      session.lostAndFound.push(rawId);
      continue;
    }
    session.inventory.push(rawId);
    rememberCharge(session, rawId, undefined, true);
    session = placeIfFree(session, rawId);
  }
  return refresh(session);
}

function placeIfFree(session: Session, id: string): Session {
  const def = mustItem(id);
  const next = cloneSession(session);
  if (def.slot === "attachment" && def.attachesTo) {
    if (next.attachments[def.attachesTo]) return next;
    next.attachments[def.attachesTo] = id;
    next.inventory = next.inventory.filter((x) => x !== id);
    return next;
  }
  if (def.slot === "attachment") return next;
  const slot = def.slot;
  if (next.slots[slot]) return next;
  if (def.hands === 2 && next.slots.utility === lootId(119)) return next;
  if (id === lootId(119)) {
    const main = next.slots.mainHand;
    if (main && mustItem(main).hands === 2) return next;
  }
  next.slots[slot] = id;
  next.inventory = next.inventory.filter((x) => x !== id);
  return next;
}

function loadStructured(data: Record<string, unknown>, fillCharges: boolean): Session {
  const session = emptyKit();
  const seen = new Set<string>();
  const slots = data.slots && typeof data.slots === "object" ? (data.slots as Record<string, unknown>) : {};
  for (const slot of SLOT_ORDER) {
    const id = slots[slot];
    if (typeof id !== "string" || seen.has(id)) continue;
    const def = getItem(id);
    if (!def) {
      seen.add(id);
      session.lostAndFound.push(id);
      continue;
    }
    if (def.slot === "attachment") continue;
    if (def.hands === 2 && session.slots.utility === lootId(119)) {
      seen.add(id);
      session.inventory.push(id);
      continue;
    }
    const target: BodySlot = id === lootId(30) && slot === "waist" ? "waist" : def.slot;
    if (target !== slot) continue;
    seen.add(id);
    session.slots[slot] = id;
  }
  if (session.slots.utility === lootId(119)) {
    const main = session.slots.mainHand;
    if (main && (getItem(main)?.hands ?? 0) === 2) {
      delete session.slots.mainHand;
      session.inventory.push(main);
    }
  }
  const attachments = data.attachments && typeof data.attachments === "object" ? (data.attachments as Record<string, unknown>) : {};
  for (const tool of TOOL_IDS) {
    const id = attachments[tool];
    if (typeof id !== "string" || seen.has(id)) continue;
    const def = getItem(id);
    if (!def || def.attachesTo !== tool) {
      if (typeof id === "string" && !getItem(id)) session.lostAndFound.push(id);
      continue;
    }
    seen.add(id);
    session.attachments[tool] = id;
  }
  const inventory = Array.isArray(data.inventory) ? data.inventory : [];
  for (const id of inventory) {
    if (typeof id !== "string" || seen.has(id)) continue;
    seen.add(id);
    const def = getItem(id);
    if (!def) session.lostAndFound.push(id);
    else session.inventory.push(id);
  }
  const lost = Array.isArray(data.lostAndFound) ? data.lostAndFound : [];
  for (const id of lost) {
    if (typeof id !== "string" || seen.has(id)) continue;
    seen.add(id);
    session.lostAndFound.push(id);
  }
  const charges = data.charges && typeof data.charges === "object" ? (data.charges as Record<string, unknown>) : {};
  for (const id of [...equippedIds(session), ...session.inventory]) {
    rememberCharge(session, id, charges[id], fillCharges || charges[id] == null);
  }
  const mods = data.mods && typeof data.mods === "object" ? (data.mods as Record<string, unknown>) : {};
  for (const [id, channel] of Object.entries(mods)) {
    const def = getItem(id);
    if (!def || typeof channel !== "string" || !def.channels.includes(channel)) continue;
    if (!ownsId(session, id)) continue;
    session.mods[id] = channel;
  }
  if (data.safeMark && typeof data.safeMark === "object") {
    const mark = data.safeMark as Record<string, unknown>;
    if (typeof mark.x === "number" && typeof mark.y === "number") {
      session.safeMark = { x: mark.x, y: mark.y, frozen: mark.frozen === true };
    }
  }
  if (data.form && typeof data.form === "object") {
    const form = data.form as Record<string, unknown>;
    if (typeof form.id === "string" && Array.isArray(form.tags)) {
      session.form = { id: form.id, tags: form.tags.filter((t): t is string => typeof t === "string") };
    }
  }
  if (typeof data.x === "number") session.x = data.x;
  if (typeof data.y === "number") session.y = data.y;
  if (typeof data.flagX === "number") session.flagX = data.flagX;
  if (typeof data.flagY === "number") session.flagY = data.flagY;
  if (typeof data.grainPin === "string") session.grainPin = data.grainPin;
  if (data.warmthCharged === true) session.warmthCharged = true;
  if (data.ashLiberated === true) session.ashLiberated = true;
  if (data.alive === false) session.alive = false;
  if (data.hasKey === true) session.hasKey = true;
  if (data.lanternLocation === "staked" || data.lanternLocation === "absent" || data.lanternLocation === "carried") {
    session.lanternLocation = data.lanternLocation;
  }
  if (data.storedProjectile && typeof data.storedProjectile === "object") {
    const tag = (data.storedProjectile as { tag?: unknown }).tag;
    if (typeof tag === "string") session.storedProjectile = { tag };
  }
  if (Array.isArray(data.stowMemory)) {
    session.stowMemory = data.stowMemory.filter((id): id is string => typeof id === "string" && !!getItem(id) && session.inventory.includes(id));
  }
  if (data.tools && typeof data.tools === "object") {
    const tools = data.tools as Record<string, unknown>;
    for (const tool of TOOL_IDS) {
      if (typeof tools[tool] === "boolean") session.tools[tool] = tools[tool];
    }
  }
  if (!session.tools["tool.lantern.body"]) session.lanternLocation = "absent";
  return refresh(session);
}

export function serialize(session: Session): string {
  return JSON.stringify(session);
}

export function countCopies(session: Session, id: string): number {
  return allIds(session).filter((x) => x === id).length;
}
