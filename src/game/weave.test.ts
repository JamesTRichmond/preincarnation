import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createWeave, type WeaveSync } from "./weave.ts";

function field(over: Partial<WeaveSync> = {}): WeaveSync {
  return {
    mapId: "middlebury",
    mapW: 800,
    mapH: 800,
    player: { x: 100, y: 200, dir: 2, moving: false },
    view: { x: 0, y: 80, w: 320, h: 240 },
    foes: [],
    solids: [],
    shrines: [],
    sugar: null,
    ash: null,
    reduced: false,
    ...over,
  };
}

describe("county weave", () => {
  it("leaves an ordinary cut alone when nothing is attuned", () => {
    const weave = createWeave();
    weave.sync(field({ foes: [{ id: "crow", x: 130, y: 200, alive: true, boss: false }] }));
    const cast = weave.cast("strike");
    assert.equal(cast.consumed, false);
    assert.equal(cast.choice, null);
    assert.equal(weave.pullHits().length, 0);
  });

  it("turns a close cut into a fixed fan, and a smaller fan when effects are reduced", () => {
    const foe = { id: "crow", x: 132, y: 200, alive: true, boss: false };
    const full = createWeave();
    full.sync(field({ ash: "handful-of-cinders", foes: [foe] }));
    const cast = full.cast("strike");
    assert.equal(cast.consumed, true);
    const made = (full.world.events as { type: string; made?: number }[]).find((e) => e.type === "handful");
    assert.equal(made?.made, 5);

    const small = createWeave();
    small.sync(field({ ash: "handful-of-cinders", foes: [foe], reduced: true }));
    small.cast("strike");
    const fewer = (small.world.events as { type: string; made?: number }[]).find((e) => e.type === "handful");
    assert.equal(fewer?.made, 3);
    assert.ok(small.pullHits().some((h) => h.id === "crow" && h.hearts > 0));
  });

  it("does not strike a hand that is off the screen", () => {
    const weave = createWeave();
    weave.sync(
      field({
        ash: "handful-of-cinders",
        view: { x: 0, y: 80, w: 120, h: 80 },
        foes: [{ id: "crow", x: 132, y: 200, alive: true, boss: false }],
      }),
    );
    const cast = weave.cast("strike");
    assert.equal(cast.consumed, false);
  });

  it("treats the quarry sentinel as a boss", () => {
    const weave = createWeave();
    weave.sync(
      field({
        foes: [{ id: "sentinel", x: 140, y: 200, alive: true, boss: true }],
      }),
    );
    const actor = (weave.world.actors as { id: string; boss: boolean; immunities: { displace?: boolean } }[]).find(
      (a) => a.id === "sentinel",
    );
    assert.equal(actor?.boss, true);
    assert.equal(actor?.immunities.displace, true);
  });

  it("threads two hands, and a marble seal keeps the thread from forming", () => {
    const foes = [
      { id: "a", x: 220, y: 160, alive: true, boss: false },
      { id: "b", x: 220, y: 240, alive: true, boss: false },
    ];
    const open = createWeave();
    open.sync(field({ sugar: "thread-the-needle", foes }));
    assert.equal(open.cast("shot").consumed, true);
    for (let i = 0; i < 80; i++) open.tick(1 / 60);
    assert.ok((open.world.tethers as { alive: boolean }[]).some((t) => t.alive));

    const sealed = createWeave();
    sealed.sync(
      field({
        sugar: "thread-the-needle",
        foes,
        solids: [{ x: 208, y: 188, w: 24, h: 24, seal: true }],
      }),
    );
    assert.equal(sealed.cast("shot").consumed, true);
    for (let i = 0; i < 80; i++) sealed.tick(1 / 60);
    assert.equal((sealed.world.tethers as { alive: boolean }[]).some((t) => t.alive), false);
  });

  it("will not brace sap into empty ground, and will brace a shrine that is in reach", () => {
    const bare = createWeave();
    bare.sync(field({ sugar: "sap-pressure" }));
    const missed = bare.cast("brace");
    assert.equal(missed.consumed, false);
    assert.match(missed.line, /no accessible anchor/i);

    const shrine = createWeave();
    shrine.sync(
      field({
        sugar: "sap-pressure",
        shrines: [{ id: "green-shrine", x: 140, y: 200 }],
      }),
    );
    const held = shrine.cast("brace");
    assert.equal(held.consumed, true);
    assert.equal((shrine.world as { channel?: { abilityId?: string } | null }).channel?.abilityId, "sap-pressure");
  });
});
