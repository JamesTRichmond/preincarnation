import { districts } from "./districts.mjs";
import { dungeons } from "./dungeons.mjs";
import * as map from "./fragment-map.mjs";
import { createState, resolveAction, shiftEra, simulate } from "./logic.mjs";
import { situations } from "./situations.mjs";

const VENUES = ["home", "workshop", "boat", "orchard", "farm", "ruin", "quarry", "dungeon", "cache"];
const KINDS = ["ordinary", "equipment", "relic", "provision", "collectible"];
const PRESENT = ["container", "world-pickup", "on-character", "hidden-compartment", "buried-cache"];
const BANNED = [/glowing/i, /loot chest/i, /randomly generated/i, /procedural/i, /treasure chest/i];

function push(errors, ok, msg) {
  if (!ok) errors.push(msg);
}

export function validateReport() {
  const errors = [];
  const warnings = [];
  const byId = new Map();
  for (const s of situations) {
    if (byId.has(s.id)) errors.push(`duplicate situation id ${s.id}`);
    byId.set(s.id, s);
  }

  push(errors, situations.length >= 120, `need >= 120 situations, have ${situations.length}`);
  push(errors, situations.filter((s) => s.playableInFragment).length >= 20, "fragment needs >= 20");

  const districtIds = new Set(districts.map((d) => d.id));
  const dungeonIds = new Set(dungeons.map((d) => d.id));
  const venueCount = Object.fromEntries(VENUES.map((v) => [v, 0]));
  const kindCount = Object.fromEntries(KINDS.map((k) => [k, 0]));
  const itemPlacements = new Map();
  const anchors = new Set();
  const successSeen = new Map();

  for (const s of situations) {
    push(errors, districtIds.has(s.districtId), `${s.id} bad district`);
    push(errors, !s.dungeonId || dungeonIds.has(s.dungeonId), `${s.id} bad dungeon`);
    push(errors, VENUES.includes(s.venue), `${s.id} bad venue ${s.venue}`);
    if (VENUES.includes(s.venue)) venueCount[s.venue] += 1;
    push(errors, PRESENT.includes(s.presentation?.kind), `${s.id} bad presentation`);
    push(errors, !!s.mapRef?.anchor && !!s.mapRef?.session, `${s.id} missing map anchor`);
    push(errors, !anchors.has(s.mapRef?.anchor), `${s.id} duplicate anchor`);
    if (s.mapRef?.anchor) anchors.add(s.mapRef.anchor);
    push(errors, (s.environmentalStory || "").length >= 80, `${s.id} story short`);
    push(errors, (s.clue?.text || "").length >= 40, `${s.id} clue short`);
    push(errors, s.clue?.honest === true, `${s.id} clue not marked honest`);
    push(errors, byId.has(s.clue?.sourceId), `${s.id} clue source missing ${s.clue?.sourceId}`);
    const concealed = s.presentation?.kind === "hidden-compartment" || s.presentation?.kind === "buried-cache";
    if (concealed) push(errors, s.clue?.sourceId && s.clue.sourceId !== s.id, `${s.id} concealed clue is self`);
    push(errors, (s.interaction?.successCopy || "").length >= 40, `${s.id} success short`);
    push(errors, (s.interaction?.blockedCopy || "").length >= 30, `${s.id} blocked short`);
    push(errors, (s.interaction?.examinedCopy || "").length >= 30, `${s.id} examined short`);
    push(errors, (s.persistence?.note || "").length >= 30, `${s.id} persistence note short`);
    push(errors, (s.era?.before?.state || "").length >= 20, `${s.id} before state short`);
    push(errors, (s.era?.return?.state || "").length >= 20, `${s.id} return state short`);
    push(errors, (s.era?.return?.change || "").length >= 20, `${s.id} return change short`);
    push(errors, s.era?.before?.available === true && s.era?.return?.available === true, `${s.id} era availability`);
    if (s.ownership?.posture === "refuses") {
      push(errors, (s.interaction?.ownedRefusalCopy || "").length >= 30, `${s.id} missing refusal`);
      push(errors, (s.interaction?.refusalRepeatCopy || "").length >= 20, `${s.id} missing refusal repeat`);
      push(errors, (s.ownership.presentIn || []).length > 0, `${s.id} refuses with no era`);
    }
    if (s.persistence?.questLock) {
      push(errors, !!s.quest?.release && (!!s.quest.release.era || !!s.quest.release.flag), `${s.id} quest has no release`);
      push(errors, (s.interaction?.heldCopy || "").length >= 30, `${s.id} missing held copy`);
    }
    if (s.persistence?.fixture) {
      push(errors, (s.interaction?.rereadCopy || "").length >= 20, `${s.id} fixture without reread`);
    }
    const blob = `${s.environmentalStory} ${s.clue?.text} ${s.interaction?.successCopy}`;
    for (const re of BANNED) push(errors, !re.test(blob), `${s.id} banned phrase ${re}`);
    push(errors, !/chest-\d+/.test(s.id) && !/loot_\d+/.test(s.id), `${s.id} procedural id`);
    const sc = s.interaction?.successCopy;
    if (successSeen.has(sc)) errors.push(`duplicate success copy ${s.id} and ${successSeen.get(sc)}`);
    else successSeen.set(sc, s.id);

    const obtainable = (s.contents || []).filter((c) => c.obtainable);
    push(errors, obtainable.length > 0 || s.special === "chapel-offering", `${s.id} has no obtainable content`);
    for (const c of s.contents || []) {
      push(errors, KINDS.includes(c.kind), `${s.id} bad kind ${c.kind}`);
      if (KINDS.includes(c.kind)) kindCount[c.kind] += 1;
      push(errors, (c.blurb || "").length >= 15, `${s.id} ${c.itemId} blurb short`);
      if (!c.obtainable) push(errors, (c.unavailableReason || "").length >= 20, `${s.id} ${c.itemId} needs unavailable reason`);
      if (c.unique) {
        const list = itemPlacements.get(c.itemId) || [];
        list.push(s.id);
        itemPlacements.set(c.itemId, list);
      }
      if (c.questProtected) {
        push(errors, !!s.quest?.id, `${s.id} ${c.itemId} questProtected without quest`);
      }
    }
    for (const p of s.prerequisites || []) {
      if (p.type === "clue-read") push(errors, byId.has(p.id), `${s.id} prereq missing ${p.id}`);
      if (p.type === "flag" || p.type === "tool" || p.type === "gate" || p.type === "clue-read") {
        push(errors, (p.failCopy || "").length >= 20, `${s.id} prereq ${p.type} failCopy short`);
      }
    }
    if (s.playableInFragment) {
      const a = map.anchors[s.id];
      push(errors, !!a, `${s.id} missing fragment anchor`);
      if (a) {
        const open = map.tileBlocked(a.x, a.y, new Set(["quarry-grate"]));
        push(errors, !open, `${s.id} anchor ${a.x},${a.y} is solid even with grate open`);
      }
    }
  }

  for (const [itemId, places] of itemPlacements) {
    const uniquePlaces = [...new Set(places)];
    push(errors, uniquePlaces.length === 1, `unique ${itemId} in ${uniquePlaces.join(", ")}`);
  }

  for (const v of VENUES) push(errors, venueCount[v] > 0, `venue missing ${v}`);
  for (const k of KINDS) push(errors, kindCount[k] > 0, `kind missing ${k}`);
  for (const d of dungeons) {
    push(errors, situations.some((s) => s.dungeonId === d.id), `dungeon without loot ${d.id}`);
  }
  for (const d of districts) {
    push(errors, situations.some((s) => s.districtId === d.id), `district without loot ${d.id}`);
  }

  const before = simulate("before", situations, map, "fragment");
  const ret = simulate("return", situations, map, "fragment");
  const countyBefore = simulate("before", situations, map, "county");
  const countyReturn = simulate("return", situations, map, "county");

  for (const s of situations) {
    const simPair = s.playableInFragment
      ? { before, return: ret }
      : { before: countyBefore, return: countyReturn };
    for (const c of s.contents || []) {
      if (!c.obtainable || c.requiresPrior) continue;
      for (const eraName of c.eraAvailable || []) {
        push(errors, !!simPair[eraName].owned[c.itemId], `${eraName} never obtains ${c.itemId} (${s.id})`);
      }
    }
  }

  // Cross-era scenes.
  const wind = byId.get("lfb-orchard-windfalls");
  let st = createState("before");
  st = resolveAction(st, wind, "take").state;
  st = shiftEra(st, "return").state;
  push(errors, st.satchel.some((i) => i.itemId === "fair-windfalls-leather"), "windfalls did not spoil");
  push(errors, !st.satchel.some((i) => i.itemId === "fair-windfalls"), "fresh windfalls survived the return");

  const inv = byId.get("lfb-cooper-invoice");
  const brand = byId.get("lfb-cooper-brand");
  let st2 = createState("before");
  st2 = resolveAction(st2, inv, "take").state;
  push(errors, !st2.flags["cooper.order-closed"], "order closed too early");
  st2 = shiftEra(st2, "return").state;
  push(errors, !!st2.flags["cooper.order-closed"], "invoice did not age into a closed order");
  const brandTake = resolveAction(st2, brand, "take");
  push(errors, brandTake.ok && brandTake.state.owned["cooper-brand-iron"], "brand did not release");

  const chapel = byId.get("lfb-chapel-niche");
  let left = createState("before");
  left = resolveAction(left, chapel, "leave").state;
  left = shiftEra(left, "return").state;
  const leftBack = resolveAction(left, chapel, "take");
  push(errors, leftBack.ok && leftBack.state.owned["chapel-token"], "leaving the coin did not pay the token");
  let took = createState("before");
  took = resolveAction(took, chapel, "take").state;
  took = shiftEra(took, "return").state;
  const tookBack = resolveAction(took, chapel, "take");
  push(
    errors,
    tookBack.ok && tookBack.state.owned["chapel-note"] && !tookBack.state.owned["chapel-token"],
    "taking the coin did not become the note",
  );

  // Quest release flags must be granted somewhere.
  for (const s of situations) {
    const flag = s.quest?.release?.flag;
    if (!flag) continue;
    const granted = situations.some((o) => (o.grants?.both || []).includes(flag) || (o.grants?.before || []).includes(flag) || (o.grants?.return || []).includes(flag) || (o.contents || []).some((c) => c.onEnterReturnGrant === flag));
    push(errors, granted, `${s.id} release flag ${flag} is never granted`);
  }

  const fragmentCount = situations.filter((s) => s.playableInFragment).length;
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      situations: situations.length,
      fragment: fragmentCount,
      districts: districts.length,
      dungeons: dungeons.length,
      venues: venueCount,
      kinds: kindCount,
    },
  };
}

const argv = typeof process !== "undefined" && Array.isArray(process.argv) ? process.argv : [];
const isMain = argv[1] ? import.meta.url === `file://${argv[1]}` : false;
if (isMain) {
  const report = validateReport();
  console.log(JSON.stringify({ ok: report.ok, counts: report.counts, errorCount: report.errors.length, errors: report.errors.slice(0, 80) }, null, 2));
  process.exit(report.ok ? 0 : 1);
}
