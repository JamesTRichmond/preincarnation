import { ERA_SPAN_YEARS, PRINCIPAL_ERA_STARTS } from "./types.ts";
import { InheritanceError } from "./errors.ts";

export function eraIndexForYear(year: number): number {
  if (!Number.isInteger(year) || year < 0) {
    throw new InheritanceError("bad-year", `Year ${String(year)} is not a whole year at or after 0.`);
  }
  return Math.floor(year / ERA_SPAN_YEARS);
}

export function eraStartYear(eraIndex: number): number {
  if (!Number.isInteger(eraIndex) || eraIndex < 0) {
    throw new InheritanceError("bad-year", `Era ${String(eraIndex)} is not valid.`);
  }
  return eraIndex * ERA_SPAN_YEARS;
}

/** Principal eras are the six that open at 0, 14, 28, 42, 56 and 70. Later indexes continue. */
export function isPrincipalEraIndex(eraIndex: number): boolean {
  return (PRINCIPAL_ERA_STARTS as readonly number[]).includes(eraStartYear(eraIndex));
}

export function returnYearAfter(deathYear: number): number {
  return deathYear + ERA_SPAN_YEARS;
}

/** Stable, non-cryptographic id material. Same input always yields the same 8 hex chars. */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function legacyInstanceId(version: 0 | 1, key: string): string {
  return `inst:legacy-v${version}:${fnv1a(key)}`;
}
