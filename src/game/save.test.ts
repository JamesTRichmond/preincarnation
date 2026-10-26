import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { TILE } from "./snes.ts";
import { clearSave, defaultSave, loadSave, migrate, writeSave } from "./save.ts";
import { SAVE_KEY, SAVE_VERSION, type SaveData } from "./types.ts";
import { createCreekPilot } from "./fishing/bridge.ts";

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
    const raw = defaultSave();
    raw.version = 8;
    const s = migrate(raw);
    assert.equal(s.flags.relics.includes("lantern"), false);
    assert.equal(s.cycle, 0);
    assert.equal(s.creek, null);
    assert.equal(s.version, SAVE_VERSION);
  });

  it("keeps a mid-fight creek on a v9 life and drops a corrupt one", () => {
    const pilot = createCreekPilot();
    pilot.enter("bristol", 15, true);
    const session = pilot.session();
    assert.ok(session);
    session.phase = "fight";
    session.fight = {
      speciesId: "brook-trout",
      catchId: "c-1",
      script: [{ state: "steady", dur: 1 }],
      index: 0,
      stateTime: 0,
      elapsed: 0.4,
      lineOut: 0.5,
      tension: 9,
      overSeconds: 0,
      spit: 0,
      coverDanger: 0,
      jumps: 0,
      peakTension: 0.4,
      rod: 0,
      outcome: "fighting",
      coverSide: 0,
    };
    const life = defaultSave();
    life.creek = pilot.blob();
    writeSave(life);
    const loaded = loadSave();
    assert.equal(loaded.version, 9);
    assert.equal(loaded.creek?.session.phase, "fight");
    assert.ok((loaded.creek?.session.fight?.tension ?? 2) <= 1.25);
    life.creek = { version: 1, session: { phase: "nope" } } as unknown as SaveData["creek"];
    const broken = migrate(life);
    assert.equal(broken.creek, null);
    assert.equal(broken.mapId, life.mapId);
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
