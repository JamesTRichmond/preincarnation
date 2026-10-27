import { DEV_CATALOG, DEV_SOURCE_LABEL } from "../catalog.ts";
import { DAMAGE_MESSAGE, defaultSettings, fixtureSlots, freshLife } from "../fixtures.ts";
import type { GameplaySnapshot, InterfaceBindings, SaveSlot, Settings } from "../types.ts";
import { clone } from "./retention.ts";

export interface FixtureBindings extends InterfaceBindings {
  replaceSlots(next: SaveSlot[]): void;
}

export const LOAD_DELAY_MS = 480;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * In-memory register. `source` is `dev-fixture` so the frame can say these lives
 * are samples. The integration owner replaces this object; the UI does not care.
 */
export function createFixtureBindings(options?: {
  slots?: SaveSlot[];
  settings?: Settings;
  delayMs?: number;
}): FixtureBindings {
  let slots = clone(options?.slots ?? fixtureSlots());
  let settings = clone(options?.settings ?? defaultSettings());
  const delayMs = options?.delayMs ?? LOAD_DELAY_MS;

  return {
    source: "dev-fixture",
    sourceLabel: DEV_SOURCE_LABEL,
    catalog: DEV_CATALOG,
    simulateField: true,
    readSlots: () => clone(slots),
    replaceSlots(next: SaveSlot[]) {
      slots = clone(next);
    },
    readSettings: () => clone(settings),
    async loadSlot(slotId: string, repair: boolean) {
      await wait(delayMs);
      const slot = slots.find((entry) => entry.id === slotId);
      if (!slot) throw new Error("That page is not in the register.");
      if (slot.damaged && !repair) throw new Error(DAMAGE_MESSAGE);
      if (!slot.snapshot) throw new Error("That page is blank.");
      if (repair && slot.damaged) {
        slots = slots.map((entry) => (entry.id === slotId ? { ...entry, damaged: false } : entry));
      }
      return clone(slot.snapshot);
    },
    async saveSlot(slotId: string, snapshot: GameplaySnapshot) {
      slots = slots.map((entry) =>
        entry.id === slotId ? { id: slotId, occupied: true, damaged: false, snapshot: clone(snapshot) } : entry,
      );
    },
    async writeSettings(next: Settings) {
      settings = clone(next);
    },
    async createLife() {
      await wait(delayMs);
      return freshLife();
    },
  };
}
