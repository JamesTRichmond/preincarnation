/** The first life, in one breath. Not a gate. */
export const FIRST_LIFE =
  "Maeve is on the Green. The shovel is by the stone. East is the Marble Vein. The lantern, if you bonded it, stays in your hand. Death is fourteen winters, then the same hands.";

export function firstLifeNamesTheJob(line: string): boolean {
  return /Maeve/.test(line) && /shovel/i.test(line) && /east/i.test(line) && /lantern/i.test(line) && /fourteen winters/i.test(line);
}
