export interface ClearRecord {
  moves: number;
  ticks: number;
  ribbon: boolean;
}

export interface SaveData {
  version: 1;
  cleared: Record<string, ClearRecord>;
  hints: Record<string, number>;
  lastId?: string;
}

export interface Sketch {
  id: string;
  title: string;
  rows: string[];
  moveLimit: number;
}

export interface SketchBook {
  version: 1;
  sketches: Sketch[];
}

const SAVE_KEY = "sugar-circuits-save-v1";
const SKETCH_KEY = "sugar-circuits-sketches-v1";

export const EMPTY_SAVE: SaveData = { version: 1, cleared: {}, hints: {} };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return EMPTY_SAVE;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.version !== 1) return EMPTY_SAVE;
    return {
      version: 1,
      cleared: parsed.cleared ?? {},
      hints: parsed.hints ?? {},
      lastId: typeof parsed.lastId === "string" ? parsed.lastId : undefined,
    };
  } catch {
    return EMPTY_SAVE;
  }
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* private mode or a full disk — the yard still plays */
  }
}

export function loadSketches(): Sketch[] {
  try {
    const raw = localStorage.getItem(SKETCH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SketchBook>;
    if (parsed.version !== 1 || !Array.isArray(parsed.sketches)) return [];
    return parsed.sketches.filter((sketch) => Array.isArray(sketch.rows) && sketch.rows.length > 0);
  } catch {
    return [];
  }
}

export function writeSketches(sketches: Sketch[]): void {
  try {
    const book: SketchBook = { version: 1, sketches };
    localStorage.setItem(SKETCH_KEY, JSON.stringify(book));
  } catch {
    /* ignore quota */
  }
}
