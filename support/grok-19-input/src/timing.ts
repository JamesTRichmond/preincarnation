/** Tunables for gesture discrimination. Gameplay code must not fork these. */
export const TIMING = {
  /** Held blade at or past this becomes a spin. Earlier release is a tap. */
  bladeSpinMs: 200,
  /** Shrine Release only commits after a continuous hold this long. */
  shrineHoldMs: 1600,
  /** Discrete intents stay consumable briefly so a late reader does not drop them. */
  bufferMs: 120,
  /** Hold the unrebindable recovery key this long to restore default bindings. */
  recoveryHoldMs: 1200,
  stickDeadzone: 0.18,
  /** Analog triggers (buttons 6 and 7) count as pressed at or above this. */
  triggerThreshold: 0.6,
} as const;

/** Hard-wired. Not stored in the binding table, so a rebind cannot remove it. */
export const RECOVERY_CODE = "F8";

export const STORAGE_KEY = "preincarnation.input.v1";

export const MIN_TOUCH_PX = 44;
export const SHRINE_GAP_PX = 28;
