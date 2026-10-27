import type { LiveMinigameModule, ModuleId } from "../types.ts";

const registry = new Map<ModuleId, LiveMinigameModule>();

export function registerLiveModule(module: LiveMinigameModule): void {
  registry.set(module.moduleId, module);
}

export function unregisterLiveModule(moduleId: ModuleId): void {
  registry.delete(moduleId);
}

export function clearLiveModules(): void {
  registry.clear();
}

export function probeModule(moduleId: ModuleId): LiveMinigameModule | null {
  return registry.get(moduleId) ?? null;
}
