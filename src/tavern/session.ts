/**
 * Audio unlock / suspend / mute, independent of the Web Audio graph so tests
 * can drive a fake clock. `unlock` is synchronous: it calls `resume` before
 * returning. Call it inside the gesture that sits the player down.
 */

export type AudioHostState = "suspended" | "running" | "closed";

export type AudioHost = {
  state: AudioHostState;
  currentTime: number;
  resume: () => Promise<void>;
  suspend: () => Promise<void>;
  baseLatency?: number;
  outputLatency?: number;
};

export type AudioSession = {
  unlocked: boolean;
  muted: boolean;
  holding: boolean;
  unlock: () => void;
  setMuted: (muted: boolean) => void;
  onVisibility: (hidden: boolean) => void;
  /** Musical gain. Mute is silence, not a stopped clock. */
  musicGain: () => number;
};

export function createSession(host: AudioHost): AudioSession {
  let unlocked = false;
  let muted = false;
  let holding = false;

  return {
    get unlocked() {
      return unlocked;
    },
    get muted() {
      return muted;
    },
    get holding() {
      return holding;
    },
    unlock() {
      unlocked = true;
      holding = false;
      if (host.state !== "running") {
        void host.resume();
      }
    },
    setMuted(next: boolean) {
      muted = next;
    },
    onVisibility(hidden: boolean) {
      if (!unlocked) return;
      if (hidden) {
        holding = true;
        if (host.state === "running") void host.suspend();
        return;
      }
      holding = false;
      if (host.state !== "running") void host.resume();
    },
    musicGain() {
      return muted ? 0 : 1;
    },
  };
}
