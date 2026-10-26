export { TavernMusicActivity } from "./ui/TavernMusicActivity.tsx";
export { PIECES, FEATURED_IDS, TAVERN_SET, TAVERN_SET_PLAN, pieceById } from "./pieces.ts";
export { compileChart, collapseDoubled } from "./chart.ts";
export { TAVERN_SAVE_KEY, TAVERN_BACKUP_KEY, loadSave, writeSave, emptySave } from "./storage.ts";
export { TavernEngine } from "./engine.ts";
export { createSession } from "./session.ts";
export { measureOffset, noteDeviceChange, browserLatencyNote } from "./latency.ts";
export { pieceToMidi } from "./midi.ts";
export { renderNotes } from "./offline.ts";
export type { HostAudioBridge, Piece, InstrumentId, Gesture, Variant, PlayMode } from "./types.ts";

export const MODULE_ID = "grok-43-tavern-music";
