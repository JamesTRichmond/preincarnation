import { InheritanceError } from "./errors.ts";
import {
  addNote,
  advanceTo,
  claim,
  createWorld,
  donate,
  ensureNpc,
  ensureSite,
  inheritItem,
  killNpc,
  markHistorical,
  recognize,
  resolveSuccessions,
  restoreItem,
  takeUp,
} from "./engine.ts";
import type { ItemStory, StoryBeat, StorySimulation, WorldState } from "./types.ts";
import { PLAYER_ID } from "./types.ts";

export function simulateStory(story: ItemStory): StorySimulation {
  return simulateStoryThrough(story, story.beats.length);
}

export function simulateStoryThrough(story: ItemStory, beatCount: number): StorySimulation {
  const count = Math.max(0, Math.min(Math.floor(beatCount), story.beats.length));
  let world = createWorld(0);
  const denied: StorySimulation["denied"] = [];
  for (const beat of story.beats.slice(0, count)) {
    if (beat.atYear < world.calendarYear) {
      throw new InheritanceError(
        "bad-year",
        `${story.storyId} walks backward from ${world.calendarYear} to ${beat.atYear}.`,
      );
    }
    if (beat.atYear > world.calendarYear) world = advanceTo(world, beat.atYear);
    try {
      world = applyBeat(world, story, beat);
      if (beat.expectDenied) {
        throw new InheritanceError("expected-denial", `${story.storyId} expected a refusal at year ${beat.atYear}.`);
      }
    } catch (error) {
      if (!beat.expectDenied) throw error;
      const coded = error instanceof InheritanceError ? error : new InheritanceError("denied", String(error));
      if (coded.code === "expected-denial") throw coded;
      denied.push({ atYear: beat.atYear, code: coded.code, message: coded.message });
    }
  }
  return {
    story,
    world,
    denied,
    final: world.instances[story.instanceId] ?? null,
  };
}

function applyBeat(world: WorldState, story: ItemStory, beat: StoryBeat): WorldState {
  const action = beat.action;
  const year = beat.atYear;
  switch (action.op) {
    case "ensure-npc":
      return ensureNpc(world, action);
    case "ensure-site":
      return ensureSite(world, { siteId: action.siteId, name: action.name, lossPolicy: action.lossPolicy });
    case "claim":
      return claim(world, {
        defId: action.defId,
        sourceKey: action.sourceKey,
        sourceKind: action.sourceKind,
        year,
        instanceId: action.instanceId,
        qty: action.qty,
        condition: action.condition,
        storyId: action.storyId === undefined ? story.storyId : action.storyId,
        storage: storageFor(action.custody, action.containerId, action.siteId),
        placement: placementFor(action.custody, action.siteId, year),
      });
    case "donate":
      return donate(world, action.instanceId, action.toId, year, action.siteId);
    case "npc-dies":
      return killNpc(world, action.npcId, year);
    case "resolve-succession":
      return resolveSuccessions(world, year).world;
    case "successor-note":
      return addNote(world, action.instanceId, year, action.byId, action.note);
    case "restore":
      return restoreItem(world, action.instanceId, year, action.byId, action.note);
    case "inherit":
      return inheritItem(
        world,
        action.instanceId,
        action.heirId,
        action.heirKind ?? (action.heirId.startsWith("inst:") ? "institution" : "npc"),
        year,
        action.note,
        action.siteId,
      );
    case "expose-cache":
      return claim(world, {
        defId: action.defId,
        sourceKey: action.sourceKey,
        sourceKind: "cache",
        year,
        instanceId: action.instanceId,
        storyId: story.storyId,
        owner: {
          ownerKind: "unowned",
          ownerId: `unowned:${action.siteId}`,
          title: "abandoned",
          sinceYear: year,
        },
        storage: { location: "none", containerId: null },
        placement: { kind: "placed-in-world", siteId: action.siteId, siteEra: Math.floor(year / 14) },
      });
    case "claim-again":
      return claim(world, {
        defId: action.defId,
        sourceKey: action.sourceKey,
        sourceKind: action.sourceKind,
        year,
        storyId: null,
      });
    case "recognize":
      return recognize(world, action.instanceId, year, action.byId, action.note);
    case "historical-mark":
      return markHistorical(world, action.instanceId, year, action.byId, action.note);
    case "take-up":
      return takeUp(world, action.instanceId, year);
    case "renewable-claim":
      return claim(world, {
        defId: action.defId,
        sourceKey: action.sourceKey,
        sourceKind: "renewable-node",
        year,
        instanceId: action.instanceId,
        qty: action.qty,
        storyId: null,
      });
    default: {
      const neverOp: never = action;
      throw new InheritanceError("bad-beat", `Unknown story op ${String(neverOp)}`);
    }
  }
}

function storageFor(
  custody: "carried" | "stored" | "displayed" | "none" | undefined,
  containerId: string | null | undefined,
  siteId: string | null | undefined,
) {
  const location = custody ?? "carried";
  if (location === "none") return { location: "none" as const, containerId: null };
  if (location === "displayed") return { location: "displayed" as const, containerId: containerId ?? `display:${siteId ?? "site"}` };
  if (location === "stored") return { location: "stored" as const, containerId: containerId ?? "chest" };
  return { location: "carried" as const, containerId: containerId ?? "pack" };
}

function placementFor(
  custody: "carried" | "stored" | "displayed" | "none" | undefined,
  siteId: string | null | undefined,
  year: number,
) {
  if (custody === "displayed" && siteId) {
    return { kind: "displayed" as const, siteId, siteEra: Math.floor(year / 14) };
  }
  return { kind: "none" as const, siteId: null, siteEra: null };
}

export function playerStillHolds(world: WorldState, instanceId: string): boolean {
  const inst = world.instances[instanceId];
  return Boolean(inst && inst.ownership.ownerId === PLAYER_ID && inst.status === "active");
}
