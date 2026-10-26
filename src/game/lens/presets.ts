import type { FilterDocument, FilterRule } from "./types.ts";
import { FILTER_FORMAT, FILTER_VERSION } from "./types.ts";

export interface FilterPreset {
  id: string;
  name: string;
  blurb: string;
  document: FilterDocument;
}

function doc(id: string, name: string, showEverything: boolean, rules: FilterRule[]): FilterDocument {
  return {
    format: FILTER_FORMAT,
    version: FILTER_VERSION,
    id,
    name,
    showEverything,
    rules,
  };
}

const trailRules: FilterRule[] = [
  {
    id: "trail-new",
    name: "First look",
    enabled: true,
    action: "emphasize",
    collectionStatus: ["undiscovered"],
    note: "New finds stay loud.",
  },
  {
    id: "trail-project",
    name: "On the vein",
    enabled: true,
    action: "emphasize",
    projectRelation: "current",
  },
  {
    id: "trail-quest",
    name: "Quest-bound",
    enabled: true,
    action: "emphasize",
    ownership: ["quest-bound"],
  },
  {
    id: "trail-surplus",
    name: "Quiet surplus scrap",
    enabled: true,
    action: "hide",
    category: { kind: "in", values: ["material"] },
    knownUse: ["no-current-use"],
    projectRelation: "not-current",
    collectionStatus: ["seen", "complete"],
    quantity: { min: 4 },
    note: "Large piles of scrap whose use you already know is none.",
  },
  {
    id: "trail-stack",
    name: "Stack spare materials",
    enabled: true,
    action: "collapse",
    category: { kind: "in", values: ["material"] },
    knownUse: ["known", "no-current-use"],
    projectRelation: "not-current",
  },
  {
    id: "trail-mastery",
    name: "Off mastery",
    enabled: true,
    action: "reduce",
    mastery: ["conflicts"],
    knownUse: ["known", "no-current-use"],
  },
  {
    id: "trail-done",
    name: "Finished notes",
    enabled: true,
    action: "reduce",
    category: { kind: "in", values: ["curiosity", "writing"] },
    collectionStatus: ["complete"],
    projectRelation: "not-current",
  },
];

const projectRules: FilterRule[] = [
  {
    id: "project-current",
    name: "Current project",
    enabled: true,
    action: "emphasize",
    projectRelation: "current",
  },
  {
    id: "project-new",
    name: "First look",
    enabled: true,
    action: "emphasize",
    collectionStatus: ["undiscovered"],
  },
  {
    id: "project-quest",
    name: "Quest-bound",
    enabled: true,
    action: "emphasize",
    ownership: ["quest-bound"],
  },
  {
    id: "project-coin",
    name: "Pocket the loose coin",
    enabled: true,
    action: "hide",
    category: { kind: "in", values: ["currency"] },
    knownUse: ["known"],
    projectRelation: "not-current",
    collectionStatus: ["seen", "partial", "complete"],
    quantity: { min: 2 },
  },
  {
    id: "project-rations",
    name: "Useless provisions",
    enabled: true,
    action: "hide",
    category: { kind: "in", values: ["provision"] },
    knownUse: ["no-current-use"],
    projectRelation: "not-current",
    collectionStatus: ["seen", "complete"],
    quantity: { min: 2 },
  },
  {
    id: "project-stack",
    name: "Stack other materials",
    enabled: true,
    action: "collapse",
    category: { kind: "in", values: ["material"] },
    knownUse: ["known", "no-current-use"],
    projectRelation: "not-current",
  },
  {
    id: "project-gear",
    name: "Off-project gear",
    enabled: true,
    action: "reduce",
    category: { kind: "in", values: ["weapon", "ward"] },
    knownUse: ["known", "no-current-use"],
    projectRelation: "not-current",
  },
];

const quietRules: FilterRule[] = [
  {
    id: "quiet-new",
    name: "First look",
    enabled: true,
    action: "emphasize",
    collectionStatus: ["undiscovered"],
  },
  {
    id: "quiet-project",
    name: "On the vein",
    enabled: true,
    action: "emphasize",
    projectRelation: "current",
  },
  {
    id: "quiet-quest",
    name: "Quest-bound",
    enabled: true,
    action: "emphasize",
    ownership: ["quest-bound"],
  },
  {
    id: "quiet-useless",
    name: "No current use",
    enabled: true,
    action: "hide",
    knownUse: ["no-current-use"],
    collectionStatus: ["seen", "partial", "complete"],
    quantity: { min: 1 },
  },
  {
    id: "quiet-stack",
    name: "Stack known materials",
    enabled: true,
    action: "collapse",
    category: { kind: "in", values: ["material"] },
    knownUse: ["known"],
  },
  {
    id: "quiet-food",
    name: "Quieter provisions",
    enabled: true,
    action: "reduce",
    category: { kind: "in", values: ["provision"] },
    knownUse: ["known", "no-current-use"],
  },
  {
    id: "quiet-mastery",
    name: "Off mastery",
    enabled: true,
    action: "reduce",
    mastery: ["conflicts"],
    knownUse: ["known", "no-current-use"],
  },
];

export const TRAIL_PRESET: FilterPreset = {
  id: "trail",
  name: "Trail",
  blurb: "Mark new finds, the current project, and quest-bound objects. Stack spare materials. Hide only large piles of useless scrap.",
  document: doc("trail", "Trail", false, trailRules),
};

export const PROJECT_PRESET: FilterPreset = {
  id: "project",
  name: "Project focus",
  blurb: "Keep the current project loud. Stack other materials. Hide known loose coin and useless provisions.",
  document: doc("project", "Project focus", false, projectRules),
};

export const QUIET_PRESET: FilterPreset = {
  id: "quiet",
  name: "Quiet ground",
  blurb: "Mark discoveries and the project. Hide objects you already know have no use. Stack known materials.",
  document: doc("quiet", "Quiet ground", false, quietRules),
};

export const EVERYTHING_PRESET: FilterPreset = {
  id: "everything",
  name: "Show everything",
  blurb: "Normal labels for every object. The Trail rules stay saved underneath the override.",
  document: doc("everything", "Show everything", true, trailRules.map((rule) => ({ ...rule, id: `all-${rule.id}` }))),
};

export const PRESETS: readonly FilterPreset[] = [
  TRAIL_PRESET,
  PROJECT_PRESET,
  QUIET_PRESET,
  EVERYTHING_PRESET,
];
