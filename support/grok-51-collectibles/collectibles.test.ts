import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initialSave, reduce } from "./archive.ts";
import { copyLimit, mustCard } from "./cards.ts";
import { memoryStore, migrate, persist, SAVE_KEY, load } from "./save.ts";
import { effectiveBurden, stokeOf } from "./keeping.ts";
import { assessDeck } from "./rules.ts";
import { householdThread } from "./ui/thread.ts";
import { validateCatalog } from "./validate.ts";

describe("Fourteen Winters catalog", () => {
  it("seats every card, places every object, reads every paper, and walks every hunt", () => {
    const errors = validateCatalog();
    assert.deepEqual(errors, [], errors.join("\n"));
  });
});

describe("ledger limits", () => {
  it("refuses a fourth common and a second rare", () => {
    let save = initialSave();
    save = { ...save, cards: { ...save.cards, "fw-001": 4, "fw-004": 2 } };
    save = reduce(save, { type: "newDeck" });
    const fresh = save.activeDeckId;
    const common = "fw-001";
    for (let i = 0; i < 3; i += 1) save = reduce(save, { type: "addToDeck", deckId: fresh, cardId: common });
    const blocked = reduce(save, { type: "addToDeck", deckId: fresh, cardId: common });
    assert.match(blocked.lastNotice, /deck limit/);
    assert.equal(blocked.decks.find((deck) => deck.id === fresh)?.cards.filter((id) => id === common).length, 3);
    const rare = "fw-004";
    save = reduce(save, { type: "addToDeck", deckId: fresh, cardId: rare });
    const second = reduce(save, { type: "addToDeck", deckId: fresh, cardId: rare });
    assert.match(second.lastNotice, /deck limit/);
    assert.equal(copyLimit(mustCard(rare)), 1);
  });

  it("rejects a deck that breaks the bond, the kin count, or the weather cap", () => {
    const save = initialSave();
    const deck = save.decks[0];
    assert.ok(deck);
    const short = assessDeck(deck.cards.slice(0, 11), deck.bond);
    assert.equal(short.ok, false);
    const noKin = assessDeck(
      Array.from({ length: 40 }, () => "fw-005"),
      "hearth",
    );
    assert.equal(noKin.ok, false);
    const weather = ["fw-012", "fw-024", "fw-036", "fw-048", "fw-060", "fw-072", "fw-012"];
    const padded = [
      ...weather,
      ...Array.from({ length: 33 }, (_, index) => (index % 2 === 0 ? "fw-001" : "fw-002")),
    ];
    const heavy = assessDeck(padded, "hearth");
    assert.equal(heavy.ok, false);
    assert.ok(heavy.errors.some((line) => /weather/i.test(line)));
  });
});

describe("quest evidence", () => {
  it("does not come out of the desk", () => {
    const save = initialSave();
    const before = save.documents.join(",");
    const next = reduce(save, { type: "discard", docId: "doc-15" });
    assert.equal(next.documents.join(","), before);
    assert.match(next.lastNotice, /cannot be discarded/);
    assert.equal(save.documents.join(","), before);
  });
});

describe("duplicates and surplus", () => {
  it("records a second watch without a second object", () => {
    const save = initialSave();
    save.decorations.push("dec-11");
    const again = reduce(
      { ...save, decorations: save.decorations },
      { type: "place", decorationId: "dec-11", slotId: "mantel-1" },
    );
    assert.match(again.lastNotice, /occupied|Clear/);
    const cleared = reduce(save, { type: "clear", slotId: "mantel-1" });
    const placed = reduce(cleared, { type: "place", decorationId: "dec-11", slotId: "mantel-1" });
    assert.equal(placed.placed["mantel-1"]?.decorationId, "dec-11");
    const owned = placed.decorations.filter((id) => id === "dec-11");
    assert.equal(owned.length, 1);
  });
});

describe("save", () => {
  it("migrates an unversioned card map and restores a round trip", () => {
    const migrated = migrate({ cards: { "fw-001": 9 }, version: undefined });
    assert.equal(migrated.version, 1);
    assert.equal(migrated.cards["fw-001"], 9);
    assert.ok(migrated.decks.length > 0);
    const store = memoryStore();
    persist(migrated, store);
    const loaded = load(store);
    assert.equal(loaded.cards["fw-001"], 9);
    assert.equal(store.getItem(SAVE_KEY)?.includes("\"version\":1"), true);
    const broken = load(memoryStore("{"));
    assert.equal(broken.version, 1);
    assert.equal(broken.cards["fw-004"], 1);
  });
});

describe("keeping math", () => {
  it("adds weather tax to the burden and not to the stoke", () => {
    let save = initialSave();
    save = reduce(save, { type: "seat", cardId: "fw-012" });
    save = reduce(save, { type: "startKeeping", openWith: "fw-012" });
    assert.ok(save.keeping);
    assert.equal(save.keeping?.hand[0], "fw-012");
    save = reduce(save, { type: "playCard", cardId: "fw-012" });
    assert.ok(save.keeping);
    assert.equal(save.keeping?.weather?.cardId, "fw-012");
    assert.equal(effectiveBurden(save.keeping!), 2);
    assert.equal(stokeOf(save.keeping!), 0);
  });
});

describe("tonight", () => {
  it("sends a new keeping room to the unread sugar ridge map", () => {
    const thread = householdThread(initialSave());
    assert.equal(thread.tab, "desk");
    assert.match(thread.title, /sugar ridge/i);
  });

  it("stays with an open winter until the table is left", () => {
    let save = initialSave();
    save = reduce(save, { type: "startKeeping" });
    const thread = householdThread(save);
    assert.equal(thread.tab, "table");
    assert.match(thread.title, /Winter 1/);
  });
});
