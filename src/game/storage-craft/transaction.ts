import { produceNext, resolveCraft } from "./resolve.ts";
import type { CraftCommit, CraftIssue, CraftPreview, CraftReceipt, CraftRequest, SavePort, SaveSignal, World } from "./types.ts";

export class InterruptedSaveError extends Error {
  constructor(message = "Save interrupted before publish") {
    super(message);
    this.name = "InterruptedSaveError";
  }
}

export class CancelledCraftError extends Error {
  constructor() {
    super("Craft cancelled");
    this.name = "CancelledCraftError";
  }
}

const OPEN: SaveSignal = { cancelled: false };

function fail(world: World, preview: CraftPreview, error: CraftIssue): CraftCommit {
  return { ok: false, replayed: false, world, preview, error, receipt: null };
}

/**
 * One shot against a snapshot. The input world is never mutated.
 * On failure the same world reference is returned.
 * A save port that throws publishes nothing.
 */
export function commitCraft(world: World, request: CraftRequest, save?: SavePort, signal: SaveSignal = OPEN): CraftCommit {
  if (signal.cancelled) {
    const preview = resolveCraft(world, request);
    return fail(world, preview, { code: "CANCELLED", message: "Craft cancelled before anything was taken." });
  }
  if (request.expectedRevision !== undefined && request.expectedRevision !== world.revision) {
    const preview = resolveCraft(world, request);
    return fail(world, preview, {
      code: "STALE_QUANTITY",
      message: "The larder changed since this craft was pinned.",
    });
  }

  const preview = resolveCraft(world, request);
  if (request.expectedToken !== undefined && request.expectedToken !== preview.stalenessToken) {
    return fail(world, preview, {
      code: "STALE_QUANTITY",
      message: "Pinned quantities no longer match the chests. Nothing was taken.",
    });
  }
  if (!preview.ok) {
    return fail(world, preview, preview.errors[0] ?? { code: "INSUFFICIENT", message: "Craft refused." });
  }
  if (signal.cancelled) {
    return fail(world, preview, { code: "CANCELLED", message: "Craft cancelled before anything was taken." });
  }

  const produced = produceNext(world, preview.draws, preview.deposits);
  if (!produced.ok) {
    return fail(world, preview, produced.issue);
  }

  const receipt: CraftReceipt = {
    id: `craft-${produced.world.revision}-${preview.recipeId}-x${preview.quantity}`,
    recipeId: preview.recipeId,
    quantity: preview.quantity,
    revision: produced.world.revision,
    draws: preview.draws,
    deposits: preview.deposits.map((deposit) => ({ ...deposit, containerId: deposit.containerId })),
    outputContainerId: preview.output.containerId,
  };

  if (save) {
    try {
      if (signal.cancelled) throw new CancelledCraftError();
      save.persist(produced.world, signal);
    } catch (error) {
      if (error instanceof CancelledCraftError) {
        return fail(world, preview, { code: "CANCELLED", message: "Craft cancelled before the save published." });
      }
      if (error instanceof InterruptedSaveError) {
        return fail(world, preview, {
          code: "INTERRUPTED_SAVE",
          message: "The save was interrupted. The larder was left as it was.",
        });
      }
      throw error;
    }
  }

  return { ok: true, replayed: false, world: produced.world, preview, error: null, receipt };
}

export interface MemorySaveOptions {
  interrupt?: "none" | "before" | "after-stage";
  /** Called after staging and before publish. Used to simulate cancel or a second press. */
  onStage?: () => void;
}

/**
 * In-memory atomic save. `published` changes only after a full persist.
 * Staging is dropped if publish does not happen.
 */
export class MemorySave implements SavePort {
  published: World | null = null;
  staging: World | null = null;
  interrupt: "none" | "before" | "after-stage" = "none";
  onStage?: () => void;
  persistCalls = 0;

  constructor(published: World | null = null, options: MemorySaveOptions = {}) {
    this.published = published ? structuredClone(published) : null;
    this.interrupt = options.interrupt ?? "none";
    this.onStage = options.onStage;
  }

  persist(next: World, signal: SaveSignal): void {
    this.persistCalls += 1;
    if (this.interrupt === "before" || signal.cancelled) {
      if (signal.cancelled) throw new CancelledCraftError();
      throw new InterruptedSaveError("before");
    }
    this.staging = structuredClone(next);
    this.onStage?.();
    if (signal.cancelled) {
      this.staging = null;
      throw new CancelledCraftError();
    }
    if (this.interrupt === "after-stage") {
      this.staging = null;
      throw new InterruptedSaveError("after-stage");
    }
    this.published = this.staging;
    this.staging = null;
  }
}

/**
 * Serializes crafts from the bench. A second press while one is inside
 * persist is refused. The same idempotency key does not consume twice.
 */
export class CraftSession {
  world: World;
  private lock = false;
  private cancelRequested = false;
  private receipts = new Map<string, CraftReceipt>();
  private save: SavePort;

  constructor(world: World, save: SavePort = new MemorySave()) {
    this.world = structuredClone(world);
    this.save = save;
  }

  get busy(): boolean {
    return this.lock;
  }

  requestCancel(): void {
    this.cancelRequested = true;
  }

  commit(request: CraftRequest): CraftCommit {
    if (this.lock) {
      const preview = resolveCraft(this.world, request);
      return {
        ok: false,
        replayed: false,
        world: this.world,
        preview,
        error: {
          code: "CONCURRENT_PRESS",
          message: "A craft is already in hand. The second press changed nothing.",
        },
        receipt: null,
      };
    }

    if (request.idempotencyKey) {
      const prior = this.receipts.get(request.idempotencyKey);
      if (prior) {
        const preview = resolveCraft(this.world, request);
        return { ok: true, replayed: true, world: this.world, preview, error: null, receipt: prior };
      }
    }

    this.lock = true;
    const readCancelled = () => this.cancelRequested;
    const live: SaveSignal = {
      get cancelled() {
        return readCancelled();
      },
    };

    try {
      if (this.cancelRequested) {
        const preview = resolveCraft(this.world, request);
        return {
          ok: false,
          replayed: false,
          world: this.world,
          preview,
          error: { code: "CANCELLED", message: "Craft cancelled before anything was taken." },
          receipt: null,
        };
      }
      const outcome = commitCraft(this.world, request, this.save, live);
      if (outcome.ok && outcome.receipt) {
        this.world = outcome.world;
        if (request.idempotencyKey) this.receipts.set(request.idempotencyKey, outcome.receipt);
      }
      return outcome;
    } finally {
      this.lock = false;
      this.cancelRequested = false;
    }
  }
}
