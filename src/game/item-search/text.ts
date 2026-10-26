import { STOP_WORDS } from "./synonyms.ts";

/** Accent-fold and lowercase. Local string work only. */
export function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function words(value: string): string[] {
  return fold(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
}

export function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
