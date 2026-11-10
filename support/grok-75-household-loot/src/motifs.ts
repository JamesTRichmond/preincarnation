/** Original short motifs. Frequencies only — the room plays them; it does not replace the house music. */

export const MOTIFS: Record<string, number[]> = {
  "fiddle-reel": [587, 659, 740, 659, 587, 494],
  "dulcimer-drone": [196, 294, 370, 294, 196],
  "whistle-air": [880, 988, 784, 880, 659],
  "jawharp-twang": [98, 147, 98, 196],
  "piano-chord": [262, 330, 392, 523],
  "bodhran-pulse": [110, 110, 82, 110],
  "musicbox-waltz": [523, 587, 659, 523, 392],
  "harmonica-breath": [349, 392, 440, 349],
  "chime-cedar": [523, 659, 784, 659, 523],
  "chime-spoon": [1175, 988, 1319, 1175],
  "chime-shell": [698, 784, 622, 698],
  "chime-glass": [1047, 831, 1245, 988],
  "chime-nail": [311, 415, 277, 370],
  "door-harp": [440, 554, 659, 440],
  "strike-mantel": [523, 392, 523],
  "strike-school": [659, 523, 659, 784],
  "sunmark-tap": [330, 440],
  "strike-frozen": [392, 494, 392, 330],
  "strike-steeple": [349, 440, 523, 440],
  "tick-pocket": [880, 880],
  "drip-water": [247, 330],
  "ring-alarm": [988, 784, 988],
};

export function motifNotes(id: string): number[] | undefined {
  return MOTIFS[id];
}
