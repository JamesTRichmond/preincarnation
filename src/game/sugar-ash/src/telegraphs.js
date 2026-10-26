// @ts-nocheck
import { LIMITS } from "./constants.js";
import { faceVec, ellisOf, endpoint } from "./state.js";

/** Sim-owned telegraphs. The renderer does not invent timing or shape. */
export function buildTelegraphs(world) {
  const out = [];
  const e = ellisOf(world);
  if (!e) return out;
  const f = faceVec(e);
  const shotWeaves = new Set([
    "thread-the-needle",
    "orchard-lease",
    "orchard-of-embers",
    "last-arrow-first",
    "cinder-letter",
    "split-the-billet",
    "lantern-debt",
    "fourteen-winters",
    "soot-covenant",
  ]);
  if (shotWeaves.has(world.attune.sugar) || shotWeaves.has(world.attune.ash) || world.prepared) {
    out.push({
      kind: "aim",
      x1: e.x,
      y1: e.y,
      x2: e.x + f.x * 120,
      y2: e.y + f.y * 120,
      dash: true,
      tone: world.attune.ash && shotWeaves.has(world.attune.ash) ? "ash" : "sugar",
    });
  }
  if (world.prepared) {
    out.push({
      kind: "text",
      x: e.x,
      y: e.y - 28,
      text: world.time >= world.prepared.readyAt ? "LOOSE" : "NOCK",
    });
  }
  const ch = world.channel;
  if (ch?.abilityId === "sap-pressure") {
    const a = world.anchors.find((x) => x.id === ch.payload.anchorId);
    if (a) {
      out.push({ kind: "anchor-line", x1: e.x, y1: e.y, x2: a.x, y2: a.y, tension: ch.payload.tension });
      out.push({
        kind: "text",
        x: (e.x + a.x) / 2,
        y: (e.y + a.y) / 2 - 14,
        text: `PRESSURE ${Math.round(ch.payload.tension)}`,
      });
    }
    out.push({
      kind: "aim",
      x1: e.x,
      y1: e.y,
      x2: e.x + f.x * (40 + ch.payload.tension),
      y2: e.y + f.y * (40 + ch.payload.tension),
      dash: false,
      tone: "sugar",
    });
  }
  if (ch?.abilityId === "kiln-bloom") {
    out.push({
      kind: "text",
      x: e.x,
      y: e.y - 36,
      text: "KILN",
    });
    out.push({
      kind: "corridor",
      ox: e.x,
      oy: e.y,
      fx: f.x,
      fy: f.y,
      length: 220,
      half: world.settings.reducedEffects ? 36 : 56,
    });
  }
  if (ch?.abilityId === "the-last-sugarhouse" && ch.payload.rect) {
    out.push({ kind: "footprint", ...ch.payload.rect });
  }
  if (ch?.abilityId === "canopy-of-accounts") {
    out.push({ kind: "text", x: e.x, y: e.y - 36, text: "ACCOUNTS" });
  }
  if (ch?.abilityId === "stake-the-row") {
    out.push({ kind: "circle", x: ch.payload.x, y: ch.payload.y, r: 16, tone: "sugar" });
  }
  for (const te of world.tethers) {
    if (!te.alive) continue;
    const A = endpoint(world, te, "a");
    const B = endpoint(world, te, "b");
    if (!A || !B) continue;
    out.push({
      kind: "tether",
      x1: A.x,
      y1: A.y,
      x2: B.x,
      y2: B.y,
      tension: te.tension,
      slack: te.slack,
      glazed: te.glazed,
      arm: te.glazeArm ?? 0,
      lease: te.lease,
    });
  }
  for (const b of world.blossoms) {
    if (!b.alive) continue;
    out.push({
      kind: "blossom",
      x: b.x,
      y: b.y,
      r: b.r,
      arm: Math.min(1, b.arm / b.armTime),
      armed: b.armed,
      banked: b.banked,
      deliberate: b.deliberate,
    });
  }
  for (const m of world.marks) {
    if (!m.alive) continue;
    out.push({ kind: "mark", x: m.x, y: m.y, banked: m.banked });
  }
  for (const z of world.zones) {
    if (z.alive && z.kind === "sugarhouse") out.push({ kind: "footprint", x: z.x, y: z.y, w: z.w, h: z.h, live: true });
  }
  if (world.pendingChoice) {
    out.push({ kind: "text", x: e.x, y: e.y - 48, text: "CHOOSE A WEAVE" });
  }
  if (world.attune.sugar === "handful-of-cinders") {
    const angles = world.settings.reducedEffects ? LIMITS.fanAnglesReduced : LIMITS.fanAngles;
    out.push({ kind: "fan", x: e.x, y: e.y, fx: f.x, fy: f.y, angles });
  }
  return out;
}
