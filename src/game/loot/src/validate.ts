import { CATALOG_BUDGET, CATALOG_TOTAL, categoryPrefixOf, classifyItemId, prefixFor } from "./ids.ts";
import {
  CATEGORIES,
  HANDLERS,
  type BudgetReport,
  type Category,
  type ContentPack,
  type HandlerName,
  type ItemDefinition,
  type ItemUse,
} from "./types.ts";

const HANDLER_SET = new Set<string>(HANDLERS);

function push(errors: string[], condition: boolean, message: string) {
  if (condition) errors.push(message);
}

export function budgetOf(definitions: readonly ItemDefinition[]): BudgetReport {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as Record<
    Category,
    number
  >;
  for (const def of definitions) counts[def.category] += 1;
  const over = CATEGORIES.filter((category) => counts[category] > CATALOG_BUDGET[category]);
  const total = CATEGORIES.reduce((sum, category) => sum + counts[category], 0);
  return {
    counts,
    budget: CATALOG_BUDGET,
    total,
    totalBudget: CATALOG_TOTAL,
    over,
  };
}

function idModeError(id: string, mode: ContentPack["mode"], label: string): string | null {
  const cls = classifyItemId(id);
  if (mode === "demo") {
    if (!id.startsWith("demo.")) return `${label} ${id} is not in the demo namespace`;
    if (cls === "invalid" && looksLikeItemId(id)) return `${label} ${id} is not a valid demo item id`;
    return null;
  }
  if (id.startsWith("demo.")) return `${label} ${id} uses the demo namespace in a production pack`;
  return null;
}

function looksLikeItemId(id: string): boolean {
  return /^(demo\.)?(ord|eq|rel|ing|card|dish|trp|doc)\./.test(id);
}

export function validateContent(pack: ContentPack): string[] {
  const errors: string[] = [];
  push(errors, pack.id.trim().length === 0, "Content pack id is empty");
  push(errors, pack.mode === "demo" && !pack.id.startsWith("demo."), "Demo pack id must start with demo.");
  push(
    errors,
    pack.mode === "production" && pack.id.startsWith("demo."),
    "Production pack id must not start with demo.",
  );

  const ids = new Set<string>();
  for (const def of pack.definitions) {
    const modeError = idModeError(def.id, pack.mode, "Item");
    if (modeError && (pack.mode === "production" || classifyItemId(def.id) !== "demo")) {
      if (classifyItemId(def.id) !== (pack.mode === "demo" ? "demo" : "production")) {
        errors.push(`Item ${def.id} does not match ${pack.mode} id rules`);
      }
    }
    if (classifyItemId(def.id) !== pack.mode) {
      errors.push(`Item ${def.id} is not a ${pack.mode} id`);
    }
    const prefix = categoryPrefixOf(def.id);
    push(
      errors,
      prefix !== prefixFor(def.category),
      `${def.id} prefix ${prefix ?? "?"} does not match category ${def.category}`,
    );
    push(errors, ids.has(def.id), `Duplicate item id ${def.id}`);
    ids.add(def.id);
    errors.push(...validateDefinitionShape(def));
  }

  const defById = new Map(pack.definitions.map((def) => [def.id, def]));

  const recipeIds = new Set<string>();
  for (const recipe of pack.recipes) {
    push(errors, recipe.station !== "bench", `${recipe.id} is not a bench recipe`);
    push(errors, recipeIds.has(recipe.id), `Duplicate recipe ${recipe.id}`);
    recipeIds.add(recipe.id);
    noteId(errors, pack, recipe.id, "Recipe");
    push(errors, recipe.inputs.length === 0, `${recipe.id} has no inputs`);
    push(errors, recipe.output.quantity < 1, `${recipe.id} output quantity is empty`);
    for (const input of recipe.inputs) {
      push(errors, !defById.has(input.definitionId), `${recipe.id} input ${input.definitionId} is not in this pack`);
      push(errors, input.quantity < 1, `${recipe.id} input quantity is empty`);
    }
    push(
      errors,
      !defById.has(recipe.output.definitionId),
      `${recipe.id} output ${recipe.output.definitionId} is not in this pack`,
    );
    if (recipe.toolDefinitionId) {
      push(
        errors,
        !defById.has(recipe.toolDefinitionId),
        `${recipe.id} tool ${recipe.toolDefinitionId} is not in this pack`,
      );
    }
  }

  const restoreIds = new Set<string>();
  for (const restoration of pack.restorations) {
    push(errors, restoreIds.has(restoration.id), `Duplicate restoration ${restoration.id}`);
    restoreIds.add(restoration.id);
    noteId(errors, pack, restoration.id, "Restoration");
    const target = defById.get(restoration.targetDefinitionId);
    push(errors, !target, `${restoration.id} target ${restoration.targetDefinitionId} is missing`);
    push(
      errors,
      !!target && target.condition === "none",
      `${restoration.id} targets ${target?.id} which has no condition to restore`,
    );
    push(errors, restoration.restoreAmount <= 0, `${restoration.id} restores nothing`);
    for (const input of restoration.inputs) {
      push(errors, !defById.has(input.definitionId), `${restoration.id} input ${input.definitionId} is missing`);
    }
    if (restoration.toolDefinitionId) {
      push(
        errors,
        !defById.has(restoration.toolDefinitionId),
        `${restoration.id} tool ${restoration.toolDefinitionId} is missing`,
      );
    }
  }

  const modIds = new Set<string>();
  for (const mod of pack.modifications) {
    push(errors, modIds.has(mod.id), `Duplicate modification ${mod.id}`);
    modIds.add(mod.id);
    noteId(errors, pack, mod.id, "Modification");
    push(errors, mod.targetTags.length === 0, `${mod.id} has no target tags`);
    push(errors, !defById.has(mod.kit.definitionId), `${mod.id} kit ${mod.kit.definitionId} is missing`);
    push(errors, mod.kit.quantity < 1, `${mod.id} kit quantity is empty`);
    push(errors, mod.masteryTag.trim().length === 0, `${mod.id} has an empty mastery tag`);
  }

  const characterIds = new Set<string>();
  const beatIds = new Set<string>();
  for (const character of pack.characters) {
    push(errors, characterIds.has(character.id), `Duplicate character ${character.id}`);
    characterIds.add(character.id);
    noteId(errors, pack, character.id, "Character");
    push(errors, character.beats.length === 0, `${character.id} has no beats`);
    for (const beat of character.beats) {
      push(errors, beatIds.has(beat.id), `Duplicate beat ${beat.id}`);
      beatIds.add(beat.id);
      push(errors, !defById.has(beat.definitionId), `${beat.id} item ${beat.definitionId} is missing`);
      push(errors, beat.lines.length === 0 || beat.lines.some((line) => line.trim().length < 8), `${beat.id} has empty lines`);
      push(errors, beat.journalTitle.trim().length < 3, `${beat.id} has no journal title`);
      if (beat.evidence) {
        const beatDef = defById.get(beat.definitionId);
        push(errors, !beatDef?.evidenceId, `${beat.id} records evidence but the item has no evidence id`);
      }
    }
  }

  const slotIds = new Set<string>();
  for (const slot of pack.slots) {
    push(errors, slotIds.has(slot.id), `Duplicate display slot ${slot.id}`);
    slotIds.add(slot.id);
    noteId(errors, pack, slot.id, "Slot");
    push(errors, slot.accepts.length === 0, `${slot.id} accepts nothing`);
  }

  noteId(errors, pack, pack.trader.id, "Trader");
  push(errors, pack.trader.buys.length === 0, `${pack.trader.id} buys nothing`);
  push(errors, pack.trader.purse < 0, `${pack.trader.id} purse is negative`);
  for (const stock of pack.trader.stock) {
    push(errors, !defById.has(stock.definitionId), `Trader stock ${stock.definitionId} is missing`);
    const stockDef = defById.get(stock.definitionId);
    push(
      errors,
      !!stockDef && !pack.trader.buys.includes(stockDef.category),
      `Trader stocks ${stock.definitionId} but does not buy that category`,
    );
  }

  for (const def of pack.definitions) {
    errors.push(...validateUses(def, pack, defById));
  }

  if (pack.mode === "production") {
    const budget = budgetOf(pack.definitions);
    for (const category of budget.over) {
      errors.push(
        `${category} has ${budget.counts[category]} definitions; the budget is ${CATALOG_BUDGET[category]}`,
      );
    }
  } else {
    const budget = budgetOf(pack.definitions);
    for (const category of budget.over) {
      errors.push(`${category} demo count exceeds the production budget`);
    }
  }

  return errors;
}

function noteId(errors: string[], pack: ContentPack, id: string, label: string) {
  if (pack.mode === "demo" && !id.startsWith("demo.")) {
    errors.push(`${label} ${id} must start with demo. in a demo pack`);
  }
  if (pack.mode === "production" && id.startsWith("demo.")) {
    errors.push(`${label} ${id} must not use the demo namespace`);
  }
}

function validateDefinitionShape(def: ItemDefinition): string[] {
  const errors: string[] = [];
  push(errors, def.name.trim().length < 2, `${def.id} has no name`);
  push(errors, def.summary.trim().length < 12, `${def.id} summary is too thin to be a purpose`);
  push(errors, def.weight < 0, `${def.id} weight is negative`);
  push(errors, def.value < 0, `${def.id} value is negative`);
  push(errors, def.stackLimit < 1, `${def.id} stack limit is below 1`);
  push(errors, def.uses.length === 0, `${def.id} has no uses`);
  push(errors, def.category === "ordinary" && def.uses.length < 2, `${def.id} needs two uses`);
  push(errors, def.category === "relic" && def.stackLimit !== 1, `${def.id} relic must not stack`);
  push(
    errors,
    def.category === "relic" && def.protection === "none",
    `${def.id} relic must be quest-bound or essential`,
  );
  push(errors, !!def.equipSlot && !def.uses.some((use) => use.handler === "equip"), `${def.id} has a slot but cannot be equipped`);
  push(errors, def.uses.some((use) => use.handler === "equip") && !def.equipSlot, `${def.id} equip use has no slot`);
  for (const use of def.uses) {
    push(errors, !HANDLER_SET.has(use.handler), `${def.id} uses unknown handler ${use.handler}`);
    push(errors, use.label.trim().length < 3, `${def.id} has a blank use label`);
    push(errors, use.detail.trim().length < 12, `${def.id} use "${use.label}" does not say what it does`);
    push(
      errors,
      /crafting/i.test(use.detail) && use.detail.trim().length < 24,
      `${def.id} use "${use.label}" is only a crafting hint`,
    );
  }
  if (def.category === "card") {
    push(errors, def.externalRef?.system !== "cards", `${def.id} card must point at the cards system`);
  }
  if (def.category === "dish") {
    push(errors, def.externalRef?.system !== "cooking", `${def.id} dish must point at the cooking system`);
  }
  if (def.externalRef && def.externalRef.id.startsWith("demo.") !== (classifyItemId(def.id) === "demo")) {
    errors.push(`${def.id} external ref ${def.externalRef.id} crosses the demo/production line`);
  }
  if (def.reading) {
    const text = def.reading.body.join(" ").trim();
    push(errors, def.reading.title.trim().length < 2, `${def.id} reading has no title`);
    push(errors, text.length < 40, `${def.id} reading is too short to be a document`);
  }
  if (def.mapMarkers) {
    for (const marker of def.mapMarkers) {
      push(errors, marker.note.trim().length < 8, `${def.id} marker ${marker.id} has no note`);
    }
  }
  return errors;
}

function hasHandler(def: ItemDefinition, handler: HandlerName): boolean {
  return def.uses.some((use) => use.handler === handler);
}

function validateUses(
  def: ItemDefinition,
  pack: ContentPack,
  defById: Map<string, ItemDefinition>,
): string[] {
  const errors: string[] = [];
  for (const use of def.uses) {
    const problem = linkUse(def, use, pack, defById);
    if (problem) errors.push(problem);
  }
  if (def.category === "document") {
    push(errors, !def.reading, `${def.id} document cannot be read`);
    push(
      errors,
      !def.evidenceId && !def.uses.some((use) => use.handler === "present" || use.handler === "unlock"),
      `${def.id} document has no evidence, presentation, or unlock`,
    );
  }
  if (def.category === "trophy") {
    push(errors, !hasHandler(def, "place"), `${def.id} trophy cannot be placed`);
  }
  if (def.category === "equipment") {
    push(errors, !hasHandler(def, "equip"), `${def.id} equipment cannot be equipped`);
    const purposeful =
      !!def.equippedEffect ||
      !!def.carryBonus ||
      def.uses.some((use) => use.handler !== "equip");
    push(errors, !purposeful, `${def.id} equipment does nothing when worn`);
  }
  if (def.dismantle && !hasHandler(def, "dismantle")) {
    errors.push(`${def.id} has salvage yields but no dismantle use`);
  }
  return errors;
}

function linkUse(
  def: ItemDefinition,
  use: ItemUse,
  pack: ContentPack,
  defById: Map<string, ItemDefinition>,
): string | null {
  switch (use.handler) {
    case "equip":
      return def.equipSlot ? null : `${def.id} equip use has no slot`;
    case "consume":
      return def.consumeEffect && hasAnyEffect(def.consumeEffect)
        ? null
        : `${def.id} consume use has no effect`;
    case "read":
      return def.reading ? null : `${def.id} read use has no text`;
    case "present":
      return pack.characters.some((character) =>
        character.beats.some((beat) => beat.definitionId === def.id && beat.via === "present"),
      )
        ? null
        : `${def.id} present use has no character beat`;
    case "gift":
      return pack.characters.some((character) =>
        character.beats.some((beat) => beat.definitionId === def.id && beat.via === "gift"),
      )
        ? null
        : `${def.id} gift use has no character beat`;
    case "place":
      if (!def.placeTags || def.placeTags.length === 0) return `${def.id} place use has no tags`;
      return pack.slots.some((slot) => slot.accepts.some((tag) => def.placeTags?.includes(tag)))
        ? null
        : `${def.id} place tags match no display slot`;
    case "restore-target":
      return pack.restorations.some((restoration) => restoration.targetDefinitionId === def.id)
        ? null
        : `${def.id} is not the target of a restoration`;
    case "restore-material":
      return pack.restorations.some((restoration) =>
        restoration.inputs.some((input) => input.definitionId === def.id),
      )
        ? null
        : `${def.id} is not consumed by any restoration`;
    case "modify-kit":
      return pack.modifications.some((mod) => mod.kit.definitionId === def.id)
        ? null
        : `${def.id} is not a modification kit`;
    case "modify-target":
      return pack.modifications.some((mod) => mod.targetTags.some((tag) => def.tags.includes(tag)))
        ? null
        : `${def.id} has no modification that accepts its tags`;
    case "dismantle":
      if (!def.dismantle || def.dismantle.length === 0) return `${def.id} dismantle use has no yields`;
      for (const yieldItem of def.dismantle) {
        if (!defById.has(yieldItem.definitionId)) {
          return `${def.id} dismantles into missing ${yieldItem.definitionId}`;
        }
        if (yieldItem.quantity < 1) return `${def.id} dismantle yield is empty`;
      }
      return null;
    case "craft-material":
      return pack.recipes.some((recipe) => recipe.inputs.some((input) => input.definitionId === def.id))
        ? null
        : `${def.id} is not an input to any bench recipe`;
    case "craft-output":
      return pack.recipes.some((recipe) => recipe.output.definitionId === def.id)
        ? null
        : `${def.id} is not made by any bench recipe`;
    case "craft-tool":
      return pack.recipes.some((recipe) => recipe.toolDefinitionId === def.id) ||
        pack.restorations.some((restoration) => restoration.toolDefinitionId === def.id)
        ? null
        : `${def.id} is not a tool for any bench action`;
    case "rig":
      if (!def.rig) return `${def.id} rig use has no handoff`;
      if (def.rig.system !== "fishing" && def.rig.system !== "hunting") {
        return `${def.id} rig handoff must be fishing or hunting`;
      }
      if (def.rig.note.trim().length < 12) return `${def.id} rig note is empty`;
      return null;
    case "consult":
      if (!def.consult) return `${def.id} consult use has no text`;
      if (def.consult.body.trim().length < 20) return `${def.id} consult text is too short`;
      return null;
    case "unlock":
      if (!def.unlockFlag || !def.unlockNote) return `${def.id} unlock use has no flag`;
      if (def.unlockNote.trim().length < 12) return `${def.id} unlock note is empty`;
      return null;
    case "catalog-note":
      if (!def.catalogNote) return `${def.id} catalog note is missing`;
      if (def.catalogNote.body.trim().length < 20) return `${def.id} catalog note is too short`;
      return null;
    case "ford":
      if (!def.ford) return `${def.id} ford use has no note`;
      if (def.ford.note.trim().length < 12) return `${def.id} ford note is empty`;
      return null;
    default:
      return `${def.id} handler ${use.handler} is not implemented`;
  }
}

function hasAnyEffect(effect: NonNullable<ItemDefinition["consumeEffect"]>): boolean {
  return ["satiety", "warmth", "light", "calm"].some((key) => {
    const value = effect[key as keyof typeof effect];
    return typeof value === "number" && value !== 0;
  });
}
