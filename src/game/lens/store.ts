import { copyDocument, exportFilterDocument, importFilterDocument } from "./document.ts";
import { TRAIL_PRESET } from "./presets.ts";
import { FILTER_STORAGE_KEY, type FilterDocument } from "./types.ts";

export function loadLens(): FilterDocument {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return copyDocument(TRAIL_PRESET.document);
    const parsed = importFilterDocument(raw);
    return parsed.ok ? parsed.document : copyDocument(TRAIL_PRESET.document);
  } catch {
    return copyDocument(TRAIL_PRESET.document);
  }
}

export function saveLens(document: FilterDocument) {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, exportFilterDocument(document));
  } catch {
    /* private mode */
  }
}
