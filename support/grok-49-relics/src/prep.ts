import { RELICS } from "./catalog.ts";
import { relicId } from "./ids.ts";
import type { RestorationState, World } from "./types.ts";

function grant(world: World, n: number, state: RestorationState, where?: string): void {
  const id = relicId(n);
  const relic = RELICS.find((entry) => entry.id === id);
  if (!relic) throw new Error(`prep missing relic ${n}`);
  world.sources[relic.uniqueness.sourceId] = { relicId: id, available: false, consumed: true };
  const instance = {
    instanceId: `inst.${id}`,
    relicId: id,
    sourceId: relic.uniqueness.sourceId,
    state,
    bound: {},
  };
  if (where) world.placed.push({ where, instance });
  else world.inventory.push(instance);
}

export function applyPrep(world: World, prep?: string): World {
  if (!prep) return world;
  switch (prep) {
    case "evening-boat":
      world.flags["board.noEvening"] = true;
      world.flags["ticket.punched"] = true;
      world.flags["true.calendar"] = true;
      break;
    case "smear-lane": {
      const mark = world.boundaries.find((entry) => entry.id === "mark.lane");
      if (mark) mark.readable = false;
      break;
    }
    case "congregation":
      world.flags["congregation.singing"] = true;
      break;
    case "junie-listening":
      world.flags["junie.listening"] = true;
      break;
    case "swapped-gap": {
      const pair = world.spatial.find((entry) => entry.id === "span.gap");
      if (pair) {
        const swap = pair.a;
        pair.a = pair.b;
        pair.b = swap;
        pair.swapped = true;
      }
      world.flags["unruler.debt"] = true;
      break;
    }
    case "june-local": {
      const june = world.opportunities.find((entry) => entry.id === "env.last-june");
      if (june) {
        june.localTicks = 1;
        june.available = false;
      }
      break;
    }
    case "june-lost": {
      const june = world.opportunities.find((entry) => entry.id === "env.last-june");
      if (june) {
        june.lost = true;
        june.available = false;
        june.sealedIn = "";
      }
      break;
    }
    case "coat-at-hearth":
      grant(world, 4, "fractured", "hearth.silt");
      break;
    case "ledger-and-hymn":
      grant(world, 21, "intact");
      grant(world, 8, "intact");
      break;
    case "hunger":
      world.actor.foreignHunger = true;
      break;
    case "has-link":
      world.links.push({ id: "link.probe", from: "obj.button", to: "obj.present-cup", cut: false });
      break;
    case "hoarse-nave": {
      const sound = world.sounds.find((entry) => entry.id === "sound.nave");
      if (sound) sound.hoarse = true;
      break;
    }
    case "fractured-other":
      grant(world, 27, "fractured");
      break;
    case "birthday-spent": {
      const day = world.birthdays.find((entry) => entry.id === "bday.unlived");
      if (day) day.spent = true;
      break;
    }
    case "shed-open-with-ring": {
      const door = world.doors.find((entry) => entry.id === "door.shed");
      if (door) door.locked = false;
      grant(world, 6, "intact");
      break;
    }
    case "unruler-placed":
      grant(world, 2, "intact", "scene.drop");
      break;
    case "window-open": {
      const win = world.windows.find((entry) => entry.id === "window.silt");
      if (win) win.openYear = 2012;
      world.actor.outOfYear = 2012;
      break;
    }
    case "window-2011": {
      const win = world.windows.find((entry) => entry.id === "window.silt");
      if (win) win.openYear = 2011;
      world.actor.outOfYear = 2011;
      break;
    }
    case "underlayer-on": {
      const sound = world.sounds.find((entry) => entry.id === "sound.nave");
      if (sound) sound.revealed = true;
      break;
    }
    case "nameless":
      world.actor.cannotSayOwnName = true;
      world.flags["ash.untilDawn"] = true;
      world.flags["ash.dawnTick"] = world.tick;
      break;
    case "refusing-door": {
      const door = world.doors.find((entry) => entry.id === "door.silt");
      if (door) {
        door.refused = true;
        door.locked = true;
      }
      world.flags["maeve.refusing"] = true;
      break;
    }
    case "at-spring":
      world.flags["at.spring"] = true;
      break;
    case "june-witnessed":
      world.flags["june.witnessed"] = true;
      break;
    case "owns-coat":
      grant(world, 4, "intact");
      break;
    case "owns-ticket":
      grant(world, 15, "intact");
      break;
    default:
      throw new Error(`Unknown prep ${prep}`);
  }
  return world;
}
