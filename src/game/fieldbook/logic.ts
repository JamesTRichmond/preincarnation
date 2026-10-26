import { componentDef, objectDef, projectDef } from "./catalog.ts";
import type {
  Action,
  AllocationLine,
  Analysis,
  Catalog,
  ComponentView,
  DispatchResult,
  GoalStatus,
  Inspection,
  InventoryDelta,
  InventorySnapshot,
  NeededBy,
  ProjectTrack,
  ProjectView,
  Requirement,
  SourceDef,
  TrackingContext,
} from "./types.ts";

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

export function countNoun(n: number, singular: string, plural: string): string {
  const w = n >= 0 && n <= 12 ? WORDS[n] : String(n);
  return `${w} ${n === 1 ? singular : plural}`;
}

export function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function qty(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function ownedQty(inventory: InventorySnapshot, componentId: string): number {
  return inventory.loose
    .filter((s) => s.componentId === componentId)
    .reduce((sum, s) => sum + s.quantity, 0);
}

function optionsOf(req: Requirement): { componentId: string; quantity: number }[] {
  return [
    { componentId: req.componentId, quantity: req.quantity },
    ...(req.substitutes ?? []).map((s) => ({ componentId: s.componentId, quantity: s.quantity })),
  ];
}

export function requirementsFor(catalog: Catalog, track: ProjectTrack): Requirement[] {
  if (track.requirementsOverride) return track.requirementsOverride;
  return projectDef(catalog, track.projectId)?.requirements ?? [];
}

function reservedOf(ledgerProjects: ProjectTrack[], componentId: string, exceptProjectId?: string): number {
  let n = 0;
  for (const project of ledgerProjects) {
    if (project.status !== "active") continue;
    if (project.projectId === exceptProjectId) continue;
    for (const line of Object.values(project.progress)) {
      if (line.componentId === componentId) n += line.reserved;
    }
  }
  return n;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function addLoose(deltas: InventoryDelta[], componentId: string, quantity: number, reason: string) {
  if (quantity <= 0) return;
  deltas.push({ op: "add-loose", componentId, quantity, reason });
}

function removeLoose(deltas: InventoryDelta[], componentId: string, quantity: number, reason: string) {
  if (quantity <= 0) return;
  deltas.push({ op: "remove-loose", componentId, quantity, reason });
}

export function applyInventoryDeltas(inventory: InventorySnapshot, deltas: InventoryDelta[]): InventorySnapshot {
  const loose = inventory.loose.map((s) => ({ ...s }));
  let objects = inventory.objects.map((o) => ({ ...o }));
  for (const delta of deltas) {
    if (delta.op === "add-loose") {
      const stack = loose.find((s) => s.componentId === delta.componentId);
      if (stack) stack.quantity += delta.quantity;
      else loose.push({ componentId: delta.componentId, quantity: delta.quantity });
    } else if (delta.op === "remove-loose") {
      const stack = loose.find((s) => s.componentId === delta.componentId);
      if (!stack || stack.quantity < delta.quantity) {
        throw new Error(`Inventory underflow for ${delta.componentId}`);
      }
      stack.quantity -= delta.quantity;
    } else if (delta.op === "remove-object") {
      objects = objects.filter((o) => o.instanceId !== delta.instanceId);
    }
  }
  return { loose: loose.filter((s) => s.quantity > 0), objects };
}

function remember(sources: SourceDef[], source: SourceDef): SourceDef[] {
  if (sources.some((s) => s.id === source.id)) return sources;
  return [...sources, source];
}

function chooseOption(
  req: Requirement,
  pool: Record<string, number>,
  progress: ProjectTrack["progress"][string] | undefined,
): { componentId: string; quantity: number; viaSubstitute: boolean } {
  const opts = optionsOf(req);
  if (progress && opts.some((o) => o.componentId === progress.componentId && (progress.consumed > 0 || progress.reserved > 0))) {
    const stuck = opts.find((o) => o.componentId === progress.componentId)!;
    return { ...stuck, viaSubstitute: stuck.componentId !== req.componentId };
  }
  let best = opts[0];
  let bestScore = -1;
  for (const opt of opts) {
    const score = Math.min(opt.quantity, pool[opt.componentId] ?? 0);
    if (score > bestScore) {
      best = opt;
      bestScore = score;
    }
  }
  return { ...best, viaSubstitute: best.componentId !== req.componentId };
}

export function analyze(catalog: Catalog, ctx: TrackingContext): Analysis {
  const { ledger, inventory } = ctx;
  const pool: Record<string, number> = {};
  for (const component of catalog.components) {
    const owned = ownedQty(inventory, component.id);
    const reserved = reservedOf(ledger.projects, component.id);
    const desire = ledger.desiredReserve[component.id] ?? 0;
    pool[component.id] = Math.max(0, owned - reserved - desire);
  }

  const tagged = ledger.projects
    .filter((p) => p.tagged && p.status === "active")
    .slice()
    .sort((a, b) => a.priority - b.priority || a.projectId.localeCompare(b.projectId));
  const taggedIds = new Set(tagged.map((p) => p.projectId));

  const lines: AllocationLine[] = [];

  const consider = ledger.projects.slice().sort((a, b) => {
    const at = taggedIds.has(a.projectId) ? a.priority : 1000 + a.priority;
    const bt = taggedIds.has(b.projectId) ? b.priority : 1000 + b.priority;
    return at - bt || a.projectId.localeCompare(b.projectId);
  });

  for (const track of consider) {
    if (track.status === "cancelled") continue;
    const def = projectDef(catalog, track.projectId);
    const reqs = requirementsFor(catalog, track);
    const claims = taggedIds.has(track.projectId);
    reqs.forEach((req, index) => {
      const progress = track.progress[String(index)];
      const chosen = chooseOption(req, claims ? pool : {}, progress);
      const same = progress?.componentId === chosen.componentId ? progress : undefined;
      const consumed = same?.consumed ?? 0;
      const reserved = same?.reserved ?? 0;
      const credit = consumed + reserved;
      const remaining = Math.max(0, chosen.quantity - credit);
      const take = claims ? Math.min(remaining, pool[chosen.componentId] ?? 0) : 0;
      if (claims) pool[chosen.componentId] = (pool[chosen.componentId] ?? 0) - take;
      lines.push({
        projectId: track.projectId,
        projectName: def?.name ?? track.projectId,
        requirementIndex: index,
        componentId: chosen.componentId,
        required: chosen.quantity,
        consumed,
        reserved,
        remaining,
        coveredByPool: take,
        short: remaining - take,
        viaSubstitute: chosen.viaSubstitute,
        tagged: track.tagged,
      });
    });
  }

  const statusOf = new Map<string, GoalStatus>();
  for (const track of ledger.projects) {
    if (track.status === "cancelled") {
      statusOf.set(track.projectId, "cancelled");
      continue;
    }
    const mine = lines.filter((l) => l.projectId === track.projectId);
    if (track.tagged && mine.length > 0 && mine.every((l) => l.short === 0)) {
      statusOf.set(track.projectId, "fulfilled");
    } else {
      statusOf.set(track.projectId, "open");
    }
  }

  const projects: ProjectView[] = catalog.projects.map((def) => {
    const track = ledger.projects.find((p) => p.projectId === def.id);
    const relicName = def.relicId ? catalog.relics.find((r) => r.id === def.relicId)?.name : undefined;
    return {
      id: def.id,
      name: def.name,
      kind: def.kind,
      provenance: def.provenance,
      relicId: def.relicId,
      relicName,
      note: def.note,
      tagged: track?.tagged ?? false,
      priority: track?.priority ?? 100,
      status: statusOf.get(def.id) ?? "open",
      lines: lines.filter((l) => l.projectId === def.id),
    };
  });

  const components: ComponentView[] = catalog.components.map((component) => {
    const owned = ownedQty(inventory, component.id);
    const reserved = reservedOf(ledger.projects, component.id);
    const desiredReserve = ledger.desiredReserve[component.id] ?? 0;
    const safelyAvailable = Math.max(0, owned - reserved - desiredReserve);
    const contained = inventory.objects.flatMap((instance) => {
      const object = objectDef(catalog, instance.objectId);
      if (!object) return [];
      const yieldLine = object.contains.find((c) => c.componentId === component.id);
      if (!yieldLine) return [];
      return [
        {
          instanceId: instance.instanceId,
          objectId: object.id,
          objectName: object.name,
          quantity: yieldLine.quantity,
          protected: object.protected,
          unique: object.unique,
          visibility: instance.visibility,
          locationLabel: instance.locationLabel,
          provenance: object.provenance,
        },
      ];
    });
    const knownSources = [...catalog.sources, ...ctx.runtimeSources]
      .filter((s) => s.discovered && s.componentId === component.id)
      .map((s) => ({ id: s.id, label: s.label, kind: s.kind }));

    const neededBy: NeededBy[] = [];
    for (const def of catalog.projects) {
      const track = ledger.projects.find((p) => p.projectId === def.id);
      if (!track || track.status === "cancelled") continue;
      const reqs = requirementsFor(catalog, track);
      reqs.forEach((req, index) => {
        const opts = optionsOf(req);
        if (!opts.some((o) => o.componentId === component.id)) return;
        const chosen = lines.find((l) => l.projectId === def.id && l.requirementIndex === index);
        const opt = opts.find((o) => o.componentId === component.id)!;
        const isChosen = chosen?.componentId === component.id;
        const progress = track.progress[String(index)];
        const role: NeededBy["role"] = isChosen
          ? "chosen"
          : component.id === req.componentId
            ? "primary-not-chosen"
            : "substitute";
        neededBy.push({
          projectId: def.id,
          projectName: def.name,
          kind: def.kind,
          tagged: track.tagged,
          status: statusOf.get(def.id) ?? "open",
          required: isChosen ? chosen.required : opt.quantity,
          consumed: isChosen ? chosen.consumed : progress?.componentId === component.id ? progress.consumed : 0,
          reserved: isChosen ? chosen.reserved : progress?.componentId === component.id ? progress.reserved : 0,
          remaining: isChosen ? chosen.remaining : opt.quantity,
          covered: isChosen ? chosen.coveredByPool : 0,
          short: isChosen ? chosen.short : opt.quantity,
          role,
          provenance: def.provenance,
        });
      });
    }

    return {
      id: component.id,
      name: component.name,
      singular: component.singular,
      plural: component.plural,
      provenance: component.provenance,
      owned,
      reserved,
      desiredReserve,
      safelyAvailable,
      tagged: Boolean(ledger.materialTags[component.id]),
      contained,
      knownSources,
      neededBy,
    };
  });

  const visibleObjects = inventory.objects.flatMap((instance) => {
    const object = objectDef(catalog, instance.objectId);
    if (!object) return [];
    return [
      {
        instanceId: instance.instanceId,
        name: object.name,
        visibility: instance.visibility,
        locationLabel: instance.locationLabel,
        protected: object.protected,
        unique: object.unique,
        provenance: object.provenance,
      },
    ];
  });

  return {
    integration: ledger.integration,
    integrationNote: catalog.integrationNote,
    components,
    projects,
    lines,
    visibleObjects,
  };
}

function findTrack(ctx: TrackingContext, projectId: string): ProjectTrack | undefined {
  return ctx.ledger.projects.find((p) => p.projectId === projectId);
}

function selectLine(
  reqs: Requirement[],
  progress: ProjectTrack["progress"],
  componentId: string,
): number | "none" | "committed-elsewhere" {
  const matches: number[] = [];
  reqs.forEach((req, index) => {
    if (optionsOf(req).some((o) => o.componentId === componentId)) matches.push(index);
  });
  if (!matches.length) return "none";
  for (const index of matches) {
    const line = progress[String(index)];
    if (line && line.componentId !== componentId && (line.consumed > 0 || line.reserved > 0)) continue;
    return index;
  }
  return "committed-elsewhere";
}

function untouched(ctx: TrackingContext, message: string): DispatchResult {
  return { ctx: structuredClone(ctx), deltas: [], messages: [message], refusal: message };
}

export function dispatch(catalog: Catalog, ctx: TrackingContext, action: Action): DispatchResult {
  if (action.type === "tag-material") {
    const next = structuredClone(ctx);
    if (!catalog.components.some((c) => c.id === action.componentId)) {
      return untouched(ctx, "That component is not in the catalog.");
    }
    next.ledger.materialTags[action.componentId] = action.tagged;
    const name = componentDef(catalog, action.componentId).name;
    return {
      ctx: next,
      deltas: [],
      messages: [action.tagged ? `Watching ${name}.` : `Stopped watching ${name}.`],
    };
  }

  if (action.type === "tag-project") {
    const next = structuredClone(ctx);
    const track = findTrack(next, action.projectId);
    const def = projectDef(catalog, action.projectId);
    if (!track || !def) return untouched(ctx, "That project is not in the catalog.");
    track.tagged = action.tagged;
    if (action.tagged) {
      if (track.status === "cancelled") track.status = "active";
      const used = next.ledger.projects.map((p) => p.priority);
      if (track.priority >= 100) track.priority = Math.max(0, ...used.filter((n) => n < 100)) + 1;
    }
    return {
      ctx: next,
      deltas: [],
      messages: [
        action.tagged
          ? `${def.name} is tagged. Shared stock will count toward it once.`
          : `${def.name} is no longer a goal. Stock already reserved stays until you release it.`,
      ],
    };
  }

  if (action.type === "set-desire") {
    const next = structuredClone(ctx);
    if (!catalog.components.some((c) => c.id === action.componentId)) {
      return untouched(ctx, "That component is not in the catalog.");
    }
    const amount = qty(action.quantity);
    next.ledger.desiredReserve[action.componentId] = amount;
    const messages = [`Keeper's reserve for ${componentDef(catalog, action.componentId).name} is ${amount}.`];
    let overflow =
      amount + reservedOf(next.ledger.projects, action.componentId) - ownedQty(next.inventory, action.componentId);
    if (overflow > 0) {
      const order = next.ledger.projects
        .filter((p) => p.status === "active")
        .slice()
        .sort((a, b) => b.priority - a.priority);
      for (const project of order) {
        if (overflow <= 0) break;
        for (const line of Object.values(project.progress)) {
          if (line.componentId !== action.componentId || line.reserved <= 0) continue;
          const cut = Math.min(line.reserved, overflow);
          line.reserved -= cut;
          overflow -= cut;
          messages.push("Released a reservation so the keeper's reserve still holds.");
        }
      }
    }
    return { ctx: next, deltas: [], messages };
  }

  if (action.type === "set-reservation") {
    const next = structuredClone(ctx);
    const track = findTrack(next, action.projectId);
    const def = projectDef(catalog, action.projectId);
    if (!track || !def) return untouched(ctx, "That project is not in the catalog.");
    if (track.status === "cancelled") return untouched(ctx, "Cancelled projects do not hold reservations.");
    const reqs = requirementsFor(catalog, track);
    const index = selectLine(reqs, track.progress, action.componentId);
    if (index === "none") return untouched(ctx, "That project does not take this component.");
    if (index === "committed-elsewhere") {
      return untouched(ctx, "That step is already committed to a substitute.");
    }
    const req = reqs[index];
    const opt = optionsOf(req).find((o) => o.componentId === action.componentId)!;
    const existing = track.progress[String(index)];
    const consumed = existing?.componentId === action.componentId ? existing.consumed : 0;
    const room = Math.max(0, opt.quantity - consumed);
    const others = reservedOf(next.ledger.projects, action.componentId, track.projectId);
    const desire = next.ledger.desiredReserve[action.componentId] ?? 0;
    const owned = ownedQty(next.inventory, action.componentId);
    const maxByStock = Math.max(0, owned - desire - others);
    const requested = qty(action.quantity);
    const nextReserved = Math.min(requested, room, maxByStock);
    if (nextReserved === 0 && requested > 0) {
      return untouched(ctx, "Nothing safe to reserve. The keeper's reserve and other projects already hold it.");
    }
    if (nextReserved === 0) {
      if (existing && existing.consumed === 0) delete track.progress[String(index)];
      else if (existing) existing.reserved = 0;
    } else {
      track.progress[String(index)] = { componentId: action.componentId, consumed, reserved: nextReserved };
    }
    const messages = [
      nextReserved < requested
        ? `Reserved ${nextReserved}. The rest would double-count stock or spend the keeper's reserve.`
        : `Reserved ${nextReserved} for ${def.name}.`,
    ];
    return { ctx: next, deltas: [], messages };
  }

  if (action.type === "craft-partial") {
    const next = structuredClone(ctx);
    const track = findTrack(next, action.projectId);
    const def = projectDef(catalog, action.projectId);
    if (!track || !def) return untouched(ctx, "That project is not in the catalog.");
    if (track.status === "cancelled") return untouched(ctx, "Cancelled projects cannot take materials.");
    if (qty(action.quantity) <= 0) return untouched(ctx, "Nothing to craft.");
    const reqs = requirementsFor(catalog, track);
    const index = selectLine(reqs, track.progress, action.componentId);
    if (index === "none") return untouched(ctx, "That project does not take this component.");
    if (index === "committed-elsewhere") {
      return untouched(ctx, "That step is already committed to a substitute.");
    }
    const opt = optionsOf(reqs[index]).find((o) => o.componentId === action.componentId)!;
    const existing = track.progress[String(index)];
    const consumed = existing?.componentId === action.componentId ? existing.consumed : 0;
    const reserved = existing?.componentId === action.componentId ? existing.reserved : 0;
    const room = Math.max(0, opt.quantity - consumed);
    const others = reservedOf(next.ledger.projects, action.componentId, track.projectId);
    const desire = action.eatReserve ? 0 : (next.ledger.desiredReserve[action.componentId] ?? 0);
    const owned = ownedQty(next.inventory, action.componentId);
    const maxTake = Math.max(0, Math.min(room, owned - desire - others));
    if (maxTake <= 0) {
      return untouched(
        ctx,
        action.eatReserve
          ? "Nothing left to craft into that project."
          : "That would spend the keeper's reserve or stock reserved for another project.",
      );
    }
    const take = Math.min(qty(action.quantity), maxTake);
    const nextReserved = Math.max(0, reserved - take);
    track.progress[String(index)] = {
      componentId: action.componentId,
      consumed: consumed + take,
      reserved: nextReserved,
    };
    const deltas: InventoryDelta[] = [];
    removeLoose(deltas, action.componentId, take, `Partial craft: ${def.name}`);
    const messages = [
      take < qty(action.quantity)
        ? `Crafted ${take}. Held back the keeper's reserve.`
        : `Crafted ${take} into ${def.name}.`,
    ];
    next.inventory = applyInventoryDeltas(next.inventory, deltas);
    return { ctx: next, deltas, messages };
  }

  if (action.type === "finish-covered") {
    const preview = analyze(catalog, ctx);
    const view = preview.projects.find((p) => p.id === action.projectId);
    const track0 = findTrack(ctx, action.projectId);
    if (!view || !track0) return untouched(ctx, "That project is not in the catalog.");
    if (track0.status === "cancelled") return untouched(ctx, "Cancelled projects cannot be finished.");
    if (view.status !== "fulfilled") {
      return untouched(ctx, "Covered stock does not finish this yet. The keeper's reserve is still held back.");
    }
    const next = structuredClone(ctx);
    const track = findTrack(next, action.projectId)!;
    const deltas: InventoryDelta[] = [];
    for (const line of view.lines) {
      const take = line.required - line.consumed;
      if (take <= 0) continue;
      removeLoose(deltas, line.componentId, take, `Finish: ${view.name}`);
      track.progress[String(line.requirementIndex)] = {
        componentId: line.componentId,
        consumed: line.required,
        reserved: 0,
      };
    }
    next.inventory = applyInventoryDeltas(next.inventory, deltas);
    return { ctx: next, deltas, messages: [`Finished ${view.name} from safe stock. The keeper's reserve stayed.`] };
  }

  if (action.type === "cancel-project") {
    const next = structuredClone(ctx);
    const track = findTrack(next, action.projectId);
    const def = projectDef(catalog, action.projectId);
    if (!track || !def) return untouched(ctx, "That project is not in the catalog.");
    const deltas: InventoryDelta[] = [];
    for (const line of Object.values(track.progress)) {
      addLoose(deltas, line.componentId, line.consumed, `Cancelled: ${def.name}`);
    }
    track.progress = {};
    track.status = "cancelled";
    track.tagged = false;
    next.inventory = applyInventoryDeltas(next.inventory, deltas);
    return {
      ctx: next,
      deltas,
      messages: [`Cancelled ${def.name}. Spent materials came back. Nothing protected was touched.`],
    };
  }

  if (action.type === "donate") {
    const next = structuredClone(ctx);
    if (!catalog.components.some((c) => c.id === action.componentId)) {
      return untouched(ctx, "That component is not in the catalog.");
    }
    const amount = qty(action.quantity);
    if (amount <= 0) return untouched(ctx, "A gift of nothing changes nothing.");
    const deltas: InventoryDelta[] = [];
    addLoose(deltas, action.componentId, amount, `Gift from ${action.from}`);
    next.inventory = applyInventoryDeltas(next.inventory, deltas);
    next.runtimeSources = remember(next.runtimeSources, {
      id: `gift:${slug(action.from)}:${action.componentId}`,
      componentId: action.componentId,
      label: `Gift from ${action.from}`,
      kind: "gift",
      discovered: true,
    });
    return {
      ctx: next,
      deltas,
      messages: [`${action.from} gave ${countNoun(amount, componentDef(catalog, action.componentId).singular, componentDef(catalog, action.componentId).plural)}.`],
    };
  }

  if (action.type === "death") {
    const next = structuredClone(ctx);
    const deltas: InventoryDelta[] = [];
    const dropped: string[] = [];
    for (const stack of next.inventory.loose) {
      const def = catalog.components.find((c) => c.id === stack.componentId);
      if (!def || def.persistsOnDeath || stack.quantity <= 0) continue;
      removeLoose(deltas, stack.componentId, stack.quantity, `Death at ${action.place}`);
      dropped.push(def.name);
      next.runtimeSources = remember(next.runtimeSources, {
        id: `body:${slug(action.place)}:${stack.componentId}`,
        componentId: stack.componentId,
        label: `Your body on ${action.place}`,
        kind: "body",
        discovered: true,
      });
    }
    for (const project of next.ledger.projects) {
      for (const line of Object.values(project.progress)) {
        const def = catalog.components.find((c) => c.id === line.componentId);
        if (def && !def.persistsOnDeath) line.reserved = 0;
      }
    }
    next.inventory = applyInventoryDeltas(next.inventory, deltas);
    return {
      ctx: next,
      deltas,
      messages: [
        dropped.length
          ? `Fourteen winters. Loose stock stays on ${action.place}: ${dropped.join(", ")}. Heirlooms stay with you. The keeper's reserve is remembered.`
          : `Fourteen winters. Nothing loose was left to the ground. Heirlooms stay with you.`,
      ],
    };
  }

  if (action.type === "salvage") {
    const instance = ctx.inventory.objects.find((o) => o.instanceId === action.instanceId);
    if (!instance) return untouched(ctx, "That object is not among the things you can see.");
    const object = objectDef(catalog, instance.objectId);
    if (!object) return untouched(ctx, "That object is not in the catalog.");
    if (object.protected) {
      const names = object.contains.map((c) => componentDef(catalog, c.componentId).name);
      return untouched(
        ctx,
        `${object.name} is a protected heirloom. Tagging ${joinAnd(names)} does not allow it to be destroyed.`,
      );
    }
    const next = structuredClone(ctx);
    const deltas: InventoryDelta[] = [{ op: "remove-object", instanceId: instance.instanceId, reason: `Salvage ${object.name}` }];
    for (const yieldLine of object.contains) {
      addLoose(deltas, yieldLine.componentId, yieldLine.quantity, `Salvage ${object.name}`);
      next.runtimeSources = remember(next.runtimeSources, {
        id: `salvage:${instance.instanceId}:${yieldLine.componentId}`,
        componentId: yieldLine.componentId,
        label: `Broken down: ${object.name}`,
        kind: "salvage",
        discovered: true,
      });
    }
    next.inventory = applyInventoryDeltas(next.inventory, deltas);
    return {
      ctx: next,
      deltas,
      messages: [`Broke down ${object.name}. ${inspectSentences(catalog, ctx, instance.instanceId).join(" ")}`.trim()],
    };
  }

  if (action.type === "change-recipe") {
    const next = structuredClone(ctx);
    const track = findTrack(next, action.projectId);
    const def = projectDef(catalog, action.projectId);
    if (!track || !def) return untouched(ctx, "That project is not in the catalog.");
    const requirements = action.requirements.map((req) => ({
      componentId: req.componentId,
      quantity: qty(req.quantity),
      substitutes: req.substitutes?.map((s) => ({ componentId: s.componentId, quantity: qty(s.quantity) })),
    }));
    track.requirementsOverride = requirements;
    const deltas: InventoryDelta[] = [];
    const kept: ProjectTrack["progress"] = {};
    for (const [key, line] of Object.entries(track.progress)) {
      const req = requirements[Number(key)];
      if (!req) {
        addLoose(deltas, line.componentId, line.consumed, `Recipe changed: ${def.name}`);
        continue;
      }
      const opt = optionsOf(req).find((o) => o.componentId === line.componentId);
      if (!opt) {
        addLoose(deltas, line.componentId, line.consumed, `Recipe changed: ${def.name}`);
        continue;
      }
      const consumed = Math.min(line.consumed, opt.quantity);
      const refund = line.consumed - consumed;
      addLoose(deltas, line.componentId, refund, `Recipe changed: ${def.name}`);
      const reserved = Math.min(line.reserved, Math.max(0, opt.quantity - consumed));
      if (consumed > 0 || reserved > 0) {
        kept[key] = { componentId: line.componentId, consumed, reserved };
      }
    }
    track.progress = kept;
    next.inventory = applyInventoryDeltas(next.inventory, deltas);
    const touchedObjects = deltas.some((d) => d.op === "remove-object");
    if (touchedObjects) {
      return untouched(ctx, "A recipe change tried to destroy an object. Refused.");
    }
    return {
      ctx: next,
      deltas,
      messages: [`${def.name} has a new recipe. Unused progress came back. Protected objects were not broken.`],
    };
  }

  return untouched(ctx, "Unknown action.");
}

function projectWants(
  catalog: Catalog,
  track: ProjectTrack,
  componentId: string,
): boolean {
  if (track.status === "cancelled" || !track.tagged) return false;
  const reqs = requirementsFor(catalog, track);
  for (let index = 0; index < reqs.length; index += 1) {
    const opts = optionsOf(reqs[index]);
    const hit = opts.find((o) => o.componentId === componentId);
    if (!hit) continue;
    const progress = track.progress[String(index)];
    if (!progress || (progress.consumed === 0 && progress.reserved === 0)) return true;
    if (progress.componentId === componentId && progress.consumed < hit.quantity) return true;
  }
  return false;
}

function inspectSentences(catalog: Catalog, ctx: TrackingContext, instanceId: string): string[] {
  return inspectVisible(catalog, ctx, instanceId).sentences;
}

export function inspectVisible(catalog: Catalog, ctx: TrackingContext, instanceId: string): Inspection {
  const hidden = catalog.hiddenCaches.find((c) => c.id === instanceId);
  if (hidden) return { shown: false, sentences: [], protected: false };

  const instance = ctx.inventory.objects.find((o) => o.instanceId === instanceId);
  if (!instance) return { shown: false, sentences: [], protected: false };
  const object = objectDef(catalog, instance.objectId);
  if (!object) return { shown: false, sentences: [], protected: false };

  const sentences: string[] = [];
  if (object.contains.length) {
    const parts = object.contains.map((yieldLine) => {
      const component = componentDef(catalog, yieldLine.componentId);
      return countNoun(yieldLine.quantity, component.singular, component.plural);
    });
    sentences.push(`Contains ${joinAnd(parts)}.`);
  }

  const useful: string[] = [];
  const ordered = ctx.ledger.projects
    .filter((p) => p.tagged && p.status === "active")
    .slice()
    .sort((a, b) => a.priority - b.priority);
  for (const track of ordered) {
    const def = projectDef(catalog, track.projectId);
    if (!def) continue;
    const wants = object.contains.some((yieldLine) => projectWants(catalog, track, yieldLine.componentId));
    if (wants) useful.push(def.name.toLowerCase());
  }
  if (useful.length) sentences.push(`Useful for your ${joinAnd(useful)}.`);
  if (object.protected) {
    sentences.push("Protected heirloom. A tag will never break it down.");
  }
  return {
    shown: true,
    instanceId,
    title: object.name,
    sentences,
    protected: object.protected,
  };
}

export type SaveBlob = {
  version: 1;
  ctx: TrackingContext;
};

export function serialize(ctx: TrackingContext): string {
  const blob: SaveBlob = { version: 1, ctx };
  return JSON.stringify(blob);
}

export function hydrate(raw: string): TrackingContext {
  const parsed = JSON.parse(raw) as SaveBlob;
  if (!parsed || parsed.version !== 1 || !parsed.ctx?.ledger || !parsed.ctx.inventory) {
    throw new Error("Save blob is not a component ledger.");
  }
  if (parsed.ctx.ledger.version !== 1) throw new Error("Unknown ledger version.");
  return parsed.ctx;
}

/** Read-only helper so tests can assert a tag never produces a salvage delta. */
export function deltasTouchProtected(catalog: Catalog, deltas: InventoryDelta[], before: InventorySnapshot): boolean {
  for (const delta of deltas) {
    if (delta.op !== "remove-object") continue;
    const instance = before.objects.find((o) => o.instanceId === delta.instanceId);
    const object = instance ? objectDef(catalog, instance.objectId) : undefined;
    if (object?.protected) return true;
  }
  return false;
}

export function componentView(analysis: Analysis, id: string): ComponentView {
  const view = analysis.components.find((c) => c.id === id);
  if (!view) throw new Error(`No view for ${id}`);
  return view;
}
