import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { TILE } from "./snes.ts";
import { clearSave, defaultSave, loadSave, migrate, writeSave } from "./save.ts";
import { SAVE_KEY, SAVE_VERSION, type SaveData } from "./types.ts";

const mem = new Map<string, string>();

const storage: Storage = {
  get length() {
    return mem.size;
  },
  clear() {
    mem.clear();
  },
  getItem(key: string) {
    return mem.has(key) ? mem.get(key)! : null;
  },
  key(index: number) {
    return [...mem.keys()][index] ?? null;
  },
  removeItem(key: string) {
    mem.delete(key);
  },
  setItem(key: string, value: string) {
    mem.set(key, value);
  },
};

(globalThis as { localStorage: Storage }).localStorage = storage;

afterEach(() => {
  mem.clear();
});

describe("defaultSave", () => {
  it("wakes a wanderer on the Green with three skill and a short iron", () => {
    const s = defaultSave();
    assert.equal(s.version, SAVE_VERSION);
    assert.equal(s.cycle, 0);
    assert.equal(s.incarnation, "wanderer");
    assert.equal(s.maxHp, 3);
    assert.equal(s.character.skillPoints, 3);
    assert.equal(s.character.created, false);
    assert.deepEqual(s.flags.relics, ["sword"]);
    assert.equal(s.flags.ySlot, null);
    assert.equal(s.inventory[0].id, "starter-iron");
    assert.equal(s.x, 12 * TILE + 8);
  });
});

describe("migrate", () => {
  it("fills lastDeed and returnedFromDeath on v7 blobs", () => {
    const raw = {
      version: 7,
      cycle: 2,
      karma: 4,
      crowns: 0,
      incarnation: "wanderer",
      upgrades: { vitality: 1 },
      flags: { relics: ["sword", "shovel"], talked: ["elder"] },
      maxHp: 8,
      hp: 8,
      mapId: "middlebury",
      x: 40,
      y: 40,
      inventory: [],
      equippedId: "",
      character: { name: "Ira Fenn", created: true, bondId: "maeve" },
    } as unknown as SaveData;
    const s = migrate(raw);
    assert.equal(s.version, SAVE_VERSION);
    assert.equal(s.flags.lastDeed, "");
    assert.equal(s.flags.returnedFromDeath, false);
    assert.equal(s.character.name, "Ira Fenn");
    assert.equal(s.character.bondId, "maeve");
    assert.equal(s.upgrades.vitality, 1);
    assert.equal(s.upgrades.edge, 0);
    assert.equal(s.inventory[0].id, "starter-iron");
    assert.deepEqual(s.flags.talked, ["elder"]);
  });

  it("does not invent a lantern for a first-life v8 save", () => {
    const s = migrate(defaultSave());
    assert.equal(s.flags.relics.includes("lantern"), false);
    assert.equal(s.cycle, 0);
  });
});

describe("writeSave / loadSave", () => {
  it("round-trips through storage and a backup key", () => {
    const s = defaultSave();
    s.character.name = "Ira Fenn";
    s.character.created = true;
    writeSave(s);
    assert.ok(mem.get(SAVE_KEY));
    const loaded = loadSave();
    assert.equal(loaded.character.name, "Ira Fenn");
    assert.equal(loaded.character.created, true);
  });

  it("falls back to a new life when storage is empty or garbage", () => {
    assert.equal(loadSave().character.name, "Ellis Perch");
    mem.set(SAVE_KEY, "{not json");
    assert.equal(loadSave().cycle, 0);
  });

  it("clearSave forgets the blob", () => {
    writeSave(defaultSave());
    clearSave();
    assert.equal(mem.has(SAVE_KEY), false);
  });
});
