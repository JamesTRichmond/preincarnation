import { indexIsStale } from "./index.ts";
import type { ItemIndex } from "./index-types.ts";
import { PHRASE_SYNONYMS, TOKEN_SYNONYMS } from "./synonyms.ts";
import { fold, words } from "./text.ts";
import type { Filters, KnownWorld, SearchResponse, SortKey, StaleClaim } from "./types.ts";
import { DEFAULT_FILTERS } from "./types.ts";

export type SearchOptions = {
  filters?: Filters;
  sort?: SortKey;
};

type Clause = { anyOf: string[]; label: string };

const PHRASES = [...PHRASE_SYNONYMS].sort((a, b) => fold(b.phrase).length - fold(a.phrase).length);

const FIELD =
  /\b(name|component|effect|tool|provenance|where|project|kind|custody):(?:"([^"]+)"|([^\s]+))/g;

export function planQuery(raw: string): Clause[] {
  let text = fold(raw);
  const clauses: Clause[] = [];

  text = text.replace(FIELD, (_all, field: string, quoted?: string, bare?: string) => {
    const value = fold(quoted ?? bare ?? "");
    if (field === "effect") {
      clauses.push({ anyOf: [`effect:${value}`], label: `effect:${value}` });
    } else if (field === "kind" || field === "custody") {
      clauses.push({ anyOf: [`${field}:${value}`], label: `${field}:${value}` });
    } else if (field === "project" && value.includes("-")) {
      clauses.push({ anyOf: [`project:${value}`, ...words(value).map((word) => `project:${word}`)], label: `project:${value}` });
    } else {
      const tokens = words(value);
      if (tokens.length === 0 && value) {
        clauses.push({ anyOf: [`${field}:${value}`], label: `${field}:${value}` });
      } else {
        for (const token of tokens) {
          clauses.push({ anyOf: [`${field}:${token}`], label: `${field}:${token}` });
        }
      }
    }
    return " ";
  });

  for (const phrase of PHRASES) {
    const folded = fold(phrase.phrase);
    if (!folded || !text.includes(folded)) continue;
    clauses.push({
      anyOf: phrase.tags.map((tag) => `effect:${tag}`),
      label: phrase.phrase,
    });
    text = text.split(folded).join(" ");
  }

  for (const word of words(text)) {
    const expanded = TOKEN_SYNONYMS[word] ?? [word];
    clauses.push({ anyOf: [...new Set(expanded)], label: word });
  }

  return clauses;
}

function idsForClause(index: ItemIndex, clause: Clause): Set<number> {
  const ids = new Set<number>();
  for (const token of clause.anyOf) {
    const posts = index.postings.get(token);
    if (!posts) continue;
    for (const id of posts) ids.add(id);
  }
  return ids;
}

function matchingIndexes(index: ItemIndex, clauses: Clause[]): number[] {
  if (clauses.length === 0) return index.records.map((_, i) => i);
  let acc: Set<number> | null = null;
  for (const clause of clauses) {
    const ids = idsForClause(index, clause);
    if (acc === null) acc = ids;
    else {
      const next = new Set<number>();
      for (const id of acc) if (ids.has(id)) next.add(id);
      acc = next;
    }
    if (acc.size === 0) return [];
  }
  return [...(acc ?? [])];
}

function passes(recordIndex: number, index: ItemIndex, filters: Filters): boolean {
  const record = index.records[recordIndex];
  if (!record) return false;
  if (filters.fixtures === "hide" && record.synthetic) return false;
  if (filters.fixtures === "only" && !record.synthetic) return false;
  if (filters.kind !== "any" && record.kind !== filters.kind) return false;
  if (filters.custody !== "any" && record.custody !== filters.custody) return false;
  if (filters.equipped === "yes" && !record.equipped) return false;
  if (filters.equipped === "no" && record.equipped) return false;
  if (filters.reserved === "yes" && !record.reservedFor) return false;
  if (filters.reserved === "no" && record.reservedFor) return false;
  if (filters.access === "open" && !record.accessible) return false;
  if (filters.access === "barred" && record.accessible) return false;
  if (filters.project !== "any") {
    const relevant =
      record.reservedFor === filters.project || record.projects.some((project) => project.id === filters.project);
    if (!relevant) return false;
  }
  return true;
}

function scoreOf(recordTokens: Set<string>, name: string, clauses: Clause[], raw: string): number {
  const folded = fold(raw).trim();
  const foldedName = fold(name);
  let score = 0;
  if (folded && foldedName === folded) score += 50;
  else if (folded.length > 2 && foldedName.includes(folded)) score += 20;
  for (const clause of clauses) {
    if (clause.anyOf.some((token) => token.startsWith("effect:") && recordTokens.has(token))) score += 8;
    if (clause.anyOf.some((token) => token.startsWith("name:") && recordTokens.has(token))) score += 6;
    if (clause.anyOf.some((token) => recordTokens.has(token))) score += 2;
  }
  return score;
}

function claimsFor(index: ItemIndex, clauses: Clause[], filters: Filters): StaleClaim[] {
  return matchingIndexes(index, clauses)
    .filter((id) => passes(id, index, filters))
    .map((id) => {
      const record = index.records[id]!;
      return {
        instanceId: record.instanceId,
        name: record.name,
        claimedLocation: record.locationLabel,
        matched: clauses.map((clause) => clause.label),
      };
    });
}

export function search(
  index: ItemIndex,
  world: KnownWorld,
  raw: string,
  options: SearchOptions = {},
): SearchResponse {
  const started = performance.now();
  const filters = options.filters ?? DEFAULT_FILTERS;
  const sort = options.sort ?? "relevance";
  const clauses = planQuery(raw);
  const staleReason = indexIsStale(index, world);

  if (staleReason) {
    return {
      stale: true,
      staleReason,
      tookMs: performance.now() - started,
      total: 0,
      hits: [],
      staleClaims: claimsFor(index, clauses, filters),
    };
  }

  const hits = matchingIndexes(index, clauses)
    .filter((id) => passes(id, index, filters))
    .map((id) => {
      const record = index.records[id]!;
      const tokens = new Set(record.tokens);
      return {
        record,
        score: scoreOf(tokens, record.name, clauses, raw),
        locationIsCurrent: true,
        matched: clauses.map((clause) => clause.label),
      };
    });

  hits.sort((a, b) => {
    if (sort === "name") return a.record.name.localeCompare(b.record.name) || a.record.instanceId.localeCompare(b.record.instanceId);
    if (sort === "location") {
      return a.record.locationLabel.localeCompare(b.record.locationLabel) || a.record.instanceId.localeCompare(b.record.instanceId);
    }
    if (sort === "quantity") return b.record.quantity - a.record.quantity || a.record.name.localeCompare(b.record.name);
    if (sort === "project") {
      const ap = a.record.reservedLabel ?? a.record.projects[0]?.name ?? "";
      const bp = b.record.reservedLabel ?? b.record.projects[0]?.name ?? "";
      return ap.localeCompare(bp) || a.record.name.localeCompare(b.record.name);
    }
    return b.score - a.score || a.record.name.localeCompare(b.record.name) || a.record.instanceId.localeCompare(b.record.instanceId);
  });

  return {
    stale: false,
    tookMs: performance.now() - started,
    total: hits.length,
    hits,
    staleClaims: [],
  };
}
