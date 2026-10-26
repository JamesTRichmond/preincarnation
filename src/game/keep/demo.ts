import { projectFromPreset } from "./presets.ts";
import { PRESETS } from "./presets.ts";
import type { Category, ProjectStatus, RecipeLine, ReferenceSnapshot, ReferenceStack } from "./types.ts";

export type LedgerSnapshot = ReferenceSnapshot & {
  yearInEra: number;
  log: string[];
};

const ENABLED = new Set([
  "healing-meals",
  "restoration-hold",
  "one-discovered",
  "named-gifts",
  "fishing-sessions",
  "surplus-sale",
  "heirloom-shelf",
  "prior-era-curios",
]);

function stack(
  stackId: string,
  sku: string,
  qty: number,
  eraId: string,
  acquiredAt: number,
  attrs: ReferenceStack["attrs"] = {},
): ReferenceStack {
  return { stackId, sku, qty, eraId, acquiredAt, attrs };
}

export function createSeed(): LedgerSnapshot {
  const chapel = projectFromPreset("restoration-hold");
  if (!chapel) throw new Error("Chapel preset missing.");
  return {
    eraId: "era-7",
    eraIndex: 7,
    yearInEra: 9,
    offerSurplusForSale: false,
    requestedAutoDispose: false,
    log: ["Ledger opened on era 7, year 9 of 14. Presets are on; individual objects were not each configured."],
    rules: PRESETS.map((preset) => ({
      id: `preset:${preset.id}`,
      preset: preset.id,
      enabled: ENABLED.has(preset.id),
      params: preset.id === "fishing-sessions" ? { sessions: 2 } : preset.id === "healing-meals" ? { keep: 8 } : undefined,
    })),
    projects: [
      {
        projectId: chapel.id,
        name: chapel.name,
        status: "active",
        priority: 1,
        recipeRevision: 1,
        lines: chapel.lines,
        presetId: chapel.presetId,
      },
      {
        projectId: "project-smokehouse",
        name: "Smokehouse repair",
        status: "active",
        priority: 2,
        recipeRevision: 1,
        lines: [
          { itemId: "oak-beam", quantity: 6, substitutes: [] },
          { itemId: "lime", quantity: 4, substitutes: [] },
          { itemId: "salt", quantity: 8, substitutes: [] },
        ],
      },
    ],
    stacks: [
      stack("broth-a", "meal-broth", 6, "era-7", 1),
      stack("broth-b", "meal-broth", 4, "era-7", 2),
      stack("plum-a", "meal-plum", 3, "era-6", 3),
      stack("bread-a", "meal-bread", 10, "era-7", 4),
      stack("worms", "nightcrawler", 10, "era-7", 5),
      stack("flies", "river-fly", 5, "era-7", 6),
      stack("hooks", "hook", 6, "era-7", 7),
      stack("spools", "line-spool", 3, "era-7", 8),
      stack("oak-1", "oak-beam", 10, "era-7", 9),
      stack("ash-1", "ash-beam", 4, "era-7", 10),
      stack("lime-1", "lime", 12, "era-7", 11),
      stack("stone-1", "river-stone", 8, "era-7", 12),
      stack("nails-1", "copper-nail", 30, "era-7", 13),
      stack("salt-1", "salt", 9, "era-7", 14),
      stack("linen-1", "linen", 6, "era-7", 15),
      stack("kettle-1", "kettle", 2, "era-7", 16),
      stack("mara-1", "kettle-mara", 1, "era-6", 17, {
        unique: true,
        discovered: true,
        giftFrom: "Mara",
        giftName: "For the winter you come back",
        lock: true,
        lockReason: "For the winter you come back",
        lockAuthor: "gift-record",
      }),
      stack("note-1", "unsigned-note", 1, "era-7", 18),
      stack("bell-1", "first-bell", 1, "era-6", 19, { unique: true, discovered: true }),
      stack("coin-1", "river-coin", 1, "era-7", 20, { unique: true, discovered: true }),
      stack("compass-1", "cracked-compass", 1, "era-6", 21),
      stack("fern-1", "pressed-fern", 1, "era-6", 22, { discovered: true }),
      stack("fern-2", "pressed-fern", 2, "era-6", 23, { discovered: true }),
      stack("eye-1", "glass-eye", 1, "era-7", 24, { unique: true, discovered: true }),
      stack("pipe-1", "blue-clay-pipe", 3, "era-7", 25, { discovered: true }),
      stack("resin-1", "star-resin", 1, "era-7", 26, { unique: true, discovered: true }),
      stack("ore-1", "pale-ore", 2, "era-7", 27, { unique: true }),
      stack("rod-1", "fishing-rod", 2, "era-7", 28),
      stack("bandage-1", "bandage", 5, "era-7", 29),
    ],
  };
}

function withLog(snapshot: LedgerSnapshot, message: string): LedgerSnapshot {
  return { ...snapshot, log: [message, ...snapshot.log].slice(0, 8) };
}

export function setPresetEnabled(snapshot: LedgerSnapshot, presetId: string, enabled: boolean): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const rule = next.rules.find((entry) => "preset" in entry && entry.preset === presetId);
  if (rule && "preset" in rule) rule.enabled = enabled;
  if (presetId === "restoration-hold") {
    const chapel = next.projects.find((project) => project.presetId === "restoration-hold");
    if (chapel) chapel.status = enabled ? "active" : "cancelled";
  }
  const name = PRESETS.find((preset) => preset.id === presetId)?.name ?? presetId;
  return withLog(next, enabled ? `Enabled “${name}”.` : `Turned off “${name}”. Stock was not deleted.`);
}

export function setFishingSessions(snapshot: LedgerSnapshot, sessions: number): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const rule = next.rules.find((entry) => "preset" in entry && entry.preset === "fishing-sessions");
  if (rule && "preset" in rule) rule.params = { ...rule.params, sessions };
  return withLog(next, `Fishing cache set to ${sessions} session${sessions === 1 ? "" : "s"}.`);
}

export function setHealingKeep(snapshot: LedgerSnapshot, keep: number): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const rule = next.rules.find((entry) => "preset" in entry && entry.preset === "healing-meals");
  if (rule && "preset" in rule) rule.params = { ...rule.params, keep };
  return withLog(next, `Healing-meal floor set to ${keep}.`);
}

export function contradictMeals(snapshot: LedgerSnapshot): LedgerSnapshot {
  if (snapshot.rules.some((rule) => rule.id === "extra:healing-two")) return snapshot;
  const next = structuredClone(snapshot);
  next.rules.push({
    id: "extra:healing-two",
    name: "Release healing down to two",
    selector: { category: "food", tag: "healing" },
    keep: 2,
    grouping: "pool",
    rank: 11,
    enabled: true,
  });
  return withLog(
    next,
    "Added a contradicting floor: keep only two healing meals. The stricter floor stays. Nothing was released.",
  );
}

export function cancelSmokehouse(snapshot: LedgerSnapshot): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const project = next.projects.find((entry) => entry.projectId === "project-smokehouse");
  if (project) project.status = "cancelled";
  return withLog(next, "Smokehouse repair cancelled. Its reservation is released. The oak it held is free unless another rule takes it.");
}

export function splitOak(snapshot: LedgerSnapshot): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const oak = next.stacks.find((entry) => entry.stackId === "oak-1");
  if (!oak) return withLog(snapshot, "The original oak stack is already split.");
  const qty = oak.qty;
  const door = Math.min(6, qty);
  const rest = qty - door;
  next.stacks = next.stacks.flatMap((entry) => {
    if (entry.stackId !== "oak-1") return [entry];
    const pieces: ReferenceStack[] = [
      stack("oak-door", "oak-beam", door, entry.eraId ?? next.eraId, entry.acquiredAt ?? 9, {
        lineageId: "oak-1",
      }),
    ];
    if (rest > 0) {
      pieces.push(
        stack("oak-rest", "oak-beam", rest, entry.eraId ?? next.eraId, (entry.acquiredAt ?? 9) + 1, {
          lineageId: "oak-1",
        }),
      );
    }
    return pieces;
  });
  next.rules.push({
    id: "inst:oak-door",
    stackId: "oak-door",
    mode: "protect",
    reason: "Held for the chapel door. This stack id only.",
    enabled: true,
  });
  return withLog(
    next,
    "Split the oak. The door piece is instance-protected. The offcut is a new stack id and did not inherit that protect.",
  );
}

export function reviseChapel(snapshot: LedgerSnapshot): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const chapel = next.projects.find((project) => project.projectId === "project-chapel");
  if (!chapel) return snapshot;
  const previous = chapel.lines.map((line) => ({ ...line, substitutes: line.substitutes.map((sub) => ({ ...sub })) }));
  const replacement: RecipeLine[] = [
    { itemId: "ash-beam", quantity: 8, substitutes: [] },
    { itemId: "lime", quantity: 10, substitutes: [] },
    { itemId: "river-stone", quantity: 8, substitutes: [] },
    { itemId: "linen", quantity: 4, substitutes: [] },
  ];
  chapel.previousRevision = chapel.recipeRevision;
  chapel.previousLines = previous;
  chapel.recipeRevision += 1;
  chapel.lines = replacement;
  return withLog(next, "Chapel recipe revised. Oak is no longer on the list, so this project stops holding it. Ash is now required.");
}

export function advanceEra(snapshot: LedgerSnapshot): LedgerSnapshot {
  const next = structuredClone(snapshot);
  next.eraIndex += 1;
  next.eraId = `era-${next.eraIndex}`;
  next.yearInEra = 1;
  return withLog(
    next,
    `Crossed into ${next.eraId}, year 1 of 14. Era-scoped rules let go. Locks and other-era floors stay. Nothing was deleted.`,
  );
}

export function exemptBroth(snapshot: LedgerSnapshot): LedgerSnapshot {
  if (snapshot.rules.some((rule) => rule.id === "inst:broth-a")) return snapshot;
  const next = structuredClone(snapshot);
  next.rules.push({
    id: "inst:broth-a",
    stackId: "broth-a",
    mode: "exempt",
    reason: "This pot is for tonight. Category floors should skip this stack only.",
    enabled: true,
  });
  return withLog(next, "Exempted the larger broth stack from category floors. Other healing meals still fill the floor if they can.");
}

export function challengeGift(snapshot: LedgerSnapshot): LedgerSnapshot {
  if (snapshot.rules.some((rule) => rule.id === "inst:mara")) return snapshot;
  const next = structuredClone(snapshot);
  next.rules.push({
    id: "inst:mara",
    stackId: "mara-1",
    mode: "exempt",
    reason: "Try to treat Mara’s kettle as ordinary stock.",
    enabled: true,
  });
  return withLog(next, "An exempt directive was aimed at Mara’s kettle. Lock metadata is explicit and is not erased.");
}

export function requestPurge(snapshot: LedgerSnapshot): LedgerSnapshot {
  const next = structuredClone(snapshot);
  next.requestedAutoDispose = true;
  return withLog(next, "A purge of surplus was requested. The evaluator refused. The review list is unchanged as a disposal order.");
}

export function setProjectStatus(snapshot: LedgerSnapshot, projectId: string, status: ProjectStatus): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const project = next.projects.find((entry) => entry.projectId === projectId);
  if (!project) return snapshot;
  project.status = status;
  if (project.presetId) {
    const rule = next.rules.find((entry) => "preset" in entry && entry.preset === project.presetId);
    if (rule && "preset" in rule) rule.enabled = status === "active";
  }
  return withLog(next, `${project.name} marked ${status}.`);
}

export function swapPriority(snapshot: LedgerSnapshot): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const chapel = next.projects.find((project) => project.projectId === "project-chapel");
  const smoke = next.projects.find((project) => project.projectId === "project-smokehouse");
  if (!chapel || !smoke) return snapshot;
  const chapelPriority = chapel.priority;
  chapel.priority = smoke.priority;
  smoke.priority = chapelPriority;
  return withLog(next, "Swapped project priority. The lower number now claims the shared oak, lime, and any other overlap first.");
}

export function addFloor(
  snapshot: LedgerSnapshot,
  draft: { name: string; tag?: string; category?: Category | ""; keep: number },
): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const id = `extra:${next.rules.length + 1}`;
  const selector: { tag?: string; category?: Category } = {};
  if (draft.tag?.trim()) selector.tag = draft.tag.trim();
  if (draft.category) selector.category = draft.category;
  next.rules.push({
    id,
    name: draft.name.trim() || "Custom floor",
    selector,
    keep: draft.keep,
    grouping: "pool",
    rank: 400,
    enabled: true,
  });
  return withLog(next, `Added category floor “${draft.name.trim() || "Custom floor"}”. It applies to matches, not to a hand-picked list of objects.`);
}

export function protectStack(snapshot: LedgerSnapshot, stackId: string): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const id = `inst:protect:${stackId}`;
  next.rules = next.rules.filter((rule) => rule.id !== id && rule.id !== `inst:exempt:${stackId}`);
  next.rules.push({
    id,
    stackId,
    mode: "protect",
    reason: "Player marked this stack, and only this stack.",
    enabled: true,
  });
  return withLog(next, `Instance protect on ${stackId}. A split of it would not inherit this.`);
}

export function exemptStack(snapshot: LedgerSnapshot, stackId: string): LedgerSnapshot {
  const next = structuredClone(snapshot);
  const id = `inst:exempt:${stackId}`;
  next.rules = next.rules.filter((rule) => rule.id !== id && rule.id !== `inst:protect:${stackId}`);
  next.rules.push({
    id,
    stackId,
    mode: "exempt",
    reason: "Player exempted this stack from category floors.",
    enabled: true,
  });
  return withLog(next, `Instance exemption on ${stackId}. Locks on the stack, if any, still win.`);
}
