import { definitionOrThrow, isKnownDef } from "./catalog.ts";
import { InheritanceError } from "./errors.ts";
import { eraIndexForYear, fnv1a, returnYearAfter } from "./eras.ts";
import type {
  Condition,
  ConsumedSource,
  InstanceStatus,
  ItemInstance,
  NpcRecord,
  Ownership,
  PendingTxn,
  Placement,
  PlayerStorage,
  QuestBinding,
  RenewalPolicy,
  ReturnReport,
  SiteLossPolicy,
  SiteRecord,
  TitleKind,
  WorldState,
} from "./types.ts";
import { PLAYER_ID } from "./types.ts";

export interface ClaimInput {
  defId: string;
  sourceKey: string;
  sourceKind: ItemInstance["worldSource"]["sourceKind"];
  year: number;
  instanceId?: string;
  qty?: number;
  condition?: Condition;
  storyId?: string | null;
  owner?: Ownership;
  storage?: PlayerStorage;
  placement?: Placement;
  questBinding?: QuestBinding | null;
  extensions?: Record<string, unknown>;
  /** Legacy rows may use a `legacy:` source key and an unknown definition. */
  imported?: boolean;
}

export function draft<T>(value: T): T {
  return structuredClone(value);
}

export function createWorld(year = 0): WorldState {
  if (!Number.isInteger(year) || year < 0) {
    throw new InheritanceError("bad-year", "A world cannot begin before year 0.");
  }
  return {
    calendarYear: year,
    life: { lifeIndex: 0, bornYear: year, deathYear: null, returnYear: null },
    lives: [],
    nextSerial: 1,
    instances: {},
    consumedSources: [],
    renewalLedger: [],
    sites: {},
    npcs: {},
  };
}

export function advanceTo(world: WorldState, year: number): WorldState {
  if (!Number.isInteger(year) || year < world.calendarYear) {
    throw new InheritanceError(
      "bad-year",
      `Cannot move the calendar from ${world.calendarYear} back to ${String(year)}.`,
    );
  }
  if (year === world.calendarYear) return world;
  const next = draft(world);
  next.calendarYear = year;
  return next;
}

export function getInstance(world: WorldState, instanceId: string): ItemInstance {
  const found = world.instances[instanceId];
  if (!found) {
    throw new InheritanceError("missing-instance", `No instance ${instanceId}.`);
  }
  return found;
}

export function listInstances(world: WorldState): ItemInstance[] {
  return Object.values(world.instances).sort((a, b) => a.instanceId.localeCompare(b.instanceId));
}

export function playerOwnership(year: number, title: TitleKind = "personal"): Ownership {
  return { ownerKind: "player", ownerId: PLAYER_ID, title, sinceYear: year };
}

export function ensureNpc(
  world: WorldState,
  npc: {
    npcId: string;
    name: string;
    lineageId: string;
    generation: number;
    successorId: string | null;
  },
): WorldState {
  const existing = world.npcs[npc.npcId];
  if (existing) return world;
  const next = draft(world);
  next.npcs[npc.npcId] = {
    ...npc,
    alive: true,
    diedYear: null,
  };
  return next;
}

export function ensureSite(
  world: WorldState,
  site: { siteId: string; name: string; lossPolicy?: SiteLossPolicy },
): WorldState {
  if (world.sites[site.siteId]) return world;
  const next = draft(world);
  const record: SiteRecord = {
    siteId: site.siteId,
    name: site.name,
    status: "standing",
    eraBuilt: eraIndexForYear(world.calendarYear),
    vanishedYear: null,
    lossPolicy: site.lossPolicy ?? "recover-to-storage",
  };
  next.sites[site.siteId] = record;
  return next;
}

export function claim(world: WorldState, input: ClaimInput): WorldState {
  if (input.year !== world.calendarYear) {
    throw new InheritanceError(
      "bad-year",
      `Claim at year ${input.year} but the calendar is ${world.calendarYear}. Advance time first.`,
    );
  }
  const imported = input.imported === true;
  const known = isKnownDef(input.defId);
  if (!known && !imported) {
    throw new InheritanceError("unknown-def", `No definition for ${input.defId}.`);
  }
  const def = known ? definitionOrThrow(input.defId) : null;
  const policy = resolvePolicy(def, input.sourceKey, imported, input.qty ?? 1);
  assertSourceShape(policy, input.sourceKey, imported, Boolean(def?.lineageKeys?.includes(input.sourceKey)));

  const qty = input.qty ?? 1;
  if (!Number.isInteger(qty) || qty < 1) {
    throw new InheritanceError("bad-qty", "Quantity must be a whole number of at least 1.");
  }
  if (def && !def.stackable && qty !== 1) {
    throw new InheritanceError("bad-qty", `${def.name} is not a stack.`);
  }

  if (policy === "renewable-common" && input.sourceKey.startsWith("node:")) {
    const era = eraIndexForYear(input.year);
    const minted = world.renewalLedger.filter(
      (entry) => entry.sourceKey === input.sourceKey && entry.eraIndex === era,
    ).length;
    const max = def?.renewal?.maxPerEra ?? 1;
    if (minted >= max) {
      throw new InheritanceError(
        "era-cap",
        `${input.sourceKey} already yielded in era ${era}. A later era may yield a new common instance; this one does not reset on death.`,
      );
    }
    for (const inst of Object.values(world.instances)) {
      if (inst.worldSource.sourceKey !== input.sourceKey) continue;
      if (inst.worldSource.renewalPolicy !== "renewable-common" || inst.era.historical || inst.storyId) {
        throw new InheritanceError(
          "heirloom-duplication",
          `Refusing to let ${input.sourceKey} mint over an heirloom or historically marked instance.`,
        );
      }
    }
  } else if (isConsumed(world, input.sourceKey)) {
    throw new InheritanceError(
      "source-consumed",
      `${input.sourceKey} was already claimed. Dying does not restore it.`,
    );
  }

  const instanceId = input.instanceId ?? `inst:${fnv1a(input.sourceKey)}:${world.nextSerial}`;
  if (world.instances[instanceId]) {
    throw new InheritanceError("duplicate-instance", `Instance id ${instanceId} is already in the world.`);
  }

  const condition = input.condition ?? "sound";
  const questBinding = input.questBinding ?? null;
  const owner =
    input.owner ??
    playerOwnership(input.year, questBinding?.state === "bound" ? "quest-bound" : "personal");
  if (questBinding?.state === "bound") {
    if (owner.ownerId !== PLAYER_ID || owner.title !== "quest-bound") {
      throw new InheritanceError("quest-bound", "A bound quest object stays in Ellis's custody.");
    }
  }
  const storage =
    input.storage ??
    (owner.ownerId === PLAYER_ID
      ? { location: "carried" as const, containerId: "pack" }
      : { location: "none" as const, containerId: null });
  const placement = input.placement ?? { kind: "none" as const, siteId: null, siteEra: null };
  assertHold(owner, storage, placement, "active", questBinding);
  if (placement.siteId && !world.sites[placement.siteId] && !placement.siteId.startsWith("cache:")) {
    throw new InheritanceError("site-missing", `Site ${placement.siteId} is not in the world.`);
  }

  const instance: ItemInstance = {
    instanceId,
    defId: input.defId,
    qty,
    worldSource: {
      sourceKind: input.sourceKind,
      sourceKey: input.sourceKey,
      eraBorn: eraIndexForYear(input.year),
      yearBorn: input.year,
      renewalPolicy: policy,
      ...(imported ? { imported: true } : {}),
    },
    ownership: owner,
    storage,
    placement,
    condition,
    status: "active",
    restoration: [
      {
        atYear: input.year,
        byId: "world",
        action: "note",
        note: imported ? "Lifted from an older save without dropping the row." : "Entered the record.",
        conditionBefore: condition,
        conditionAfter: condition,
      },
    ],
    era: {
      boundEra: eraIndexForYear(input.year),
      originLife: world.life.lifeIndex,
      recognizedInEras: [],
      historical: false,
    },
    storyId: input.storyId ?? null,
    questBinding,
    pendingTxn: null,
    ...(input.extensions && Object.keys(input.extensions).length ? { extensions: input.extensions } : {}),
  };

  const next = draft(world);
  next.nextSerial += 1;
  next.instances[instanceId] = instance;
  if (policy === "renewable-common" && input.sourceKey.startsWith("node:")) {
    next.renewalLedger.push({
      sourceKey: input.sourceKey,
      eraIndex: eraIndexForYear(input.year),
      lifeIndex: world.life.lifeIndex,
      year: input.year,
      instanceId,
    });
  } else {
    const consumed: ConsumedSource = {
      sourceKey: input.sourceKey,
      consumedYear: input.year,
      instanceId,
      policy,
    };
    next.consumedSources.push(consumed);
  }
  return next;
}

export function setCustody(
  world: WorldState,
  instanceId: string,
  storage: PlayerStorage,
  placement: Placement,
  year: number,
  note: string,
): WorldState {
  const inst = activePlayer(world, instanceId);
  refusePending(inst);
  if (year !== world.calendarYear) {
    throw new InheritanceError("bad-year", "Custody changes happen in the current year.");
  }
  assertHold(inst.ownership, storage, placement, "active", inst.questBinding);
  if (placement.siteId && !world.sites[placement.siteId]) {
    throw new InheritanceError("site-missing", `Site ${placement.siteId} is not in the world.`);
  }
  const next = draft(world);
  const row = next.instances[instanceId]!;
  row.storage = storage;
  row.placement = placement;
  pushHistory(row, year, PLAYER_ID, "relocate", note, row.condition, row.condition);
  return next;
}

export function donate(
  world: WorldState,
  instanceId: string,
  toId: string,
  year: number,
  siteId?: string | null,
): WorldState {
  return give(
    world,
    instanceId,
    toId,
    "npc",
    "donated",
    year,
    siteId ?? null,
    `Donated to ${toId}. The same instance leaves Ellis's custody.`,
  );
}

export function inheritItem(
  world: WorldState,
  instanceId: string,
  heirId: string,
  heirKind: Ownership["ownerKind"],
  year: number,
  note: string,
  siteId?: string | null,
): WorldState {
  return give(world, instanceId, heirId, heirKind, "stewardship", year, siteId ?? null, note);
}

export function restoreItem(world: WorldState, instanceId: string, year: number, byId: string, note: string): WorldState {
  const inst = getInstance(world, instanceId);
  if (inst.status !== "active") {
    throw new InheritanceError("closed", `${instanceId} is closed and cannot be restored into a new object.`);
  }
  refusePending(inst);
  if (year !== world.calendarYear) throw new InheritanceError("bad-year", "Restoration happens in the current year.");
  if (inst.condition === "consumed") {
    throw new InheritanceError("closed", "A consumed object is not repaired by minting another.");
  }
  const next = draft(world);
  const row = next.instances[instanceId]!;
  const before = row.condition;
  row.condition = "restored";
  pushHistory(row, year, byId, "restore", note, before, "restored");
  return next;
}

export function recognize(world: WorldState, instanceId: string, year: number, byId: string, note: string): WorldState {
  const inst = getInstance(world, instanceId);
  if (inst.status !== "active") throw new InheritanceError("closed", `${instanceId} is not active.`);
  if (year !== world.calendarYear) throw new InheritanceError("bad-year", "Recognition happens in the current year.");
  const era = eraIndexForYear(year);
  const next = draft(world);
  const row = next.instances[instanceId]!;
  if (!row.era.recognizedInEras.includes(era)) row.era.recognizedInEras.push(era);
  pushHistory(row, year, byId, "recognize", note, row.condition, row.condition);
  return next;
}

export function markHistorical(world: WorldState, instanceId: string, year: number, byId: string, note: string): WorldState {
  const inst = getInstance(world, instanceId);
  if (inst.status !== "active") throw new InheritanceError("closed", `${instanceId} is not active.`);
  if (inst.era.historical) {
    throw new InheritanceError("already-historical", `${instanceId} is already historically marked. No second copy is made.`);
  }
  if (year !== world.calendarYear) throw new InheritanceError("bad-year", "Historical marking happens in the current year.");
  const next = draft(world);
  const row = next.instances[instanceId]!;
  const before = row.condition;
  row.condition = "historical";
  row.era.historical = true;
  pushHistory(row, year, byId, "historical-mark", note, before, "historical");
  return next;
}

export function takeUp(world: WorldState, instanceId: string, year: number): WorldState {
  const inst = getInstance(world, instanceId);
  if (inst.status !== "active") throw new InheritanceError("closed", `${instanceId} cannot be taken up.`);
  if (inst.ownership.ownerKind !== "unowned") {
    throw new InheritanceError("not-unowned", `${instanceId} already has an owner. Taking it up would duplicate custody.`);
  }
  if (year !== world.calendarYear) throw new InheritanceError("bad-year", "Taking an object up happens in the current year.");
  const next = draft(world);
  const row = next.instances[instanceId]!;
  row.ownership = playerOwnership(year, "personal");
  row.storage = { location: "carried", containerId: "pack" };
  row.placement = { kind: "none", siteId: null, siteEra: null };
  pushHistory(
    row,
    year,
    PLAYER_ID,
    "transfer",
    "Taken up from where the world left it. Same instance; the source stays consumed.",
    row.condition,
    row.condition,
  );
  return next;
}

export function killNpc(world: WorldState, npcId: string, year: number): WorldState {
  const npc = world.npcs[npcId];
  if (!npc) throw new InheritanceError("npc-missing", `No NPC ${npcId}.`);
  if (!npc.alive) throw new InheritanceError("npc-dead", `${npc.name} has already died.`);
  if (year !== world.calendarYear) throw new InheritanceError("bad-year", "A death is recorded in the current year.");
  const next = draft(world);
  next.npcs[npcId] = { ...npc, alive: false, diedYear: year };
  return next;
}

export function resolveSuccessions(
  world: WorldState,
  year: number,
): { world: WorldState; transfers: { instanceId: string; fromId: string; toId: string }[] } {
  const next = draft(world);
  const transfers: { instanceId: string; fromId: string; toId: string }[] = [];
  for (const row of Object.values(next.instances)) {
    if (row.status !== "active" || row.ownership.ownerKind !== "npc") continue;
    const holder = next.npcs[row.ownership.ownerId];
    if (!holder || holder.alive) continue;
    const heir = livingHeir(next, holder);
    const fromId = row.ownership.ownerId;
    if (heir) {
      row.ownership = {
        ownerKind: "npc",
        ownerId: heir.npcId,
        title: row.ownership.title,
        sinceYear: year,
      };
      pushHistory(
        row,
        year,
        heir.npcId,
        "transfer",
        `${holder.name} is gone. ${heir.name} keeps the same ${row.instanceId}; nothing is minted for the new generation.`,
        row.condition,
        row.condition,
      );
      transfers.push({ instanceId: row.instanceId, fromId, toId: heir.npcId });
    } else {
      const historicalId = `historical:${holder.lineageId}`;
      row.ownership = {
        ownerKind: "historical",
        ownerId: historicalId,
        title: "historical-record",
        sinceYear: year,
      };
      row.storage = { location: "none", containerId: null };
      pushHistory(
        row,
        year,
        historicalId,
        "transfer",
        `${holder.name}'s line has no living successor. The object remains on the record as ${historicalId} and is not deleted.`,
        row.condition,
        row.condition,
      );
      transfers.push({ instanceId: row.instanceId, fromId, toId: historicalId });
    }
  }
  return { world: next, transfers };
}

export function vanishSite(
  world: WorldState,
  siteId: string,
  year: number,
): { world: WorldState; recoveries: { instanceId: string; siteId: string; policy: SiteLossPolicy }[] } {
  const site = world.sites[siteId];
  if (!site) throw new InheritanceError("site-missing", `No site ${siteId}.`);
  if (site.status === "vanished") {
    return sweepVanishedSites(world, year);
  }
  if (year < world.calendarYear) throw new InheritanceError("bad-year", "A site cannot vanish in the past.");
  const dated = year === world.calendarYear ? world : advanceTo(world, year);
  const next = draft(dated);
  next.sites[siteId] = { ...site, status: "vanished", vanishedYear: year };
  return sweepVanishedSites(next, year);
}

export function sweepVanishedSites(
  world: WorldState,
  year: number,
): { world: WorldState; recoveries: { instanceId: string; siteId: string; policy: SiteLossPolicy }[] } {
  const next = draft(world);
  const recoveries: { instanceId: string; siteId: string; policy: SiteLossPolicy }[] = [];
  for (const site of Object.values(next.sites)) {
    if (site.status !== "vanished") continue;
    for (const row of Object.values(next.instances)) {
      if (row.status !== "active" || row.placement.siteId !== site.siteId) continue;
      applySiteLoss(next, row, site, year);
      recoveries.push({ instanceId: row.instanceId, siteId: site.siteId, policy: site.lossPolicy });
    }
  }
  return { world: next, recoveries };
}

export function beginTransaction(
  world: WorldState,
  instanceId: string,
  kind: PendingTxn["kind"],
  counterpartyId: string,
  year: number,
  siteId?: string | null,
): WorldState {
  if (year !== world.calendarYear) {
    throw new InheritanceError("bad-year", "A transaction opens in the current year.");
  }
  const inst = activePlayer(world, instanceId);
  refusePending(inst);
  if (inst.questBinding?.state === "bound" && kind !== "quest-handoff") {
    throw new InheritanceError("quest-bound", `${instanceId} is quest-bound and cannot be ${kind}ed.`);
  }
  if (kind === "dismantle") assertDismantleable(inst);
  if (kind === "sell" || kind === "donate") assertCounterparty(world, counterpartyId);
  const next = draft(world);
  const row = next.instances[instanceId]!;
  row.pendingTxn = {
    txnId: `txn:${fnv1a(`${instanceId}:${kind}:${year}:${world.nextSerial}`)}`,
    kind,
    startedYear: year,
    counterpartyId,
    siteId: siteId ?? null,
    snapshot: {
      ownership: draft(row.ownership),
      storage: draft(row.storage),
      placement: draft(row.placement),
      status: row.status,
      condition: row.condition,
      questBinding: row.questBinding ? draft(row.questBinding) : null,
    },
  };
  next.nextSerial += 1;
  return next;
}

export function commitTransaction(world: WorldState, instanceId: string, year: number): WorldState {
  if (year !== world.calendarYear) throw new InheritanceError("bad-year", "A commit happens in the current year.");
  const inst = getInstance(world, instanceId);
  if (!inst.pendingTxn) throw new InheritanceError("no-pending", `${instanceId} has no open transaction.`);
  const pending = inst.pendingTxn;
  if (pending.kind === "dismantle") assertDismantleable(inst);
  if (pending.kind === "sell" || pending.kind === "donate") assertCounterparty(world, pending.counterpartyId);

  const next = draft(world);
  const row = next.instances[instanceId]!;
  const kind = row.pendingTxn!.kind;
  row.pendingTxn = null;

  if (kind === "sell") {
    row.ownership = {
      ownerKind: ownerKindFor(pending.counterpartyId),
      ownerId: pending.counterpartyId,
      title: "sold",
      sinceYear: year,
    };
    row.storage = { location: "none", containerId: null };
    row.placement = { kind: "none", siteId: null, siteEra: null };
    pushHistory(row, year, pending.counterpartyId, "commit", "Sale committed. The object is not returned by a later death.", row.condition, row.condition);
    return next;
  }

  if (kind === "donate") {
    row.ownership = {
      ownerKind: ownerKindFor(pending.counterpartyId),
      ownerId: pending.counterpartyId,
      title: "donated",
      sinceYear: year,
    };
    row.storage = { location: "none", containerId: null };
    row.placement = pending.siteId
      ? { kind: "installed", siteId: pending.siteId, siteEra: eraIndexForYear(year) }
      : { kind: "none", siteId: null, siteEra: null };
    pushHistory(row, year, pending.counterpartyId, "commit", "Donation committed.", row.condition, row.condition);
    return next;
  }

  if (kind === "quest-handoff") {
    row.questBinding = row.questBinding ? { ...row.questBinding, state: "released" } : null;
    if (row.ownership.title === "quest-bound") {
      row.ownership = { ...row.ownership, title: "personal", sinceYear: year };
    }
    pushHistory(row, year, PLAYER_ID, "commit", "Quest binding released.", row.condition, row.condition);
    return next;
  }

  const before = row.condition;
  row.status = "consumed";
  row.condition = "consumed";
  row.storage = { location: "none", containerId: null };
  row.placement = { kind: "none", siteId: null, siteEra: null };
  pushHistory(
    row,
    year,
    PLAYER_ID,
    "consume",
    "Dismantle committed. Materials are new common instances; this instance id stays closed.",
    before,
    "consumed",
  );
  const def = definitionOrThrow(row.defId);
  let built = next;
  for (const yieldRow of def.dismantleYield ?? []) {
    built = claim(built, {
      defId: yieldRow.defId,
      qty: yieldRow.qty,
      sourceKey: `common:dismantle:${instanceId}:${yieldRow.defId}`,
      sourceKind: "craft",
      year,
      storage: { location: "stored", containerId: "pack" },
      storyId: null,
    });
  }
  return built;
}

export function abortTransaction(world: WorldState, instanceId: string, year: number, reason: string): WorldState {
  const inst = getInstance(world, instanceId);
  if (!inst.pendingTxn) throw new InheritanceError("no-pending", `${instanceId} has no open transaction.`);
  const next = draft(world);
  const row = next.instances[instanceId]!;
  const snap = row.pendingTxn!.snapshot;
  const kind = row.pendingTxn!.kind;
  row.ownership = draft(snap.ownership);
  row.storage = draft(snap.storage);
  row.placement = draft(snap.placement);
  row.status = snap.status;
  row.condition = snap.condition;
  row.questBinding = snap.questBinding ? draft(snap.questBinding) : null;
  row.pendingTxn = null;
  pushHistory(row, year, PLAYER_ID, "abort", `Unfinished ${kind} aborted: ${reason}`, row.condition, row.condition);
  return next;
}

export function abortAllTransactions(
  world: WorldState,
  year: number,
  reason: string,
): { world: WorldState; aborted: { instanceId: string; txnId: string; kind: PendingTxn["kind"] }[] } {
  let next = world;
  const aborted: { instanceId: string; txnId: string; kind: PendingTxn["kind"] }[] = [];
  for (const inst of listInstances(world)) {
    if (!inst.pendingTxn) continue;
    aborted.push({ instanceId: inst.instanceId, txnId: inst.pendingTxn.txnId, kind: inst.pendingTxn.kind });
    next = abortTransaction(next, inst.instanceId, year, reason);
  }
  return { world: next, aborted };
}

export function stackCommons(world: WorldState, intoId: string, fromId: string, year: number): WorldState {
  if (intoId === fromId) throw new InheritanceError("bad-stack", "An instance cannot stack into itself.");
  const into = getInstance(world, intoId);
  const from = getInstance(world, fromId);
  if (year !== world.calendarYear) throw new InheritanceError("bad-year", "Stacking happens in the current year.");
  for (const row of [into, from]) {
    if (row.status !== "active") throw new InheritanceError("closed", `${row.instanceId} is not active.`);
    refusePending(row);
    if (row.worldSource.renewalPolicy !== "renewable-common" || row.era.historical || row.storyId || row.questBinding) {
      throw new InheritanceError(
        "heirloom-duplication",
        `${row.instanceId} is not an ordinary common and cannot be folded into another stack.`,
      );
    }
  }
  if (into.defId !== from.defId) throw new InheritanceError("bad-stack", "Only the same definition stacks.");
  if (into.ownership.ownerId !== from.ownership.ownerId) {
    throw new InheritanceError("bad-stack", "Stacks stay inside one owner's custody.");
  }
  const moved = from.qty;
  const next = draft(world);
  const target = next.instances[intoId]!;
  const source = next.instances[fromId]!;
  target.qty += moved;
  source.qty = 0;
  source.status = "closed";
  source.storage = { location: "none", containerId: null };
  source.placement = { kind: "none", siteId: null, siteEra: null };
  pushHistory(target, year, into.ownership.ownerId, "note", `Received ${moved} from ${fromId}.`, target.condition, target.condition);
  pushHistory(source, year, from.ownership.ownerId, "note", `Quantity moved into ${intoId}. The instance id remains closed, not deleted.`, source.condition, source.condition);
  return next;
}

export function reincarnate(world: WorldState, deathYear: number): { world: WorldState; report: ReturnReport } {
  if (world.life.deathYear !== null) {
    throw new InheritanceError("already-dead", "This life has already ended. Open the return before dying again.");
  }
  if (!Number.isInteger(deathYear) || deathYear < world.calendarYear || deathYear < world.life.bornYear) {
    throw new InheritanceError(
      "bad-year",
      `Death year ${String(deathYear)} cannot precede the calendar (${world.calendarYear}) or this life's birth (${world.life.bornYear}).`,
    );
  }
  const atDeath = deathYear === world.calendarYear ? world : advanceTo(world, deathYear);
  const abortedPass = abortAllTransactions(
    atDeath,
    deathYear,
    "the life ended before the transaction committed",
  );
  const succession = resolveSuccessions(abortedPass.world, deathYear);
  const swept = sweepVanishedSites(succession.world, deathYear);
  const next = draft(swept.world);
  const completed = {
    lifeIndex: next.life.lifeIndex,
    bornYear: next.life.bornYear,
    deathYear,
    returnYear: returnYearAfter(deathYear),
  };
  next.lives = [...next.lives, completed];
  next.life = {
    lifeIndex: completed.lifeIndex + 1,
    bornYear: completed.returnYear!,
    deathYear: null,
    returnYear: null,
  };
  next.calendarYear = completed.returnYear!;

  const keptPlayerInstanceIds = listInstances(next)
    .filter((inst) => inst.status === "active" && inst.ownership.ownerId === PLAYER_ID && inst.storage.location !== "none")
    .map((inst) => inst.instanceId);

  const born = completed.returnYear!;
  const report: ReturnReport = {
    deathYear,
    returnYear: born,
    fromLife: completed.lifeIndex,
    toLife: next.life.lifeIndex,
    eraIndex: eraIndexForYear(born),
    principalEra: [0, 14, 28, 42, 56, 70].includes(eraIndexForYear(born) * 14),
    corpseRecoveryRequired: false,
    erasedInstanceIds: [],
    aborted: abortedPass.aborted,
    keptPlayerInstanceIds,
    successionTransfers: succession.transfers,
    siteRecoveries: swept.recoveries,
    notes: [
      "Carried, stored, and displayed property stayed with Ellis. Nothing was left on a corpse.",
      "No condition or quantity was reduced because years passed.",
      "Consumed unique sources stay consumed.",
    ],
  };
  return { world: next, report };
}

export function addNote(world: WorldState, instanceId: string, year: number, byId: string, note: string): WorldState {
  const inst = getInstance(world, instanceId);
  if (inst.status !== "active") throw new InheritanceError("closed", `${instanceId} is not active.`);
  if (year !== world.calendarYear) throw new InheritanceError("bad-year", "Notes are written in the current year.");
  const next = draft(world);
  const row = next.instances[instanceId]!;
  pushHistory(row, year, byId, "note", note, row.condition, row.condition);
  return next;
}

function give(
  world: WorldState,
  instanceId: string,
  toId: string,
  heirKind: Ownership["ownerKind"],
  title: TitleKind,
  year: number,
  siteId: string | null,
  note: string,
): WorldState {
  if (year !== world.calendarYear) throw new InheritanceError("bad-year", "A transfer happens in the current year.");
  const inst = activePlayer(world, instanceId);
  refusePending(inst);
  if (inst.questBinding?.state === "bound") {
    throw new InheritanceError("quest-bound", `${instanceId} is quest-bound and cannot be given away.`);
  }
  const ownerKind = heirKind === "npc" || heirKind === "institution" ? heirKind : ownerKindFor(toId);
  if (ownerKind === "npc") {
    const npc = world.npcs[toId];
    if (!npc) throw new InheritanceError("npc-missing", `No NPC ${toId}.`);
    if (!npc.alive) throw new InheritanceError("npc-dead", `${npc.name} cannot receive property.`);
  }
  if (siteId && !world.sites[siteId]) throw new InheritanceError("site-missing", `Site ${siteId} is not in the world.`);
  const next = draft(world);
  const row = next.instances[instanceId]!;
  row.ownership = { ownerKind, ownerId: toId, title, sinceYear: year };
  row.storage = { location: "none", containerId: null };
  row.placement = siteId
    ? { kind: "installed", siteId, siteEra: eraIndexForYear(year) }
    : { kind: "none", siteId: null, siteEra: null };
  pushHistory(row, year, toId, "transfer", note, row.condition, row.condition);
  return next;
}

function applySiteLoss(world: WorldState, row: ItemInstance, site: SiteRecord, year: number): void {
  const beforeSite = site.siteId;
  if (site.lossPolicy === "recover-to-storage" && row.ownership.ownerId === PLAYER_ID) {
    row.storage = { location: "stored", containerId: `recovery:${site.siteId}` };
    row.placement = { kind: "none", siteId: null, siteEra: null };
    pushHistory(
      row,
      year,
      PLAYER_ID,
      "relocate",
      `${site.name} is gone. ${row.instanceId} was put back into Ellis's storage. It was not deleted and does not have to be looted from a ruin.`,
      row.condition,
      row.condition,
    );
    return;
  }
  if (site.lossPolicy === "displace-to-cache") {
    const cacheId = `cache:${beforeSite}`;
    row.ownership = {
      ownerKind: "unowned",
      ownerId: `unowned:${beforeSite}`,
      title: "abandoned",
      sinceYear: year,
    };
    row.storage = { location: "none", containerId: null };
    row.placement = { kind: "placed-in-world", siteId: cacheId, siteEra: eraIndexForYear(year) };
    pushHistory(
      row,
      year,
      "world",
      "relocate",
      `Authored consequence: ${site.name} fell, and this same instance lies in ${cacheId}. It was not replaced and not erased.`,
      row.condition,
      row.condition,
    );
    return;
  }
  row.placement = { kind: "none", siteId: null, siteEra: null };
  pushHistory(
    row,
    year,
    row.ownership.ownerId,
    "relocate",
    `${site.name} vanished. The holder kept ${row.instanceId}.`,
    row.condition,
    row.condition,
  );
}

function livingHeir(world: WorldState, dead: NpcRecord): NpcRecord | null {
  const seen = new Set<string>([dead.npcId]);
  let cursor = dead.successorId ? world.npcs[dead.successorId] : undefined;
  while (cursor && !seen.has(cursor.npcId)) {
    if (cursor.alive) return cursor;
    seen.add(cursor.npcId);
    cursor = cursor.successorId ? world.npcs[cursor.successorId] : undefined;
  }
  return null;
}

function resolvePolicy(
  def: ReturnType<typeof definitionOrThrow> | null,
  sourceKey: string,
  imported: boolean,
  qty: number,
): RenewalPolicy {
  if (def?.lineageKeys?.includes(sourceKey)) return "heirloom-lineage";
  if (def) return def.renewalPolicy;
  if (!imported) {
    throw new InheritanceError("unknown-def", "Unknown definitions are only allowed on legacy import.");
  }
  return qty > 1 ? "renewable-common" : "heirloom-lineage";
}

function assertSourceShape(policy: RenewalPolicy, sourceKey: string, imported: boolean, lineageKey: boolean): void {
  if (imported && sourceKey.startsWith("legacy:")) return;
  if (policy === "renewable-common") {
    if (!sourceKey.startsWith("node:") && !sourceKey.startsWith("common:")) {
      throw new InheritanceError(
        "bad-source",
        "Renewable commons use a node: key (once an era) or a common: key (one batch). Heirloom keys are refused.",
      );
    }
    if (lineageKey) {
      throw new InheritanceError("heirloom-duplication", "A lineage key cannot be gathered as a common.");
    }
    return;
  }
  if (sourceKey.startsWith("node:") || sourceKey.startsWith("common:")) {
    throw new InheritanceError(
      "heirloom-duplication",
      "Unique, heirloom, and quest objects are not minted from common nodes.",
    );
  }
}

function isConsumed(world: WorldState, sourceKey: string): boolean {
  return world.consumedSources.some((entry) => entry.sourceKey === sourceKey);
}

function assertHold(
  owner: Ownership,
  storage: PlayerStorage,
  placement: Placement,
  status: InstanceStatus,
  quest: QuestBinding | null,
): void {
  if (status !== "active") {
    if (storage.location !== "none") {
      throw new InheritanceError("custody", "A closed instance is not in player storage.");
    }
    return;
  }
  const player = owner.ownerId === PLAYER_ID && owner.ownerKind === "player";
  if (player && owner.title !== "sold") {
    if (storage.location === "none") {
      throw new InheritanceError("custody", "Player property stays carried, stored, or displayed. It is not dropped.");
    }
  } else if (storage.location !== "none") {
    throw new InheritanceError("custody", "Only Ellis's active property occupies player storage.");
  }
  if (quest?.state === "bound" && (!player || owner.title !== "quest-bound")) {
    throw new InheritanceError("quest-bound", "Quest-bound objects stay with Ellis under a quest title.");
  }
  if (storage.location === "displayed") {
    if (placement.kind !== "displayed" || !placement.siteId) {
      throw new InheritanceError("custody", "Displayed custody needs a site placement.");
    }
  } else if (storage.location === "carried" || storage.location === "stored") {
    if (placement.kind !== "none") {
      throw new InheritanceError("custody", "Packed or stored objects are not also placed in a site.");
    }
  }
}

function activePlayer(world: WorldState, instanceId: string): ItemInstance {
  const inst = getInstance(world, instanceId);
  if (inst.status !== "active") throw new InheritanceError("closed", `${instanceId} is not active.`);
  if (inst.ownership.ownerId !== PLAYER_ID) {
    throw new InheritanceError("not-player-owned", `${instanceId} is not Ellis's to move.`);
  }
  return inst;
}

function refusePending(inst: ItemInstance): void {
  if (inst.pendingTxn) {
    throw new InheritanceError("pending-exists", `${inst.instanceId} has an unfinished ${inst.pendingTxn.kind}. Commit or abort it first.`);
  }
}

function assertDismantleable(inst: ItemInstance): void {
  if (inst.era.historical || inst.storyId || inst.questBinding) {
    throw new InheritanceError("heirloom-duplication", `${inst.instanceId} is storied, historical, or quest-bound and is not dismantled.`);
  }
  if (inst.worldSource.renewalPolicy !== "renewable-common") {
    throw new InheritanceError(
      "heirloom-duplication",
      "Only an ordinary common can be dismantled. Unique and heirloom instances stay whole.",
    );
  }
  const def = definitionOrThrow(inst.defId);
  if (!def.dismantleable || !def.dismantleYield?.length) {
    throw new InheritanceError("not-dismantleable", `${def.name} has no dismantle yield.`);
  }
}

function assertCounterparty(world: WorldState, counterpartyId: string): void {
  if (counterpartyId.startsWith("inst:")) return;
  const npc = world.npcs[counterpartyId];
  if (!npc) throw new InheritanceError("npc-missing", `No counterparty ${counterpartyId}.`);
  if (!npc.alive) throw new InheritanceError("npc-dead", `${npc.name} cannot complete a transaction.`);
}

function ownerKindFor(id: string): Ownership["ownerKind"] {
  if (id.startsWith("inst:")) return "institution";
  if (id.startsWith("npc:")) return "npc";
  if (id === PLAYER_ID) return "player";
  return "npc";
}

function pushHistory(
  row: ItemInstance,
  year: number,
  byId: string,
  action: ItemInstance["restoration"][number]["action"],
  note: string,
  before: Condition,
  after: Condition,
): void {
  row.restoration.push({
    atYear: year,
    byId,
    action,
    note,
    conditionBefore: before,
    conditionAfter: after,
  });
}
