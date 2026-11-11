import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DISTRICT_META, ERAS, OPEN_TILES, TILE_NEED, TOOLS } from "./lib/constants.mjs";
import { DUNGEONS, PICKUPS, WARPS } from "./data/travel.mjs";
import {
  EDGE_OPS,
  ERA_CHANGES,
  EXTRA_OPS,
  SPANS,
  START_SCREEN,
  allTools,
  assemble,
  bfs,
  buildIndex,
  dungeonState,
  edgeKey,
  edgeState,
  screenGraph,
  talksAt,
  toolSet,
  warpsActive,
  withWarps,
} from "./lib/world.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const errors = [];
const fail = (msg) => errors.push(msg);
const MOUTH = {
  N: [[8, 0], [9, 0], [10, 0], [11, 0]],
  S: [[8, 13], [9, 13], [10, 13], [11, 13]],
  W: [[0, 5], [0, 6], [0, 7], [0, 8]],
  E: [[19, 5], [19, 6], [19, 7], [19, 8]],
};
const BACK = { N: "S", S: "N", E: "W", W: "E" };

function satisfies(need, tools) {
  if (!need) return true;
  if (need.needAll?.length && !need.needAll.every((t) => tools.has(t))) return false;
  if (need.needAny && !need.needAny.some((group) => group.every((t) => tools.has(t)))) return false;
  return true;
}

function walkable(tile, tools, need) {
  if (need && !satisfies(need, tools)) return false;
  if (OPEN_TILES.has(tile) || tile === "b" || tile === "u") return true;
  if (tile === "G") return Boolean(need) && satisfies(need, tools);
  const req = TILE_NEED[tile];
  if (req) return req.every((t) => tools.has(t));
  return false;
}

function flood(screen, tools) {
  const rows = screen.layout;
  const seen = new Set();
  const q = [[9, 6]];
  while (q.length) {
    const [x, y] = q.pop();
    const k = `${x},${y}`;
    if (seen.has(k) || y < 0 || x < 0 || y >= rows.length || x >= rows[0].length) continue;
    if (!walkable(rows[y][x], tools, screen.needs[k])) continue;
    seen.add(k);
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen;
}

function signature(cells, era) {
  const edges = {};
  const seen = new Set();
  for (const cell of cells.values()) {
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const other = `${cell.x + dx},${cell.y + dy}`;
      if (!cells.has(other)) continue;
      const key = edgeKey(cell.key, other);
      if (seen.has(key)) continue;
      seen.add(key);
      const state = edgeState(cell.key, other, era);
      edges[key] = {
        closed: Boolean(state.closed),
        needAll: state.needAll ?? [],
        needAny: state.needAny,
        oneway: state.oneway,
        error: state.error ?? null,
      };
    }
  }
  return {
    edges,
    spans: SPANS.map((span) => ({ id: span.id, on: era >= span.from, need: span.need ?? [], needAny: span.needAny ?? null })),
    warps: warpsActive(era).map((w) => w.id).sort(),
    dungeons: Object.fromEntries(DUNGEONS.map((d) => [d.id, dungeonState(d, era)])),
    talks: Object.fromEntries([...cells.values()].map((cell) => [cell.key, talksAt(cell.key, era).map((t) => t.id)]).filter(([, list]) => list.length)),
  };
}

function diffPartial(before, after, change) {
  const diffs = [];
  for (const opId of change.ops) {
    const edgeOp = EDGE_OPS.find((op) => op.id === opId);
    if (edgeOp) {
      const key = edgeKey(edgeOp.edge[0], edgeOp.edge[1]);
      if (JSON.stringify(before.edges[key]) !== JSON.stringify(after.edges[key])) diffs.push(opId);
      continue;
    }
    if (SPANS.some((s) => s.id === opId)) {
      const b = before.spans.find((s) => s.id === opId);
      const a = after.spans.find((s) => s.id === opId);
      if (JSON.stringify(b) !== JSON.stringify(a)) diffs.push(opId);
      continue;
    }
    const extra = EXTRA_OPS[opId];
    if (!extra) continue;
    if (extra.channel === "dungeon" && JSON.stringify(before.dungeons[extra.dungeon]) !== JSON.stringify(after.dungeons[extra.dungeon])) diffs.push(opId);
    if (extra.channel === "warp") {
      const changed = before.warps.includes(extra.warp) !== after.warps.includes(extra.warp)
        || (extra.alsoOff && before.warps.includes(extra.alsoOff) !== after.warps.includes(extra.alsoOff));
      if (changed) diffs.push(opId);
    }
    if (extra.channel === "interaction" && JSON.stringify(before.talks[extra.at] ?? []) !== JSON.stringify(after.talks[extra.at] ?? [])) diffs.push(opId);
  }
  return diffs;
}

function reach(world, era, tools, useWarps = false) {
  let adj = screenGraph(world.cells, era, tools);
  if (useWarps) adj = withWarps(adj, era);
  const start = world.screens.find((s) => s.id === START_SCREEN);
  const startKey = `${start.x},${start.y}`;
  const dist = bfs(startKey, adj);
  return { adj, dist, startKey };
}

function trapsOf(adj, dist, startKey) {
  const trapped = [];
  for (const key of dist.keys()) if (!bfs(key, adj).has(startKey)) trapped.push(key);
  return trapped;
}

function main() {
  const world0 = assemble(0);
  const { cells, byId } = buildIndex();
  if (world0.screens.length < 180) fail(`screens ${world0.screens.length}`);
  const counts = {};
  for (const s of world0.screens) counts[s.district] = (counts[s.district] ?? 0) + 1;
  for (const id of Object.keys(DISTRICT_META)) if ((counts[id] ?? 0) < 15) fail(`${id} ${counts[id] ?? 0}`);
  if (world0.hubs.length !== 10) fail("hubs");
  if (world0.interiors.length !== 60) fail("interiors");
  if (!byId.has(START_SCREEN)) fail("start missing");

  for (const s of world0.screens) {
    if (s.layout.length !== 14 || s.layout.some((row) => row.length !== 20)) fail(`${s.id} size`);
    if (!s.landmark || !s.role || !s.note) fail(`${s.id} copy`);
    if (!s.quiet && !s.encounter) fail(`${s.id} purpose`);
    for (const [dir, exit] of Object.entries(s.exits)) {
      if (!exit) continue;
      const other = world0.screens.find((x) => x.id === exit.to);
      if (!other || other.exits[BACK[dir]]?.to !== s.id) fail(`${s.id} ${dir} reciprocal`);
      if (other && Math.abs(other.x - s.x) + Math.abs(other.y - s.y) !== 1) fail(`${s.id} ${dir} spatial`);
    }
  }
  for (const op of EDGE_OPS) {
    const [a, b] = op.edge;
    if (!cells.has(a) || !cells.has(b)) fail(`${op.id} missing cell`);
    else if (Math.abs(cells.get(a).x - cells.get(b).x) + Math.abs(cells.get(a).y - cells.get(b).y) !== 1) fail(`${op.id} not adjacent`);
  }
  for (const span of SPANS) if (!cells.has(span.a) || !cells.has(span.b)) fail(`${span.id} span`);

  const interiors = new Map(world0.interiors.map((r) => [r.id, r]));
  for (const room of world0.interiors) {
    if (room.layout[8][6] !== "D") fail(`${room.id} door`);
    if (room.parent.kind === "screen" && !cells.has(room.parent.at)) fail(`${room.id} parent`);
    if (room.parent.kind === "hub" && !world0.hubs.some((h) => h.id === room.parent.id)) fail(`${room.id} hub`);
  }
  for (const hub of world0.hubs) {
    const screen = world0.screens.find((s) => `${s.x},${s.y}` === hub.from);
    if (!screen?.links.some((l) => l.kind === "hub" && l.id === hub.id)) fail(`${hub.id} screen link`);
    for (const [interiorId, x, y] of hub.doors) {
      if (hub.layout[y]?.[x] !== "D") fail(`${hub.id} ${interiorId} tile`);
      if (interiors.get(interiorId)?.parent?.id !== hub.id) fail(`${interiorId} parent hub`);
    }
  }
  for (const room of world0.interiors) {
    if (room.parent.kind === "screen") {
      const screen = world0.screens.find((s) => `${s.x},${s.y}` === room.parent.at);
      if (!screen?.links.some((l) => l.id === room.id)) fail(`${room.id} screen door`);
    }
  }
  if (DUNGEONS.length !== 16) fail("dungeon count");
  for (const d of DUNGEONS) {
    const screen = world0.screens.find((s) => `${s.x},${s.y}` === d.at);
    if (!screen?.links.some((l) => l.id === d.id)) fail(`${d.id} layout`);
  }
  const got = new Set(PICKUPS.map((p) => p.tool));
  for (const tool of TOOLS) if (!got.has(tool)) fail(`pickup ${tool}`);
  for (const pickup of PICKUPS) {
    if (pickup.at && !cells.has(pickup.at)) fail(pickup.tool);
    if (pickup.interior && !interiors.has(pickup.interior)) fail(pickup.tool);
  }
  for (const warp of WARPS) if (!cells.has(warp.at)) fail(warp.id);

  const per = {};
  for (const change of ERA_CHANGES) {
    if (change.kind !== "route" && change.kind !== "interaction") fail(change.id);
    for (const district of change.districts) per[district] = (per[district] ?? 0) + 1;
  }
  for (const district of Object.keys(DISTRICT_META)) if ((per[district] ?? 0) < 3) fail(`${district} era changes`);

  const sig = {};
  for (const era of [-1, ...ERAS]) sig[era] = signature(cells, Math.max(era, -1) === -1 && era === -1 ? -1 : era);
  for (const change of ERA_CHANGES) {
    const prev = ERAS[ERAS.indexOf(change.era) - 1];
    const diffs = diffPartial(sig[prev], sig[change.era], change);
    const missing = change.ops.filter((id) => !diffs.includes(id));
    if (missing.length) fail(`${change.id} inert: ${missing.join(", ")}`);
  }

  const profiles = [];
  for (const era of ERAS) {
    profiles.push([`e${era}-none`, era, toolSet([])]);
    profiles.push([`e${era}-all`, era, allTools()]);
    profiles.push([`e${era}-no-oar`, era, toolSet(TOOLS.filter((t) => t !== "void_oar"))]);
  }
  for (const [name, era, tools] of profiles) {
    const painted = assemble(era);
    const { adj, dist, startKey } = reach(painted, era, tools, false);
    const trapped = trapsOf(adj, dist, startKey);
    if (trapped.length) fail(`${name} traps ${trapped.join(",")}`);
    let mouthFails = 0;
    for (const screen of painted.screens) {
      const reached = flood(screen, tools);
      if (![ "9,6", "10,6", "9,7", "10,7" ].some((k) => reached.has(k))) {
        fail(`${screen.id} plaza ${name}`);
        continue;
      }
      for (const [dir, exit] of Object.entries(screen.exits)) {
        if (!exit || exit.closed) continue;
        const ok = exit.needAll.every((t) => tools.has(t)) && (!exit.needAny || exit.needAny.some((g) => g.every((t) => tools.has(t))));
        if (!ok) continue;
        if (exit.oneway && exit.oneway[0] !== `${screen.x},${screen.y}`) continue;
        if (!MOUTH[dir].some(([x, y]) => reached.has(`${x},${y}`))) {
          mouthFails += 1;
          if (mouthFails <= 12) fail(`${screen.id} ${dir} mouth ${name}`);
        }
      }
    }
  }

  const full = reach(assemble(70), 70, allTools(), false);
  const never = world0.screens.filter((s) => !full.dist.has(`${s.x},${s.y}`)).map((s) => s.id);
  if (never.length) fail(`never reachable: ${never.join(", ")}`);

  for (const pickup of PICKUPS) {
    const without = toolSet(TOOLS.filter((t) => t !== pickup.tool));
    const at = pickup.at ?? (interiors.get(pickup.interior).parent.kind === "screen"
      ? interiors.get(pickup.interior).parent.at
      : world0.hubs.find((h) => h.id === interiors.get(pickup.interior).parent.id).from);
    const { dist } = reach(assemble(0), 0, without, false);
    if (!dist.has(at)) fail(`${pickup.tool} gated behind itself`);
  }

  const noOar70 = reach(assemble(70), 70, toolSet(TOOLS.filter((t) => t !== "void_oar")), false);
  const oarDelta70 = [...full.dist.keys()].filter((k) => !noOar70.dist.has(k)).map((k) => world0.screens.find((s) => `${s.x},${s.y}` === k).id).sort();
  const noOar56 = reach(assemble(56), 56, toolSet(TOOLS.filter((t) => t !== "void_oar")), false);
  const oar56 = reach(assemble(56), 56, allTools(), false);
  const oarDelta56 = [...oar56.dist.keys()].filter((k) => !noOar56.dist.has(k)).map((k) => world0.screens.find((s) => `${s.x},${s.y}` === k).id).sort();
  const early = reach(assemble(0), 0, toolSet([]), false);
  const gated = world0.screens.filter((s) => !early.dist.has(`${s.x},${s.y}`)).map((s) => s.id).sort();

  const walk = reach(assemble(70), 70, allTools(), false);
  const warped = reach(assemble(70), 70, allTools(), true);
  const a = world0.screens.find((s) => s.id === "FER-04");
  const b = world0.screens.find((s) => s.id === "ORW-14");
  const walking = bfs(`${a.x},${a.y}`, walk.adj).get(`${b.x},${b.y}`);
  const withKnownWarps = bfs(`${a.x},${a.y}`, warped.adj).get(`${b.x},${b.y}`);

  const adjacency = {};
  for (const id of Object.keys(DISTRICT_META)) adjacency[id] = new Set();
  for (const s of world0.screens) {
    for (const exit of Object.values(s.exits)) {
      if (!exit) continue;
      const other = world0.screens.find((x) => x.id === exit.to);
      if (other.district !== s.district) adjacency[s.district].add(other.district);
    }
  }
  const adjacencyOut = Object.fromEntries(Object.entries(adjacency).map(([k, v]) => [k, [...v].sort()]));

  const report = {
    ok: errors.length === 0,
    counts: { screens: world0.screens.length, hubs: 10, interiors: 60, dungeons: 16, eraChanges: ERA_CHANGES.length },
    perDistrict: counts,
    eraChangesByDistrict: per,
    adjacency: adjacencyOut,
    conditionalAdjacency: [
      { districts: ["ferrisburgh", "bristol"], via: "span-monkton", era: 70 },
      { districts: ["new_haven", "vergennes"], via: "span-belden", era: 70, need: ["creek_boots"] },
      { districts: ["bristol", "lincoln"], via: "span-appalachian", era: 70, needAny: ["void_oar", "frost_notch"] },
    ],
    era0NoTools: early.dist.size,
    gatedAtEra0NoTools: gated,
    voidOarDeltaEra56: oarDelta56,
    voidOarDeltaEra70: oarDelta70,
    warpSample: { from: "FER-04", to: "ORW-14", walking, withKnownWarps },
    errors,
  };
  const outDir = path.join(here, "output");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "validation-report.json"), JSON.stringify(report, null, 2));
  const md = [
    "# Overworld validation",
    "",
    errors.length ? `FAILED ${errors.length}` : "Passed.",
    "",
    `Screens ${world0.screens.length}. Hubs 10. Interiors 60. Dungeons 16.`,
    "",
    "## Adjacency",
    ...Object.entries(adjacencyOut).map(([k, v]) => `- ${k}: ${v.join(", ")}`),
    "",
    "## Era changes",
    ...Object.entries(per).map(([k, v]) => `- ${k}: ${v}`),
    "",
    `Era 0 with no tools reaches ${early.dist.size} screens. Gated: ${gated.join(", ")}.`,
    `Void Oar adds at era 56: ${oarDelta56.join(", ") || "(none)"}.`,
    `Void Oar adds at era 70: ${oarDelta70.join(", ") || "(none)"}.`,
    `At era 70 the oar is no longer the only way into ORW-12; Ledge Iron opens the west cliff. SAL-06 stays drowned. QRY-15's rim collapses and becomes oar-only.`,
    `Spans that are not new screens: Dead Creek bridge skip (era 56), Crown Point shore seam (era 70, stays in Vermont), Belden weir (era 70, Creek Boots).`,
    `FER-04 to ORW-14 at era 70: ${walking} walking, ${withKnownWarps} with all warps known.`,
    "",
    ...errors.map((e) => `- ${e}`),
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "validation-report.md"), md);
  if (errors.length) {
    console.error(errors.slice(0, 50).join("\n"));
    console.error(`\n${errors.length} errors`);
    process.exit(1);
  }
  console.log(`ok ${world0.screens.length} screens; era0 ${early.dist.size}; oar70 ${oarDelta70.length}`);
}

main();
