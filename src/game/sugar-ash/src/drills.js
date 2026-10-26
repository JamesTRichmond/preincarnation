// @ts-nocheck
/**
 * Scripted demonstrations. They call the same verbs as a player.
 * Nothing in here steers a projectile.
 */
import { addActor, addAnchor, createWorld, ellisOf, plantBlossom } from "./state.js";
import { attune, enqueue, releaseBrace, step } from "./step.js";

function field() {
  const world = createWorld({
    ai: false,
    autoAwareness: true,
    bounds: { x: 0, y: 0, w: 900, h: 600 },
    camera: { x: 0, y: 0, w: 900, h: 600 },
    settings: { ambientRegen: false, reducedEffects: false },
  });
  addActor(world, {
    id: "ellis",
    name: "Ellis",
    x: 180,
    y: 300,
    team: "ellis",
    hp: 200,
    r: 14,
    facing: 0,
  });
  addAnchor(world, { id: "drill-stake", x: 168, y: 300, anchorKind: "stake", name: "drill stake" });
  world.decals.push({ x: 24, y: 36, text: "DRILL" });
  return world;
}

function foe(world, spec) {
  return addActor(world, {
    name: spec.name ?? "foe",
    team: "foe",
    hp: 90,
    r: 14,
    ai: false,
    ...spec,
  });
}

export const DRILLS = [
  {
    id: "sap-lit-wick",
    name: "Sap-lit Wick",
    detail: "A straight sap bolt burns the bud it crosses. The neighbor does not chain.",
    build() {
      const world = field();
      foe(world, { id: "wick-foe", x: 760, y: 300, hp: 90 });
      return {
        world,
        events: [
          {
            t: 0,
            fn(w) {
              attune(w, "ash", "orchard-of-embers");
              attune(w, "sugar", null);
              enqueue(w, "shot", { aimX: 800, aimY: 300 });
            },
          },
          {
            t: 1.15,
            fn(w) {
              const bud = w.blossoms.find((b) => b.alive);
              if (bud) {
                const n = plantBlossom(w, { x: bud.x, y: bud.y + 52, deliberate: true });
                if (n) {
                  n.armed = true;
                  n.id = "wick-neighbor";
                }
                const body = w.actors.find((a) => a.id === "wick-foe");
                if (body) {
                  body.x = bud.x + 60;
                  body.y = bud.y;
                  body.onScreen = true;
                  body.alive = true;
                }
              }
              attune(w, "sugar", "sap-pressure");
              enqueue(w, "brace");
            },
          },
          {
            t: 2.2,
            fn(w) {
              releaseBrace(w);
            },
          },
        ],
      };
    },
  },
  {
    id: "debt-kindling",
    name: "Debt Kindling",
    detail: "A bloom eats one wreath loop for a flat bonus. It does not also multiply.",
    build() {
      const world = field();
      foe(world, { id: "kindle", x: 228, y: 300, hp: 140 });
      return {
        world,
        events: [
          {
            t: 0,
            fn(w) {
              attune(w, "sugar", "wreath-of-debts");
              attune(w, "ash", "orchard-of-embers");
              enqueue(w, "shot", { aimX: 228, aimY: 300 });
            },
          },
          {
            t: 0.55,
            fn(w) {
              enqueue(w, "shot", { aimX: 228, aimY: 300 });
            },
          },
          {
            t: 1.15,
            fn(w) {
              attune(w, "ash", "lantern-debt");
              enqueue(w, "shot", { aimX: 228, aimY: 300 });
            },
          },
          {
            t: 2.05,
            fn(w) {
              enqueue(w, "strike", { aimX: 228, aimY: 300 });
            },
          },
        ],
      };
    },
  },
  {
    id: "glass-orchard",
    name: "Glass Orchard",
    detail: "The shatter puts the bud out. It does not bloom.",
    build() {
      const world = field();
      foe(world, { id: "ga", x: 340, y: 246 });
      foe(world, { id: "gb", x: 340, y: 354 });
      // Off the shot line (y=300). A later diagonal crosses the vertical thread;
      // traveling along x=340 is collinear and never counts as a crossing.
      foe(world, { id: "walker", x: 260, y: 180 });
      return {
        world,
        events: [
          {
            t: 0,
            fn(w) {
              attune(w, "sugar", "thread-the-needle");
              attune(w, "ash", null);
              enqueue(w, "shot", { aimX: 700, aimY: 300 });
            },
          },
          {
            t: 1.05,
            fn(w) {
              const bud = plantBlossom(w, { x: 340, y: 300, deliberate: true });
              if (bud) {
                bud.armed = true;
                bud.id = "glass-bud";
              }
              attune(w, "sugar", "sugar-glass");
              enqueue(w, "brace");
            },
          },
          {
            t: 1.9,
            fn(w) {
              const walker = w.actors.find((a) => a.id === "walker");
              if (walker) walker.drive = { x: 180, y: 200 };
            },
          },
        ],
      };
    },
  },
  {
    id: "needle-through-coals",
    name: "Needle through Coals",
    detail: "The letter sits on the line. The needle spends it and the thread starts tighter.",
    build() {
      const world = field();
      foe(world, { id: "na", x: 420, y: 250 });
      foe(world, { id: "nb", x: 420, y: 350 });
      return {
        world,
        events: [
          {
            t: 0,
            fn(w) {
              attune(w, "ash", "cinder-letter");
              attune(w, "sugar", null);
              enqueue(w, "shot", { aimX: 760, aimY: 300 });
            },
          },
          {
            t: 1.15,
            fn(w) {
              attune(w, "ash", null);
              attune(w, "sugar", "thread-the-needle");
              enqueue(w, "shot", { aimX: 760, aimY: 300 });
            },
          },
        ],
      };
    },
  },
];

export function buildDrill(id) {
  const drill = DRILLS.find((d) => d.id === id);
  if (!drill) throw new Error("unknown drill " + id);
  return drill.build();
}

/** Headless playback used by tests and by anyone wiring a replay. */
export function playDrill(id) {
  const { world, events } = buildDrill(id);
  const end = events.reduce((m, e) => Math.max(m, e.t), 0) + 1.4;
  let i = 0;
  const ordered = [...events].sort((a, b) => a.t - b.t);
  let t = 0;
  while (t < end - 1e-6) {
    while (i < ordered.length && ordered[i].t <= t + 1e-4) {
      ordered[i].fn(world);
      i += 1;
    }
    step(world, 1 / 60);
    t += 1 / 60;
  }
  return world;
}

export function drillEllis(world) {
  return ellisOf(world);
}
