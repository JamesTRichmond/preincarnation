/**
 * Field audio. The verbs the engine already calls play the county cues.
 * Mute and the place bed do not write the save.
 */
import { createSoundDesk } from "./sound/mixer.js";

export const FIELD_CUES = {
  slash: "blade_swing",
  hit: "blade_flesh",
  pickup: "ui_confirm",
  hurt: "hurt_light",
  die: "death_sting",
  talk: "ui_focus",
  crown: "puzzle_solve",
  world: "amb_town",
  limbo: "amb_afterlife",
} as const;

const FIELD_IDS = Object.values(FIELD_CUES);

export function createAudio() {
  const desk = createSoundDesk({
    baseUrl: new URL("/sound/", window.location.href),
    manifestUrl: "manifest/cues.json",
    cueIds: FIELD_IDS,
  });
  let loading: Promise<unknown> | null = null;

  const ready = () => {
    const opened = desk.unlock();
    if (!opened.ok) return null;
    if (!loading) {
      loading = desk.load().catch((error: unknown) => {
        loading = null;
        console.warn(error);
      });
    }
    return loading;
  };

  const play = (id: string) => {
    const pending = ready();
    if (!pending) return;
    void pending.then(() => {
      desk.play(id);
    });
  };

  return {
    unlock() {
      ready();
    },
    slash() {
      play(FIELD_CUES.slash);
    },
    hit() {
      play(FIELD_CUES.hit);
    },
    pickup() {
      play(FIELD_CUES.pickup);
    },
    hurt() {
      play(FIELD_CUES.hurt);
    },
    die() {
      play(FIELD_CUES.die);
    },
    talk() {
      play(FIELD_CUES.talk);
    },
    crown() {
      play(FIELD_CUES.crown);
    },
    startDrone(limbo: boolean) {
      const pending = ready();
      if (!pending) return;
      const id = limbo ? FIELD_CUES.limbo : FIELD_CUES.world;
      void pending.then(() => {
        desk.setAmbience(id);
      });
    },
    stopDrone() {
      desk.setAmbience("");
    },
    setMuted(value: boolean) {
      desk.setMuted(value);
    },
    setDuck(on: boolean) {
      desk.setBusVolume("ambience", on ? 0.35 : 0.85);
    },
    get muted() {
      return desk.getState().muted;
    },
  };
}
