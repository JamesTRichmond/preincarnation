import { SAMPLE_OVERLAYS, SAMPLE_SOURCES } from "./sample.ts";
import { buildSlots } from "./slots.ts";
import {
  DISCIPLINES,
  DUNGEON_IDS,
  ERAS,
  EXPECTED_COUNTS,
  HOST_VERBS,
  TOOL_IDS,
  fail,
  ok,
  type Discipline,
  type EraId,
  type HostVerb,
  type MasteryRecord,
  type RecordKind,
  type RecordOverlay,
  type Result,
  type ToolId,
  type WitnessSource,
} from "./types.ts";

export type Catalog = {
  records: MasteryRecord[];
  byId: Map<string, MasteryRecord>;
  sources: WitnessSource[];
  sourceById: Map<string, WitnessSource>;
};

const KINDS: RecordKind[] = ["inscription", "tool", "form", "cross"];

export function costBand(record: Pick<MasteryRecord, "kind" | "tier" | "role" | "status">): [number, number] | null {
  if (record.status === "reserved") return null;
  if (record.role === "capstone") return [11, 14];
  if (record.role === "vow") return [6, 8];
  if (record.kind === "inscription") {
    if (record.tier === 1) return [2, 3];
    if (record.tier === 2) return [4, 5];
    if (record.tier === 3) return [7, 8];
    return [11, 14];
  }
  if (record.kind === "tool") {
    if (record.tier === 1) return [3, 4];
    if (record.tier === 2) return [5, 6];
    if (record.tier === 3) return [8, 9];
    return [11, 14];
  }
  if (record.kind === "form") {
    if (record.tier === 1) return [4, 6];
    if (record.tier === 2) return [7, 9];
    return [10, 14];
  }
  if (record.tier <= 2) return [6, 8];
  if (record.tier === 3) return [8, 10];
  return [11, 14];
}

function isHost(value: string): value is HostVerb {
  return (HOST_VERBS as readonly string[]).includes(value);
}

function isTool(value: string): value is ToolId {
  return (TOOL_IDS as readonly string[]).includes(value);
}

function isEra(value: string): value is EraId {
  return (ERAS as readonly string[]).includes(value);
}

function isDiscipline(value: string): value is Discipline {
  return (DISCIPLINES as readonly string[]).includes(value);
}

export function effectsConflict(a: MasteryRecord, b: MasteryRecord): string | null {
  if (a.id === b.id) return null;
  if (a.excludes.includes(b.id) || b.excludes.includes(a.id)) {
    return `${a.id} and ${b.id} are marked incompatible.`;
  }
  if (a.channel && b.channel && a.channel === b.channel) {
    const shared = a.hosts.find((host) => b.hosts.includes(host));
    if (shared) return `${a.id} and ${b.id} both take ${shared} / ${a.channel}.`;
  }
  return null;
}

function hasCycle(records: MasteryRecord[]): string | null {
  const byId = new Map(records.map((r) => [r.id, r]));
  const color = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  function visit(id: string): string | null {
    const mark = color.get(id) ?? 0;
    if (mark === 1) return `Cycle at ${[...stack, id].join(" → ")}.`;
    if (mark === 2) return null;
    color.set(id, 1);
    stack.push(id);
    for (const next of byId.get(id)?.requires ?? []) {
      const hit = visit(next);
      if (hit) return hit;
    }
    stack.pop();
    color.set(id, 2);
    return null;
  }
  for (const record of records) {
    const hit = visit(record.id);
    if (hit) return hit;
  }
  return null;
}

function checkRecord(record: MasteryRecord, ids: Set<string>): string | null {
  if (!ids.has(record.id)) return `Unknown id ${record.id}.`;
  if (!KINDS.includes(record.kind)) return `${record.id} has a bad kind.`;
  if (record.disciplines.length !== new Set(record.disciplines).size) {
    return `${record.id} repeats a discipline.`;
  }
  if (record.disciplines.some((d) => !isDiscipline(d))) return `${record.id} has a bad discipline.`;
  if (record.kind === "cross") {
    if (record.disciplines.length < 2) return `${record.id} is cross-discipline but lists one school.`;
  } else if (record.disciplines.length !== 1) {
    return `${record.id} must name exactly one discipline.`;
  }
  if (record.kind === "tool") {
    if (!record.toolId || !isTool(record.toolId)) return `${record.id} needs a known tool.`;
    if (!record.hosts.includes(`tool:${record.toolId}`)) {
      return `${record.id} must ride tool:${record.toolId}.`;
    }
  } else if (record.toolId) {
    return `${record.id} is not a tool transformation.`;
  }
  if ((record.role === "vow" || record.role === "capstone") && record.kind !== "inscription" && record.kind !== "cross") {
    return `${record.id} cannot be a ${record.role}.`;
  }
  for (const host of record.hosts) {
    if (!isHost(host)) return `${record.id} rides an unknown verb ${host}.`;
  }
  for (const req of record.requires) {
    if (!ids.has(req)) return `${record.id} requires missing ${req}.`;
    if (req === record.id) return `${record.id} requires itself.`;
  }
  for (const era of record.requiresEras) {
    if (!isEra(era)) return `${record.id} names an unknown era ${era}.`;
  }
  for (const dungeon of record.requiresDungeons) {
    if (!DUNGEON_IDS.includes(dungeon)) return `${record.id} names an unknown dungeon ${dungeon}.`;
  }
  if (record.status === "reserved") {
    if (record.cost !== 0 || record.name || record.summary || record.channel || record.modifiers.length) {
      return `${record.id} is reserved and must stay blank.`;
    }
    return null;
  }
  if (!record.name?.trim() || !record.summary?.trim()) return `${record.id} needs a name and a summary.`;
  if (!record.channel?.trim()) return `${record.id} needs an effect channel.`;
  if (record.hosts.length === 0) return `${record.id} does not attach to an existing verb.`;
  const band = costBand(record);
  if (!band || record.cost < band[0] || record.cost > band[1]) {
    return `${record.id} costs ${record.cost}, outside ${band?.join("–") ?? "no band"}.`;
  }
  for (const mod of record.modifiers) {
    if (!mod.key || (mod.op !== "add" && mod.op !== "mul" && mod.op !== "flag")) {
      return `${record.id} has a bad modifier.`;
    }
    if (mod.op === "flag" && typeof mod.value !== "boolean") return `${record.id} flag modifier needs a boolean.`;
    if (mod.op !== "flag" && typeof mod.value !== "number") return `${record.id} numeric modifier needs a number.`;
  }
  return null;
}

function checkSource(source: WitnessSource): string | null {
  const id = source.id;
  if (!/^src\.(discovery|encounter|choice)\.[a-z0-9-]+$/.test(id)) {
    return `Source ${id} must look like src.discovery.something.`;
  }
  if (/death|suicide|release|farm/i.test(id)) return `Source ${id} looks like a death payout. Death does not pay.`;
  const prefix = id.split(".")[1];
  if (prefix !== source.kind) return `Source ${id} kind does not match its id.`;
  if (!Number.isInteger(source.amount) || source.amount < 1) return `Source ${id} amount must be a positive integer.`;
  if (source.repeat === "life" && source.amount > 2) return `Repeatable source ${id} pays more than 2.`;
  if (source.repeat === "campaign" && source.amount > 4) return `Campaign source ${id} pays more than 4.`;
  if (!source.label.trim() || !source.note.trim()) return `Source ${id} needs a label and a note.`;
  return null;
}

export function createCatalog(input: { records: MasteryRecord[]; sources: WitnessSource[] }): Result<Catalog> {
  const ids = new Set<string>();
  for (const record of input.records) {
    if (ids.has(record.id)) return fail("duplicate-record", `Duplicate record id ${record.id}.`);
    ids.add(record.id);
  }
  const mirrored = input.records.map((record) => ({ ...record, excludes: [...record.excludes] }));
  const byId = new Map(mirrored.map((record) => [record.id, record]));
  for (const record of mirrored) {
    for (const other of record.excludes) {
      if (!byId.has(other)) return fail("bad-exclude", `${record.id} excludes missing ${other}.`);
      const target = byId.get(other)!;
      if (!target.excludes.includes(record.id)) target.excludes = [...target.excludes, record.id];
    }
  }
  for (const record of mirrored) {
    const problem = checkRecord(record, ids);
    if (problem) return fail("bad-record", problem);
    for (const sourceId of record.requiresSources) {
      if (!input.sources.some((source) => source.id === sourceId)) {
        return fail("bad-record", `${record.id} requires unknown source ${sourceId}.`);
      }
    }
  }
  const cycle = hasCycle(mirrored);
  if (cycle) return fail("cycle", cycle);
  const sourceIds = new Set<string>();
  for (const source of input.sources) {
    if (sourceIds.has(source.id)) return fail("duplicate-source", `Duplicate source ${source.id}.`);
    sourceIds.add(source.id);
    const problem = checkSource(source);
    if (problem) return fail("bad-source", problem);
  }
  return ok({
    records: mirrored,
    byId,
    sources: input.sources,
    sourceById: new Map(input.sources.map((source) => [source.id, source])),
  });
}

function overlaySlot(base: MasteryRecord, overlay: RecordOverlay): MasteryRecord {
  return {
    ...base,
    status: "authored",
    name: overlay.name,
    summary: overlay.summary,
    cost: overlay.cost,
    channel: overlay.channel,
    hosts: overlay.hosts ?? base.hosts,
    tier: overlay.tier ?? base.tier,
    role: overlay.role ?? base.role,
    requires: overlay.requires ?? base.requires,
    requiresSources: overlay.requiresSources ?? base.requiresSources,
    requiresEras: overlay.requiresEras ?? base.requiresEras,
    requiresDungeons: overlay.requiresDungeons ?? base.requiresDungeons,
    excludes: overlay.excludes ?? base.excludes,
    tags: overlay.tags ?? base.tags,
    modifiers: overlay.modifiers ?? [],
    bound: overlay.bound ?? false,
  };
}

export function catalogFromSlots(overlays: RecordOverlay[], sources: WitnessSource[]): Result<Catalog> {
  const slots = buildSlots();
  const byId = new Map(slots.map((slot) => [slot.id, slot]));
  const seen = new Set<string>();
  for (const overlay of overlays) {
    if (seen.has(overlay.id)) return fail("duplicate-record", `Overlay repeated ${overlay.id}.`);
    seen.add(overlay.id);
    const slot = byId.get(overlay.id);
    if (!slot) return fail("unknown-slot", `${overlay.id} is not one of the reserved slots.`);
    byId.set(overlay.id, overlaySlot(slot, overlay));
  }
  return createCatalog({ records: [...byId.values()], sources });
}

let cached: Catalog | null = null;

export function referenceCatalog(): Catalog {
  if (cached) return cached;
  const built = catalogFromSlots(SAMPLE_OVERLAYS, SAMPLE_SOURCES);
  if (!built.ok) throw new Error(`${built.code}: ${built.error}`);
  cached = built.value;
  return cached;
}

export function coverage(catalog: Catalog) {
  const tally = (status: "authored" | "reserved") => ({
    inscription: catalog.records.filter((r) => r.kind === "inscription" && r.status === status).length,
    tool: catalog.records.filter((r) => r.kind === "tool" && r.status === status).length,
    form: catalog.records.filter((r) => r.kind === "form" && r.status === status).length,
    cross: catalog.records.filter((r) => r.kind === "cross" && r.status === status).length,
  });
  const authored = tally("authored");
  const reserved = tally("reserved");
  const complete =
    authored.inscription === EXPECTED_COUNTS.inscription &&
    authored.tool === EXPECTED_COUNTS.tool &&
    authored.form === EXPECTED_COUNTS.form &&
    authored.cross === EXPECTED_COUNTS.cross;
  return { expected: EXPECTED_COUNTS, authored, reserved, complete };
}

/** The shipped reference must not report a finished library. */
export function assertReferenceReady(catalog: Catalog): string[] {
  const problems: string[] = [];
  const report = coverage(catalog);
  const slots = buildSlots();
  if (slots.length !== 164) problems.push(`Slot plan has ${slots.length} rows, expected 164.`);
  const kinds = {
    inscription: slots.filter((r) => r.kind === "inscription").length,
    tool: slots.filter((r) => r.kind === "tool").length,
    form: slots.filter((r) => r.kind === "form").length,
    cross: slots.filter((r) => r.kind === "cross").length,
  };
  if (kinds.inscription !== 72 || kinds.tool !== 36 || kinds.form !== 32 || kinds.cross !== 24) {
    problems.push(`Slot counts ${JSON.stringify(kinds)}.`);
  }
  if (catalog.records.length !== slots.length) problems.push("Catalog dropped or added slots.");
  if (report.complete) problems.push("Reference catalog is claiming the full library. It must not.");
  if (report.authored.inscription < 1 || report.authored.tool < 1 || report.authored.form < 1 || report.authored.cross < 1) {
    problems.push("Sample content is missing a kind.");
  }
  const authored = catalog.records.filter((r) => r.status === "authored");
  if (authored.some((r) => r.hosts.length === 0)) problems.push("An authored record attaches to nothing.");
  return problems;
}
