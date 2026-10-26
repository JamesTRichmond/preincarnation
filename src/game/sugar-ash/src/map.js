// @ts-nocheck
import { addActor, addAnchor, addBlocker, addSeal, addWall, createWorld } from "./state.js";

export const YARD = {
  bounds: { x: 0, y: 0, w: 1200, h: 800 },
  ellis: { x: 250, y: 470 },
  fixture: { x: 210, y: 390 },
};

/** A fixed Addison County sugarhouse yard. Not procedural. One Ellis. */
export function createYard() {
  const world = createWorld({
    ai: true,
    autoAwareness: true,
    bounds: YARD.bounds,
    camera: { x: 80, y: 140, w: 720, h: 460 },
    settings: { reducedEffects: false, ambientRegen: true },
    sugar: "thread-the-needle",
    ash: "orchard-of-embers",
  });
  world.resources.sap = 80;
  world.resources.ember = 76;

  addWall(world, { x: 70, y: 70, w: 230, h: 150 });
  addWall(world, { x: 40, y: 40, w: 1120, h: 28 });
  addSeal(world, { x: 980, y: 160, w: 26, h: 460 });

  const trees = [
    [520, 180],
    [680, 170],
    [840, 200],
    [560, 340],
    [760, 320],
    [900, 360],
  ];
  for (const [x, y] of trees) addBlocker(world, { x, y, r: 26 });

  addAnchor(world, {
    id: "cornerstone",
    x: YARD.fixture.x,
    y: YARD.fixture.y,
    anchorKind: "fixture",
    name: "cornerstone",
    hp: 999,
  });

  addActor(world, {
    id: "ellis",
    name: "Ellis",
    x: YARD.ellis.x,
    y: YARD.ellis.y,
    team: "ellis",
    hp: 120,
    r: 14,
    speed: 178,
    color: "#3e5c78",
  });
  addActor(world, { id: "row-hand", name: "Row hand", x: 560, y: 520, hp: 70, color: "#6b3a32" });
  addActor(world, { id: "boil-hand", name: "Boil hand", x: 690, y: 560, hp: 70, color: "#7a4530" });
  addActor(world, {
    id: "warden",
    name: "Orchard warden",
    x: 760,
    y: 680,
    hp: 240,
    boss: true,
    r: 22,
    color: "#2a2428",
  });
  addActor(world, {
    id: "sealed-row",
    name: "Sealed hand",
    x: 1100,
    y: 400,
    hp: 60,
    color: "#3d4a6b",
  });
  world.decals.push(
    { x: 150, y: 250, text: "SUGARHOUSE" },
    { x: 930, y: 150, text: "PUZZLE SEAL" },
    { x: 1040, y: 150, text: "DOES NOT CROSS" },
  );
  return world;
}
