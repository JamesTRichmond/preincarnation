import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateReference, fromReference } from "./keep/adapter.ts";
import { CATALOG } from "./keep/catalog.ts";
import {
  advanceEra,
  cancelSmokehouse,
  challengeGift,
  contradictMeals,
  createSeed,
  exemptBroth,
  requestPurge,
  reviseChapel,
  splitOak,
} from "./keep/demo.ts";
import { evaluatePolicy } from "./keep/evaluator.ts";
import { PRESETS, rulesFromPreset } from "./keep/presets.ts";
import type { PolicyInput, Project, RecipeLine, Stack } from "./keep/types.ts";
import { deathKeepClause, explainDeathPack } from "./keep-pack.ts";
import { resolveDeath } from "./rules.ts";
import { defaultSave } from "./save.ts";

function stack(partial: Partial<Stack> & Pick<Stack, "id" | "itemId" | "quantity">): Stack {
  return {
    name: partial.name ?? partial.itemId,
    category: partial.category ?? "material",
    tags: partial.tags ?? [],
    eraId: partial.eraId ?? "era-7",
    acquiredAt: partial.acquiredAt ?? 1,
    ...partial,
  };
}

function line(itemId: string, quantity: number, substitutes: RecipeLine["substitutes"] = []): RecipeLine {
  return { itemId, quantity, substitutes };
}

function project(partial: Partial<Project> & Pick<Project, "id" | "lines">): Project {
  return {
    name: partial.name ?? partial.id,
    status: partial.status ?? "active",
    priority: partial.priority ?? 1,
    recipeRevision: partial.recipeRevision ?? 1,
    ...partial,
  };
}

function policy(partial: Partial<PolicyInput> & Pick<PolicyInput, "stacks">): PolicyInput {
  return {
    eraId: "era-7",
    eraIndex: 7,
    instanceDirectives: [],
    categoryRules: [],
    projects: [],
    offerSurplusForSale: false,
    ...partial,
  };
}

describe("conservation and explanation", () => {
  it("accounts for every unit and does not mutate the input", () => {
    const input = policy({
      stacks: [stack({ id: "a", itemId: "meal-broth", quantity: 12, category: "food", tags: ["healing"] })],
      categoryRules: rulesFromPreset("healing-meals"),
      offerSurplusForSale: true,
    });
    const frozen = structuredClone(input);
    const result = evaluatePolicy(input);
    assert.deepEqual(input, frozen);
    assert.equal(result.totals.quantity, 12);
    assert.equal(result.totals.protected + result.totals.reserved + result.totals.available, 12);
    assert.equal(result.surplusReview.autoDispose, false);
    assert.equal(result.dispositions[0]?.protected, 8);
    assert.equal(result.dispositions[0]?.saleOffer, 4);
    assert.match(result.dispositions[0]?.reasons.find((reason) => reason.layer === "surplus")?.text ?? "", /Not discarded/);
  });
});

describe("contradictory rules", () => {
  it("keeps the stricter healing floor and refuses a keep of zero as a release", () => {
    const input = policy({
      stacks: [stack({ id: "a", itemId: "meal-broth", quantity: 12, category: "food", tags: ["healing"] })],
      categoryRules: [
        ...rulesFromPreset("healing-meals"),
        {
          id: "low",
          name: "Release healing down to two",
          enabled: true,
          rank: 1,
          selector: { category: "food", tag: "healing" },
          keep: 2,
          grouping: "pool",
        },
        {
          id: "zero",
          name: "Keep none of the healing meals",
          enabled: true,
          rank: 2,
          selector: { category: "food", tag: "healing" },
          keep: 0,
          grouping: "pool",
        },
      ],
    });
    const result = evaluatePolicy(input);
    assert.equal(result.dispositions[0]?.protected, 8);
    assert.equal(result.dispositions[0]?.available, 4);
    assert.ok(result.conflicts.some((conflict) => conflict.resolution.includes("not a release")));
    assert.equal(result.surplusReview.autoDispose, false);
  });

  it("refuses automatic disposal even when asked", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [stack({ id: "a", itemId: "oak-beam", quantity: 3 })],
        requestedAutoDispose: true,
        offerSurplusForSale: true,
      }),
    );
    assert.equal(result.surplusReview.autoDispose, false);
    assert.equal(result.dispositions[0]?.quantity, 3);
    assert.ok(result.conflicts.some((conflict) => conflict.kind === "disposal" && conflict.resolution.includes("Refused")));
  });
});

describe("projects competing, cancelled, and retargeted", () => {
  it("gives shared stock to the higher-priority project and explains the shortfall", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [stack({ id: "oak", itemId: "oak-beam", quantity: 10 })],
        projects: [
          project({ id: "chapel", name: "Chapel", priority: 1, lines: [line("oak-beam", 8)] }),
          project({ id: "smoke", name: "Smokehouse", priority: 2, lines: [line("oak-beam", 6)] }),
        ],
      }),
    );
    const oak = result.dispositions[0];
    assert.equal(oak?.reserved, 10);
    assert.equal(oak?.reservedBy.find((entry) => entry.projectId === "chapel")?.quantity, 8);
    assert.equal(oak?.reservedBy.find((entry) => entry.projectId === "smoke")?.quantity, 2);
    const smoke = result.projects.find((entry) => entry.projectId === "smoke");
    assert.equal(smoke?.lines[0]?.shortfall, 4);
    assert.match(smoke?.lines[0]?.blockedBy[0]?.text ?? "", /Chapel/);
  });

  it("releases a cancelled project so the other job can take the stock", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [stack({ id: "oak", itemId: "oak-beam", quantity: 10 })],
        projects: [
          project({ id: "chapel", status: "cancelled", priority: 1, lines: [line("oak-beam", 8)] }),
          project({ id: "smoke", priority: 2, lines: [line("oak-beam", 6)] }),
        ],
      }),
    );
    assert.equal(result.dispositions[0]?.reservedBy.find((entry) => entry.projectId === "smoke")?.quantity, 6);
    assert.equal(result.dispositions[0]?.available, 4);
    assert.equal(result.projects.find((entry) => entry.projectId === "chapel")?.lines[0]?.shortfall, 0);
    assert.match(result.projects.find((entry) => entry.projectId === "chapel")?.lines[0]?.notes[0] ?? "", /Cancelled/);
  });

  it("does not reserve for a paused project", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [stack({ id: "oak", itemId: "oak-beam", quantity: 4 })],
        projects: [project({ id: "chapel", status: "paused", lines: [line("oak-beam", 4)] })],
      }),
    );
    assert.equal(result.dispositions[0]?.reserved, 0);
    assert.match(result.projects[0]?.lines[0]?.notes[0] ?? "", /Paused/);
  });

  it("follows the current recipe and drops the previous ingredient", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [
          stack({ id: "oak", itemId: "oak-beam", quantity: 8 }),
          stack({ id: "ash", itemId: "ash-beam", quantity: 4 }),
        ],
        projects: [
          project({
            id: "chapel",
            recipeRevision: 2,
            previousRevision: 1,
            previousLines: [line("oak-beam", 8)],
            lines: [line("ash-beam", 8)],
          }),
        ],
      }),
    );
    assert.equal(result.dispositions.find((entry) => entry.itemId === "oak-beam")?.reserved, 0);
    assert.equal(result.dispositions.find((entry) => entry.itemId === "ash-beam")?.reserved, 4);
    assert.equal(result.projects[0]?.lines[0]?.shortfall, 4);
    assert.match(result.projects[0]?.recipeNote ?? "", /revision 1 to 2/);
    assert.match(result.projects[0]?.lines[0]?.blockedBy.at(-1)?.text ?? "", /not in stock/);
  });
});

describe("substitutes", () => {
  it("uses a named substitute only for the shortfall and honors the ratio", () => {
    const covered = evaluatePolicy(
      policy({
        stacks: [
          stack({ id: "oak", itemId: "oak-beam", quantity: 2 }),
          stack({ id: "ash", itemId: "ash-beam", quantity: 10 }),
        ],
        projects: [project({ id: "chapel", lines: [line("oak-beam", 6, [{ itemId: "ash-beam", ratio: 2 }])] })],
      }),
    );
    assert.equal(covered.dispositions.find((entry) => entry.itemId === "oak-beam")?.reserved, 2);
    assert.equal(covered.dispositions.find((entry) => entry.itemId === "ash-beam")?.reserved, 8);
    assert.equal(covered.dispositions.find((entry) => entry.itemId === "ash-beam")?.available, 2);
    assert.equal(covered.projects[0]?.lines[0]?.shortfall, 0);

    const plenty = evaluatePolicy(
      policy({
        stacks: [
          stack({ id: "oak", itemId: "oak-beam", quantity: 6 }),
          stack({ id: "ash", itemId: "ash-beam", quantity: 10 }),
        ],
        projects: [project({ id: "chapel", lines: [line("oak-beam", 6, [{ itemId: "ash-beam", ratio: 1 }])] })],
      }),
    );
    assert.equal(plenty.dispositions.find((entry) => entry.itemId === "ash-beam")?.reserved, 0);
    assert.match(plenty.projects[0]?.lines[0]?.notes[0] ?? "", /not used/i);

    const unnamed = evaluatePolicy(
      policy({
        stacks: [
          stack({ id: "oak", itemId: "oak-beam", quantity: 1 }),
          stack({ id: "ash", itemId: "ash-beam", quantity: 9 }),
        ],
        projects: [project({ id: "chapel", lines: [line("oak-beam", 4)] })],
      }),
    );
    assert.equal(unnamed.dispositions.find((entry) => entry.itemId === "ash-beam")?.reserved, 0);
    assert.match(unnamed.projects[0]?.lines[0]?.notes.join(" ") ?? "", /No substitute is named/);
  });

  it("does not spend a protected unique as an undeclared stand-in", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [
          stack({ id: "resin", itemId: "star-resin", quantity: 1, unique: true, discovered: true, category: "material" }),
          stack({ id: "oak", itemId: "oak-beam", quantity: 1 }),
        ],
        categoryRules: rulesFromPreset("one-discovered"),
        projects: [project({ id: "chapel", lines: [line("oak-beam", 2)] })],
      }),
    );
    assert.equal(result.dispositions.find((entry) => entry.stackId === "resin")?.protected, 1);
    assert.equal(result.dispositions.find((entry) => entry.stackId === "resin")?.reserved, 0);
    assert.equal(result.projects[0]?.lines[0]?.fromSubstitute.length, 0);
  });
});

describe("split stacks, uniques, and gifts", () => {
  it("does not copy an instance protect onto the offcut, and does not double-count", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [
          stack({ id: "oak-door", itemId: "oak-beam", quantity: 6, lineageId: "oak-1", acquiredAt: 1 }),
          stack({ id: "oak-rest", itemId: "oak-beam", quantity: 4, lineageId: "oak-1", acquiredAt: 2 }),
        ],
        instanceDirectives: [
          { id: "door", stackId: "oak-door", mode: "protect", reason: "Door leaf only.", enabled: true },
        ],
        projects: [project({ id: "chapel", lines: [line("oak-beam", 8)] })],
      }),
    );
    const door = result.dispositions.find((entry) => entry.stackId === "oak-door");
    const rest = result.dispositions.find((entry) => entry.stackId === "oak-rest");
    assert.equal(door?.protected, 6);
    assert.equal(door?.reserved, 0);
    assert.equal(rest?.protected, 0);
    assert.equal(rest?.reserved, 4);
    assert.equal((door?.quantity ?? 0) + (rest?.quantity ?? 0), 10);
    assert.equal(result.totals.protected + result.totals.reserved + result.totals.available, 10);
    assert.match(result.projects[0]?.lines[0]?.blockedBy.map((note) => note.text).join(" ") ?? "", /oak-door/);
  });

  it("lets a category floor see both pieces of a split without an instance rule", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [
          stack({ id: "pipe-a", itemId: "blue-clay-pipe", quantity: 1, discovered: true, acquiredAt: 1, lineageId: "pipe" }),
          stack({ id: "pipe-b", itemId: "blue-clay-pipe", quantity: 2, discovered: true, acquiredAt: 2, lineageId: "pipe" }),
        ],
        categoryRules: rulesFromPreset("one-discovered"),
      }),
    );
    assert.equal(result.totals.quantity, 3);
    assert.equal(result.totals.protected, 1);
    assert.equal(result.dispositions.find((entry) => entry.stackId === "pipe-a")?.protected, 1);
    assert.equal(result.dispositions.find((entry) => entry.stackId === "pipe-b")?.available, 2);
  });

  it("protects a named gift only from its metadata, not from a similar unlabeled object", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [
          stack({
            id: "mara",
            itemId: "kettle-mara",
            name: "Mara’s kettle",
            quantity: 1,
            category: "gift",
            unique: true,
            gift: { from: "Mara", name: "For the winter you come back" },
            protectedMeta: { locked: true, reason: "For the winter you come back", author: "gift-record" },
          }),
          stack({ id: "plain", itemId: "kettle", name: "Iron kettle", quantity: 1, category: "gear" }),
        ],
        categoryRules: rulesFromPreset("named-gifts"),
        instanceDirectives: [
          { id: "try", stackId: "mara", mode: "exempt", reason: "Treat it as ordinary.", enabled: true },
        ],
      }),
    );
    const mara = result.dispositions.find((entry) => entry.stackId === "mara");
    const plain = result.dispositions.find((entry) => entry.stackId === "plain");
    assert.equal(mara?.protected, 1);
    assert.equal(mara?.exempt, false);
    assert.match(mara?.reasons[0]?.text ?? "", /not an inferred story/);
    assert.equal(plain?.protected, 0);
    assert.equal(plain?.giftName, undefined);
    assert.ok(result.conflicts.some((conflict) => conflict.kind === "metadata-vs-exempt"));
  });

  it("lets an instance exemption pull a stack out of a category floor", () => {
    const result = evaluatePolicy(
      policy({
        stacks: [
          stack({ id: "broth-a", itemId: "meal-broth", quantity: 6, category: "food", tags: ["healing"], acquiredAt: 1 }),
          stack({ id: "broth-b", itemId: "meal-broth", quantity: 4, category: "food", tags: ["healing"], acquiredAt: 2 }),
        ],
        categoryRules: rulesFromPreset("healing-meals"),
        instanceDirectives: [
          { id: "skip", stackId: "broth-a", mode: "exempt", reason: "Tonight’s pot.", enabled: true },
        ],
      }),
    );
    assert.equal(result.dispositions.find((entry) => entry.stackId === "broth-a")?.protected, 0);
    assert.equal(result.dispositions.find((entry) => entry.stackId === "broth-a")?.available, 6);
    assert.equal(result.dispositions.find((entry) => entry.stackId === "broth-b")?.protected, 4);
    assert.ok(result.ruleGaps.some((gap) => gap.text.includes("exemption")));
  });
});

describe("era transitions", () => {
  it("drops a current-era fishing floor without deleting bait, and starts prior-era curios", () => {
    const before = evaluatePolicy(
      policy({
        eraId: "era-7",
        stacks: [
          stack({ id: "worms", itemId: "nightcrawler", quantity: 10, category: "bait", tags: ["bait"], eraId: "era-7" }),
          stack({ id: "eye", itemId: "glass-eye", quantity: 1, category: "heirloom", tags: ["curiosity"], eraId: "era-7" }),
          stack({ id: "fern", itemId: "pressed-fern", quantity: 2, category: "heirloom", tags: ["curiosity"], eraId: "era-6" }),
        ],
        categoryRules: [...rulesFromPreset("fishing-sessions"), ...rulesFromPreset("prior-era-curios")],
      }),
    );
    assert.equal(before.dispositions.find((entry) => entry.stackId === "worms")?.protected, 8);
    assert.equal(before.dispositions.find((entry) => entry.stackId === "eye")?.protected, 0);
    assert.equal(before.dispositions.find((entry) => entry.stackId === "fern")?.protected, 1);

    const after = evaluatePolicy(
      policy({
        eraId: "era-8",
        eraIndex: 8,
        stacks: before.dispositions.map((entry) =>
          stack({
            id: entry.stackId,
            itemId: entry.itemId,
            name: entry.name,
            quantity: entry.quantity,
            category: entry.category,
            tags: entry.tags,
            eraId: entry.eraId,
            unique: entry.unique,
          }),
        ),
        categoryRules: [...rulesFromPreset("fishing-sessions"), ...rulesFromPreset("prior-era-curios")],
      }),
    );
    assert.equal(after.dispositions.find((entry) => entry.stackId === "worms")?.quantity, 10);
    assert.equal(after.dispositions.find((entry) => entry.stackId === "worms")?.protected, 0);
    assert.equal(after.dispositions.find((entry) => entry.stackId === "eye")?.protected, 1);
    assert.ok(after.eraEffects.some((effect) => effect.releasedQuantity > 0 && effect.text.includes("remain in stock")));
    assert.equal(after.surplusReview.autoDispose, false);
  });
});

describe("presets and the reference adapter", () => {
  it("offers twelve presets that do not require an entry per object", () => {
    assert.equal(PRESETS.length, 12);
    const rules = PRESETS.filter((preset) => preset.kind === "rules").flatMap((preset) => rulesFromPreset(preset.id));
    assert.ok(rules.length < 20);
    assert.ok(rules.every((rule) => rule.selector.itemId === undefined || presetTargetsBasket(rule.selector.itemId)));
  });

  it("evaluates the seeded life through the adapter", () => {
    const adapted = evaluateReference(createSeed(), CATALOG);
    assert.equal(adapted.directives.autoDispose, false);
    assert.equal("dispose" in adapted.directives, false);
    const sum = adapted.directives.stacks.reduce(
      (total, entry) => total + entry.protected + entry.reserved + entry.available,
      0,
    );
    assert.equal(sum, adapted.evaluation.totals.quantity);
    const oak = adapted.evaluation.dispositions.find((entry) => entry.stackId === "oak-1");
    assert.equal(oak?.reservedBy.find((entry) => entry.projectId === "project-chapel")?.quantity, 8);
    assert.equal(oak?.reservedBy.find((entry) => entry.projectId === "project-smokehouse")?.quantity, 2);
    const healing = adapted.evaluation.dispositions.filter((entry) => entry.tags.includes("healing") && entry.category === "food");
    assert.equal(
      healing.reduce((total, entry) => total + entry.protected, 0),
      8,
    );
    assert.equal(adapted.evaluation.dispositions.find((entry) => entry.stackId === "bandage-1")?.protected, 0);
    assert.equal(adapted.evaluation.dispositions.find((entry) => entry.stackId === "mara-1")?.protected, 1);
    assert.equal(adapted.evaluation.dispositions.find((entry) => entry.stackId === "note-1")?.giftName, undefined);
    assert.ok(adapted.directives.saleOffers.length > 0);
    assert.ok(adapted.directives.saleOffers.every((offer) => offer.quantity > 0));
    assert.equal(adapted.evaluation.dispositions.find((entry) => entry.stackId === "ore-1")?.protected, 0);
  });

  it("warns that a split does not inherit instance protection, and does not copy catalog uniqueness", () => {
    const split = evaluateReference(splitOak(createSeed()));
    assert.ok(split.warnings.some((warning) => warning.includes("were not copied")));
    assert.equal(split.evaluation.dispositions.find((entry) => entry.stackId === "oak-door")?.protected, 6);
    assert.equal(split.evaluation.dispositions.find((entry) => entry.stackId === "oak-rest")?.protected, 0);
    const bare = fromReference({
      eraId: "era-7",
      eraIndex: 7,
      stacks: [{ stackId: "r", sku: "star-resin", qty: 1 }],
      projects: [],
      rules: [],
    });
    assert.equal(bare.input.stacks[0]?.unique, false);
    assert.equal(bare.input.stacks[0]?.name, "Star resin");
  });

  it("runs the scripted contradictions, cancellation, recipe change, exemption, gift challenge, and purge", () => {
    const contradicted = evaluateReference(contradictMeals(createSeed()));
    assert.ok(contradicted.evaluation.conflicts.some((conflict) => conflict.text.includes("Release healing")));
    const healingProtected = contradicted.evaluation.dispositions
      .filter((entry) => entry.category === "food" && entry.tags.includes("healing"))
      .reduce((total, entry) => total + entry.protected, 0);
    assert.equal(healingProtected, 8);

    const cancelled = evaluateReference(cancelSmokehouse(createSeed()));
    const oak = cancelled.evaluation.dispositions.find((entry) => entry.stackId === "oak-1");
    assert.equal(oak?.reserved, 8);
    assert.equal(oak?.available, 2);

    const revised = evaluateReference(reviseChapel(createSeed()));
    assert.equal(revised.evaluation.dispositions.find((entry) => entry.itemId === "oak-beam")?.reserved, 6);
    assert.equal(revised.evaluation.dispositions.find((entry) => entry.itemId === "ash-beam")?.reserved, 4);
    assert.match(revised.evaluation.projects.find((entry) => entry.projectId === "project-chapel")?.recipeNote ?? "", /current lines/);

    const exempted = evaluateReference(exemptBroth(createSeed()));
    assert.equal(exempted.evaluation.dispositions.find((entry) => entry.stackId === "broth-a")?.available, 6);
    assert.ok(exempted.evaluation.ruleGaps.length > 0);

    const gift = evaluateReference(challengeGift(createSeed()));
    assert.equal(gift.evaluation.dispositions.find((entry) => entry.stackId === "mara-1")?.protected, 1);
    assert.ok(gift.evaluation.conflicts.some((conflict) => conflict.kind === "metadata-vs-exempt"));

    const purged = evaluateReference(requestPurge(createSeed()));
    assert.equal(purged.directives.autoDispose, false);
    assert.equal(purged.evaluation.totals.quantity, evaluateReference(createSeed()).evaluation.totals.quantity);

    const turned = evaluateReference(advanceEra(createSeed()));
    assert.equal(turned.evaluation.dispositions.find((entry) => entry.stackId === "worms")?.protected, 0);
    assert.equal(turned.evaluation.dispositions.find((entry) => entry.stackId === "worms")?.quantity, 10);
    assert.equal(turned.evaluation.dispositions.find((entry) => entry.stackId === "mara-1")?.protected, 1);
    assert.ok(turned.evaluation.eraEffects.length > 0);
  });
});

function presetTargetsBasket(itemId: string | undefined): boolean {
  return itemId === "nightcrawler" || itemId === "river-fly" || itemId === "hook" || itemId === "line-spool";
}

describe("this life's pack", () => {
  it("locks the waking blade and the bonded gift, and leaves surplus on the mound", () => {
    const save = defaultSave();
    save.character.bondId = "maeve";
    save.flags.relics = ["sword", "shovel", "lantern"];
    save.flags.arrows = 8;
    save.flags.bombs = 2;
    save.inventory = [
      save.inventory[0]!,
      {
        id: "farm-axe",
        name: "Farm axe",
        kind: "heavy",
        dmg: 2,
        speed: 0.2,
        reach: 14,
        combo: 1,
        projectile: false,
        affixes: [],
        flavor: "",
      },
    ];
    const before = save.inventory.length + save.flags.relics.length + save.flags.arrows + save.flags.bombs;
    resolveDeath(save, { mapId: "middlebury", x: 1, y: 1 }, 14);
    const report = explainDeathPack(save);
    assert.equal(report.autoDispose, false);
    assert.equal(report.quantity, before);
    assert.ok(report.locked.includes("Short iron"));
    assert.ok(report.locked.includes("Oil lamp"));
    assert.ok(report.floor.includes("Grave shovel"));
    assert.deepEqual(report.surplus.sort(), ["Arrows", "Farm axe", "Powder kegs"].sort());
    const clause = deathKeepClause(save);
    assert.match(clause, /not discarded/);
    assert.match(clause, /Farm axe/);
    assert.equal(save.inventory.length, 1);
    assert.equal(save.flags.graves[0]?.weapons[0]?.name, "Farm axe");
  });
});

