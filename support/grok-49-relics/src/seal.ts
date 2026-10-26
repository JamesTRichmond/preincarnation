import type { World } from "./types.ts";

/** Snapshot of state a relic is forbidden to rewrite. */
export function sealedSignature(world: World): string {
  return JSON.stringify({
    quests: world.quests.filter((quest) => quest.protected).map((quest) => [quest.id, quest.status, quest.note]),
    boundaries: world.boundaries
      .filter((bound) => bound.class !== "survey-mark")
      .map((bound) => [bound.id, bound.class, bound.notch, bound.readable, bound.frozen, bound.marked]),
    doors: world.doors.filter((door) => door.kind === "campaign-gate").map((door) => [door.id, door.locked]),
    timers: world.timers.filter((timer) => timer.protected).map((timer) => [timer.id, timer.paused, timer.remaining]),
    documents: world.documents.filter((doc) => doc.protected).map((doc) => [doc.id, doc.stamped, doc.ruined]),
    graves: world.graves.filter((grave) => grave.protected).map((grave) => [grave.id, grave.asked]),
    birthdays: world.birthdays.filter((day) => day.protected).map((day) => [day.id, day.spent, day.gift]),
    journal: world.journal.filter((entry) => entry.protected).map((entry) => [entry.id, entry.forgotten, entry.text]),
    sentences: world.sentences.filter((line) => line.protected).map((line) => [line.id, line.text, line.revised]),
    objects: world.objects.filter((obj) => obj.protected).map((obj) => [obj.id, obj.uncertain]),
  });
}
