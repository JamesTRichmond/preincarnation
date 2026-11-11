import {
  DISCIPLINES,
  type Discipline,
  type HostVerb,
  type MasteryRecord,
  type ToolId,
} from "./types.ts";

const PRIMARY_TOOL: Record<Discipline, HostVerb> = {
  quarry: "tool:hammer",
  creek: "tool:boots",
  sugar: "tool:hookshot",
  ash: "tool:bow",
  lantern: "tool:lantern",
  hollow: "tool:cape",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function inscriptionId(d: Discipline, n: number) {
  return `${d}.ins.${pad(n)}`;
}

function blank(partial: Omit<MasteryRecord, "status" | "name" | "summary" | "cost" | "channel" | "modifiers" | "bound" | "excludes" | "tags" | "requiresSources" | "requiresEras" | "requiresDungeons"> & Partial<MasteryRecord>): MasteryRecord {
  return {
    status: "reserved",
    name: null,
    summary: null,
    cost: 0,
    channel: null,
    modifiers: [],
    bound: false,
    excludes: [],
    tags: [],
    requiresSources: [],
    requiresEras: [],
    requiresDungeons: [],
    ...partial,
  };
}

function inscriptionRequires(d: Discipline, n: number): string[] {
  const id = (k: number) => inscriptionId(d, k);
  if (n === 5) return [id(1)];
  if (n === 6) return [id(2)];
  if (n === 7) return [id(3)];
  if (n === 8) return [id(1), id(2)];
  if (n === 9) return [id(5)];
  if (n === 10) return [id(6)];
  if (n === 11) return [id(7), id(8)];
  if (n === 12) return [id(9), id(10)];
  return [];
}

function inscriptionHost(d: Discipline, n: number): HostVerb[] {
  const slot = ((n - 1) % 4) as 0 | 1 | 2 | 3;
  if (slot === 0) return ["slash"];
  if (slot === 1) return ["spin"];
  if (slot === 2) return ["dash"];
  return [PRIMARY_TOOL[d]];
}

export const TOOL_GROUPS: { tool: ToolId; discipline: Discipline }[] = [
  { tool: "shovel", discipline: "quarry" },
  { tool: "hookshot", discipline: "sugar" },
  { tool: "boots", discipline: "creek" },
  { tool: "flippers", discipline: "creek" },
  { tool: "lantern", discipline: "lantern" },
  { tool: "hammer", discipline: "quarry" },
  { tool: "net", discipline: "lantern" },
  { tool: "mirror", discipline: "hollow" },
  { tool: "cape", discipline: "hollow" },
  { tool: "cane", discipline: "sugar" },
  { tool: "bow", discipline: "ash" },
  { tool: "bombs", discipline: "quarry" },
];

/** Ring, then the remaining pairs. Index 0..14. */
export const CROSS_PAIRS: [Discipline, Discipline][] = [
  ["quarry", "creek"],
  ["creek", "sugar"],
  ["sugar", "ash"],
  ["ash", "lantern"],
  ["lantern", "hollow"],
  ["hollow", "quarry"],
  ["quarry", "sugar"],
  ["creek", "ash"],
  ["sugar", "lantern"],
  ["ash", "hollow"],
  ["lantern", "quarry"],
  ["hollow", "creek"],
  ["quarry", "ash"],
  ["creek", "lantern"],
  ["sugar", "hollow"],
];

export function buildSlots(): MasteryRecord[] {
  const records: MasteryRecord[] = [];

  for (const d of DISCIPLINES) {
    for (let n = 1; n <= 12; n++) {
      const tier = n <= 4 ? 1 : n <= 8 ? 2 : n <= 11 ? 3 : 4;
      records.push(
        blank({
          id: inscriptionId(d, n),
          kind: "inscription",
          disciplines: [d],
          tier,
          role: n === 12 ? "capstone" : "standard",
          hosts: inscriptionHost(d, n),
          toolId: null,
          requires: inscriptionRequires(d, n),
        }),
      );
    }
  }

  TOOL_GROUPS.forEach((group, gi) => {
    for (let rank = 0; rank < 3; rank++) {
      const num = gi * 3 + rank + 1;
      const id = `tool.${pad(num)}`;
      const prev = rank === 0 ? [] : [`tool.${pad(num - 1)}`];
      const ins = rank === 2 ? [inscriptionId(group.discipline, 1)] : [];
      records.push(
        blank({
          id,
          kind: "tool",
          disciplines: [group.discipline],
          tier: (rank + 1) as 1 | 2 | 3,
          role: "standard",
          hosts: [`tool:${group.tool}`],
          toolId: group.tool,
          requires: [...prev, ...ins],
        }),
      );
    }
  });

  for (let i = 1; i <= 30; i++) {
    const di = Math.floor((i - 1) / 5);
    const rank = (i - 1) % 5;
    const d = DISCIPLINES[di]!;
    const prev = rank === 0 ? [inscriptionId(d, 1)] : [`form.${pad(i - 1)}`];
    const tier = rank <= 1 ? 1 : rank <= 3 ? 2 : 3;
    records.push(
      blank({
        id: `form.${pad(i)}`,
        kind: "form",
        disciplines: [d],
        tier,
        role: "standard",
        hosts: ["walk"],
        toolId: null,
        requires: prev,
      }),
    );
  }

  for (const extra of [
    { id: "form.31", d: "hollow" as const },
    { id: "form.32", d: "quarry" as const },
  ]) {
    records.push(
      blank({
        id: extra.id,
        kind: "form",
        disciplines: [extra.d],
        tier: 2,
        role: "standard",
        hosts: ["walk"],
        toolId: null,
        requires: [inscriptionId(extra.d, 1)],
      }),
    );
  }

  CROSS_PAIRS.forEach((pair, i) => {
    const num = i + 1;
    records.push(
      blank({
        id: `cross.${pad(num)}`,
        kind: "cross",
        disciplines: [...pair],
        tier: 2,
        role: "standard",
        hosts: ["slash"],
        toolId: null,
        requires: [inscriptionId(pair[0], 1), inscriptionId(pair[1], 1)],
      }),
    );
  });

  // Six ring vows, then three capstones. 15 + 6 + 3 = 24.
  for (let i = 0; i < 6; i++) {
    const pair = CROSS_PAIRS[i]!;
    records.push(
      blank({
        id: `cross.${pad(16 + i)}`,
        kind: "cross",
        disciplines: [...pair],
        tier: 3,
        role: "vow",
        hosts: ["slash"],
        toolId: null,
        requires: [`cross.${pad(i + 1)}`],
      }),
    );
  }
  for (let i = 0; i < 3; i++) {
    const pair = CROSS_PAIRS[6 + i]!;
    records.push(
      blank({
        id: `cross.${pad(22 + i)}`,
        kind: "cross",
        disciplines: [...pair],
        tier: 4,
        role: "capstone",
        hosts: ["slash"],
        toolId: null,
        requires: [inscriptionId(pair[0], 5), inscriptionId(pair[1], 5)],
      }),
    );
  }

  return records;
}
