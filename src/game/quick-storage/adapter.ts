import { cloneWorld } from "./clone.ts";
import { depositMatching, hydrateWorld, placeManual, serializeWorld } from "./engine.ts";
import {
  addCategory,
  addRule,
  moveRule,
  removeCategory,
  removeRule,
  setLotMarks,
  setReserve,
  setRuleDestinations,
  setRuleEnabled,
  toggleRuleExclusion,
} from "./profile.ts";
import type {
  DepositReceipt,
  DepositRequest,
  ManualPlaceRequest,
  ManualResult,
  RoutingRule,
  StorageCategory,
  StorageWorld,
} from "./types.ts";

/**
 * Executable stand-in for the live inventory.
 * Writes lots and access flags only. It cannot dismantle, sell, consume,
 * donate, or change ownership — those operations are not on this port.
 */
export class ReferenceStorageAdapter {
  world: StorageWorld;

  constructor(world: StorageWorld) {
    this.world = cloneWorld(world);
  }

  deposit(request: DepositRequest): DepositReceipt {
    const result = depositMatching(this.world, request);
    this.world = result.world;
    return result.receipt;
  }

  place(request: ManualPlaceRequest): ManualResult {
    const result = placeManual(this.world, request);
    this.world = result.world;
    return result;
  }

  save(): string {
    return serializeWorld(this.world);
  }

  load(serialized: string): void {
    this.world = hydrateWorld(serialized);
  }

  moveRule(ruleId: string, direction: -1 | 1): void {
    this.world = moveRule(this.world, ruleId, direction);
  }

  setRuleEnabled(ruleId: string, enabled: boolean): void {
    this.world = setRuleEnabled(this.world, ruleId, enabled);
  }

  toggleRuleExclusion(ruleId: string, destinationId: string): void {
    this.world = toggleRuleExclusion(this.world, ruleId, destinationId);
  }

  setRuleDestinations(ruleId: string, destinationIds: string[]): void {
    this.world = setRuleDestinations(this.world, ruleId, destinationIds);
  }

  addRule(rule: RoutingRule): void {
    this.world = addRule(this.world, rule);
  }

  removeRule(ruleId: string): void {
    this.world = removeRule(this.world, ruleId);
  }

  addCategory(category: StorageCategory): void {
    this.world = addCategory(this.world, category);
  }

  removeCategory(categoryId: string): void {
    this.world = removeCategory(this.world, categoryId);
  }

  setReserve(definitionId: string, keepInPack: number): void {
    this.world = setReserve(this.world, definitionId, keepInPack);
  }

  setLotMarks(lotId: string, marks: { favorite?: boolean; equipped?: boolean }): void {
    this.world = setLotMarks(this.world, lotId, marks);
  }
}

export const REFUSED_EFFECTS = ["dismantle", "sell", "consume", "donate", "change-ownership"] as const;
