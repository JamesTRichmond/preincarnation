import { DOCUMENTS, getDocument } from "../documents.ts";
import { HUNTS } from "../hunts.ts";
import { effectiveBurden, stokeOf } from "../keeping.ts";
import type { Save } from "../types.ts";

export type RoomTab = "room" | "ledger" | "table" | "desk" | "grounds";

export interface HouseholdThread {
  tab: RoomTab;
  title: string;
  detail: string;
}

/** The one next thing the house is actually waiting on. Not a tutorial. */
export function householdThread(save: Save): HouseholdThread {
  const keeping = save.keeping;
  if (keeping && keeping.phase === "search") {
    return {
      tab: "table",
      title: `Winter ${keeping.winter}, a search is open`,
      detail: "Keep one card. The rest go under the deck before this winter can close.",
    };
  }
  if (keeping && keeping.phase === "play") {
    const stoke = stokeOf(keeping);
    const burden = effectiveBurden(keeping);
    const short = burden - stoke;
    return {
      tab: "table",
      title: `Winter ${keeping.winter} is on the table`,
      detail:
        short <= 0
          ? `Stoke ${stoke} meets burden ${burden}. Play further if you want, or close the winter.`
          : keeping.shield
            ? `Stoke ${stoke} is short by ${short}. Closing now spends the shield and the hearth stays.`
            : `Stoke ${stoke} is short by ${short}. Close now and a hearth goes out.`,
    };
  }
  if (keeping?.phase === "won") {
    return {
      tab: "table",
      title: "The line holds",
      detail: "Fourteen winters are done. Leave the table when you want the room back.",
    };
  }
  if (keeping?.phase === "lost") {
    return {
      tab: "table",
      title: "The line failed",
      detail: "The hearths are out. Leave the table. The ledger itself is unchanged.",
    };
  }
  if (save.excursion) {
    const hunt = HUNTS.find((item) => item.id === save.excursion?.huntId);
    return {
      tab: "grounds",
      title: hunt ? `Still out: ${hunt.title}` : "You are still out",
      detail: "You have not come back inside. Only places you have stood are on the walk.",
    };
  }

  const openHunt = HUNTS.find(
    (hunt) => !save.huntsFound.includes(hunt.id) && hunt.maps.some((entry) => save.read.includes(entry.docId)),
  );
  if (openHunt) {
    return {
      tab: "grounds",
      title: openHunt.title,
      detail: "The map has been read. Nothing on the ground is marked. Walk the landmarks, then search.",
    };
  }

  const unreadMaps = save.documents
    .map((id) => getDocument(id))
    .filter((doc) => {
      const huntId = doc?.huntId;
      if (!doc || doc.kind !== "map" || !huntId || save.read.includes(doc.id)) return false;
      return !save.huntsFound.includes(huntId);
    });
  const map = unreadMaps[0];
  if (map) {
    return {
      tab: "desk",
      title: map.title,
      detail: "Read it before you trust your feet. A map is not a walk until it has been read.",
    };
  }

  const unread = save.documents.filter((id) => !save.read.includes(id));
  if (unread.length > 0) {
    const doc = getDocument(unread[0] ?? "");
    return {
      tab: "desk",
      title: unread.length === 1 ? "One paper is still unread" : `${unread.length} papers are still unread`,
      detail: doc ? `Start with ${doc.title}. Reading is what opens the next thing.` : "The desk is waiting.",
    };
  }

  const follow = DOCUMENTS.find(
    (doc) => doc.followUp && save.read.includes(doc.id) && !save.documents.includes(doc.followUp.id),
  );
  if (follow?.followUp) {
    return {
      tab: "desk",
      title: "A paper points further",
      detail: follow.followUp.label,
    };
  }

  return {
    tab: "table",
    title: "The desk is quiet",
    detail: "Begin a keeping. Fourteen winters, three hearths, and the ledger you have seated.",
  };
}
