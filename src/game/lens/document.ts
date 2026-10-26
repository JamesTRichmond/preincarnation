import { inspectDocument } from "./inspect.ts";
import {
  COLLECTION_STATUSES,
  FILTER_ACTIONS,
  FILTER_FORMAT,
  FILTER_STORAGE_KEY,
  FILTER_VERSION,
  KNOWN_USES,
  MASTERY_COMPAT,
  OWNERSHIPS,
  PROJECT_RELATIONS,
  type CollectionStatus,
  type FilterAction,
  type FilterDocument,
  type FilterRule,
  type ImportResult,
  type KeyValueStore,
  type KnownUse,
  type MasteryCompatibility,
  type Ownership,
  type ProjectRelation,
  type RuleProblem,
} from "./types.ts";

const MAX_CHARS = 64_000;
const MAX_DEPTH = 8;
const MAX_RULES = 40;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;
const CATEGORY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{0,39}$/;

const DOCUMENT_KEYS = new Set(["format", "version", "id", "name", "showEverything", "rules"]);
const RULE_KEYS = new Set([
  "id",
  "name",
  "enabled",
  "action",
  "note",
  "category",
  "knownUse",
  "projectRelation",
  "collectionStatus",
  "mastery",
  "ownership",
  "quantity",
]);
const CATEGORY_KEYS = new Set(["kind", "values"]);
const QUANTITY_KEYS = new Set(["min", "max"]);

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "script",
  "eval",
  "function",
  "code",
  "onclick",
  "onload",
  "javascript",
]);

const FORBIDDEN_ACTIONS = new Set([
  "pickup",
  "pick-up",
  "take",
  "sell",
  "sale",
  "salvage",
  "destroy",
  "delete",
  "drop",
  "execute",
  "eval",
]);

const ACTION_SET = new Set<string>(FILTER_ACTIONS);
const USE_SET = new Set<string>(KNOWN_USES);
const COLLECTION_SET = new Set<string>(COLLECTION_STATUSES);
const MASTERY_SET = new Set<string>(MASTERY_COMPAT);
const OWNERSHIP_SET = new Set<string>(OWNERSHIPS);
const PROJECT_SET = new Set<string>(PROJECT_RELATIONS);

export const SAMPLE_HOSTILE_IMPORT = `{
  "format": "preincarnation.loot-filter",
  "version": 1,
  "id": "hostile",
  "name": "Hostile",
  "showEverything": false,
  "script": "process.exit(1)",
  "rules": [
    {
      "id": "x",
      "name": "take",
      "enabled": true,
      "action": "pickup",
      "__proto__": { "polluted": true }
    }
  ]
}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function forbiddenKey(value: unknown, depth: number): string | null {
  if (depth > MAX_DEPTH) return "The file is nested too deeply.";
  if (Array.isArray(value)) {
    if (value.length > 80) return "A list in the file is too long.";
    for (const entry of value) {
      const found = forbiddenKey(entry, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(value)) return null;
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      return `Forbidden field "${key}". Filters are data, not code, and this file was not applied.`;
    }
    const found = forbiddenKey(value[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function unexpected(value: Record<string, unknown>, allowed: Set<string>): string | null {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) return key;
  }
  return null;
}

function isSafeText(value: string, max: number): boolean {
  if (value.length === 0 || value.length > max) return false;
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) return false;
  }
  return true;
}

function readId(value: unknown, label: string, errors: string[]): string | null {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    errors.push(`${label} must be a short id made of letters, numbers, hyphens, or underscores.`);
    return null;
  }
  return value;
}

function readEnum<T extends string>(
  value: unknown,
  allowed: Set<string>,
  label: string,
  errors: string[],
): T | null {
  if (typeof value !== "string" || !allowed.has(value)) {
    errors.push(`${label} is not an allowed value.`);
    return null;
  }
  return value as T;
}

function readEnumList<T extends string>(
  value: unknown,
  allowed: Set<string>,
  label: string,
  errors: string[],
): T[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) {
    errors.push(`${label} must be a short list of allowed values.`);
    return null;
  }
  const next: T[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || !allowed.has(entry) || next.includes(entry as T)) {
      errors.push(`${label} contains a value that is not allowed.`);
      return null;
    }
    next.push(entry as T);
  }
  return next;
}

function readQuantity(value: unknown, errors: string[]): FilterRule["quantity"] | undefined | null {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    errors.push("Quantity must be an object with min, max, or both.");
    return null;
  }
  const extra = unexpected(value, QUANTITY_KEYS);
  if (extra) {
    errors.push(`Unknown quantity field "${extra}".`);
    return null;
  }
  const quantity: { min?: number; max?: number } = {};
  for (const edge of ["min", "max"] as const) {
    if (value[edge] === undefined) continue;
    const number = value[edge];
    if (typeof number !== "number" || !Number.isInteger(number) || number < 0 || number > 9999) {
      errors.push("Quantity bounds must be whole numbers from 0 to 9999.");
      return null;
    }
    quantity[edge] = number;
  }
  return quantity;
}

function readCategory(value: unknown, errors: string[]): FilterRule["category"] | undefined | null {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    errors.push("Category condition must be an object.");
    return null;
  }
  const extra = unexpected(value, CATEGORY_KEYS);
  if (extra) {
    errors.push(`Unknown category field "${extra}".`);
    return null;
  }
  const kind = value.kind;
  if (kind === "known" || kind === "unknown") {
    if (value.values !== undefined) {
      errors.push("This category condition does not take a list.");
      return null;
    }
    return { kind };
  }
  if (kind !== "in" && kind !== "notIn") {
    errors.push('Category kind must be "known", "unknown", "in", or "notIn".');
    return null;
  }
  if (!Array.isArray(value.values) || value.values.length === 0 || value.values.length > 12) {
    errors.push("Category list must contain 1 to 12 names.");
    return null;
  }
  const values: string[] = [];
  for (const entry of value.values) {
    if (typeof entry !== "string" || !CATEGORY_PATTERN.test(entry)) {
      errors.push("A category name is not valid.");
      return null;
    }
    if (!values.includes(entry)) values.push(entry);
  }
  return { kind, values };
}

function readRule(value: unknown, index: number, errors: string[]): FilterRule | null {
  const label = `Rule ${index + 1}`;
  if (!isRecord(value)) {
    errors.push(`${label} must be an object.`);
    return null;
  }
  const extra = unexpected(value, RULE_KEYS);
  if (extra) {
    errors.push(`${label} has unknown field "${extra}".`);
    return null;
  }
  const id = readId(value.id, `${label} id`, errors);
  if (typeof value.name !== "string" || !isSafeText(value.name, 60)) {
    errors.push(`${label} needs a plain name of 1 to 60 characters.`);
  }
  if (typeof value.enabled !== "boolean") {
    errors.push(`${label} enabled must be true or false.`);
  }
  if (typeof value.action === "string" && FORBIDDEN_ACTIONS.has(value.action.toLowerCase())) {
    errors.push(
      `${label} action "${value.action}" is refused. A filter cannot pick up, sell, salvage, or destroy.`,
    );
  } else if (typeof value.action !== "string" || !ACTION_SET.has(value.action)) {
    errors.push(
      `${label} action must be emphasize, show, collapse, reduce, or hide.`,
    );
  }
  let note: string | undefined;
  if (value.note !== undefined) {
    if (typeof value.note !== "string" || !isSafeText(value.note, 180)) {
      errors.push(`${label} note must be plain text up to 180 characters.`);
    } else {
      note = value.note;
    }
  }
  const knownUse = value.knownUse === undefined
    ? undefined
    : readEnumList<KnownUse>(value.knownUse, USE_SET, `${label} known use`, errors);
  const collectionStatus = value.collectionStatus === undefined
    ? undefined
    : readEnumList<CollectionStatus>(
        value.collectionStatus,
        COLLECTION_SET,
        `${label} collection`,
        errors,
      );
  const mastery = value.mastery === undefined
    ? undefined
    : readEnumList<MasteryCompatibility>(value.mastery, MASTERY_SET, `${label} mastery`, errors);
  const ownership = value.ownership === undefined
    ? undefined
    : readEnumList<Ownership>(value.ownership, OWNERSHIP_SET, `${label} ownership`, errors);
  const projectRelation = value.projectRelation === undefined
    ? undefined
    : readEnum<ProjectRelation>(value.projectRelation, PROJECT_SET, `${label} project`, errors);
  const category = readCategory(value.category, errors);
  const quantity = readQuantity(value.quantity, errors);
  if (
    !id ||
    typeof value.name !== "string" ||
    typeof value.enabled !== "boolean" ||
    typeof value.action !== "string" ||
    !ACTION_SET.has(value.action) ||
    knownUse === null ||
    collectionStatus === null ||
    mastery === null ||
    ownership === null ||
    projectRelation === null ||
    category === null ||
    quantity === null
  ) {
    return null;
  }
  const rule: FilterRule = {
    id,
    name: value.name,
    enabled: value.enabled,
    action: value.action as FilterAction,
  };
  if (note) rule.note = note;
  if (knownUse) rule.knownUse = knownUse;
  if (collectionStatus) rule.collectionStatus = collectionStatus;
  if (mastery) rule.mastery = mastery;
  if (ownership) rule.ownership = ownership;
  if (projectRelation) rule.projectRelation = projectRelation;
  if (category) rule.category = category;
  if (quantity) rule.quantity = quantity;
  return rule;
}

/**
 * Validate a parsed value. Builds a fresh document field by field.
 * Never evaluates strings and never copies unknown keys.
 */
export function parseFilterDocument(value: unknown): ImportResult {
  const blocked = forbiddenKey(value, 0);
  if (blocked) return { ok: false, errors: [blocked] };
  if (!isRecord(value)) {
    return { ok: false, errors: ["A loot filter must be a JSON object."] };
  }
  const errors: string[] = [];
  const extra = unexpected(value, DOCUMENT_KEYS);
  if (extra) errors.push(`Unknown field "${extra}". Nothing was imported.`);
  if (value.format !== FILTER_FORMAT) {
    errors.push(`Format must be "${FILTER_FORMAT}".`);
  }
  if (value.version !== FILTER_VERSION) {
    errors.push(`Version must be ${FILTER_VERSION}.`);
  }
  const id = readId(value.id, "Filter id", errors);
  if (typeof value.name !== "string" || !isSafeText(value.name, 40)) {
    errors.push("Filter name must be plain text of 1 to 40 characters.");
  }
  if (typeof value.showEverything !== "boolean") {
    errors.push("showEverything must be true or false.");
  }
  if (!Array.isArray(value.rules) || value.rules.length > MAX_RULES) {
    errors.push(`Rules must be a list of at most ${MAX_RULES}.`);
  }
  const rules: FilterRule[] = [];
  if (Array.isArray(value.rules) && value.rules.length <= MAX_RULES) {
    const ids = new Set<string>();
    for (let index = 0; index < value.rules.length; index += 1) {
      const rule = readRule(value.rules[index], index, errors);
      if (!rule) continue;
      if (ids.has(rule.id)) errors.push(`Rule id "${rule.id}" is duplicated.`);
      ids.add(rule.id);
      rules.push(rule);
    }
  }
  if (errors.length > 0 || !id || typeof value.name !== "string" || typeof value.showEverything !== "boolean") {
    return { ok: false, errors: errors.slice(0, 12) };
  }
  const document: FilterDocument = {
    format: FILTER_FORMAT,
    version: FILTER_VERSION,
    id,
    name: value.name,
    showEverything: value.showEverything,
    rules,
  };
  return { ok: true, document, warnings: semanticWarnings(document) };
}

function semanticWarnings(document: FilterDocument): RuleProblem[] {
  return inspectDocument(document);
}

/** Parse text. JSON.parse only — imported text is never executed. */
export function importFilterDocument(raw: string): ImportResult {
  if (typeof raw !== "string") {
    return { ok: false, errors: ["Import input must be text."] };
  }
  if (raw.length === 0) return { ok: false, errors: ["The file is empty."] };
  if (raw.length > MAX_CHARS) {
    return { ok: false, errors: ["The file is too large. Nothing was imported."] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, errors: ["That is not valid JSON. Nothing was imported or executed."] };
  }
  return parseFilterDocument(parsed);
}

export function exportFilterDocument(document: FilterDocument): string {
  const checked = parseFilterDocument(document);
  if (!checked.ok) {
    throw new Error(checked.errors.join(" "));
  }
  return JSON.stringify(checked.document, null, 2);
}

export function copyDocument(document: FilterDocument): FilterDocument {
  const checked = parseFilterDocument(document);
  if (!checked.ok) {
    throw new Error(checked.errors.join(" "));
  }
  return checked.document;
}

export function saveFilterDocument(
  document: FilterDocument,
  store: KeyValueStore,
): { ok: true } | { ok: false; errors: string[] } {
  const checked = parseFilterDocument(document);
  if (!checked.ok) return checked;
  store.setItem(FILTER_STORAGE_KEY, JSON.stringify(checked.document));
  return { ok: true };
}

export function loadFilterDocument(store: KeyValueStore): ImportResult {
  const raw = store.getItem(FILTER_STORAGE_KEY);
  if (raw == null || raw === "") return { ok: false, errors: ["No saved filter."] };
  return importFilterDocument(raw);
}

export function createRuleId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `r-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
