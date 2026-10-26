import { relicId } from "./ids.ts";
import type { Blow, EffectResult, RelicInstance, RelicRecord, World } from "./types.ts";

const COAT = relicId(4);
const CLOTH = relicId(76);

function fail(world: World, code: string, detail: string): EffectResult {
  return { ok: false, code, detail, world };
}

export function applyDeathPersistence(world: World, catalog: RelicRecord[]): void {
  const kept: RelicInstance[] = [];
  for (const instance of world.inventory) {
    const relic = catalog.find((entry) => entry.id === instance.relicId);
    const rule = relic?.persistence.onDeath ?? "remains";
    if (rule === "remains") {
      kept.push(instance);
    } else if (rule === "drops-fractured") {
      if (instance.state !== "spent") instance.state = "fractured";
      instance.bound.worn = false;
      world.placed.push({ where: world.sceneId, instance });
    } else if (rule === "returns-home") {
      instance.bound.worn = false;
      world.placed.push({ where: "hearth.silt", instance });
    } else if (rule === "banks-in-vein") {
      world.veinBank.push(instance);
    } else if (rule === "lost-if-fractured") {
      if (instance.state === "fractured" || instance.state === "spent") {
        world.flags[`lost.${instance.relicId}`] = true;
      } else {
        kept.push(instance);
      }
    } else {
      kept.push(instance);
    }
  }
  world.inventory = kept;
}

function die(draft: World, blow: Blow, catalog: RelicRecord[], detail: string): EffectResult {
  draft.actor.hp = 0;
  draft.actor.alive = false;
  draft.death = {
    cause: blow.source,
    prevented: false,
    by: "",
    scripted: blow.scripted,
    protected: blow.protected,
  };
  applyDeathPersistence(draft, catalog);
  draft.log.push(detail);
  return { ok: true, code: "died", detail, world: draft };
}

/**
 * Near-death is intentionally narrow:
 * the coat and the handkerchief only answer a bounded, non-scripted, non-protected blow
 * that would drop Ellis to 0 (or to the tape's slightly wider band).
 */
export function resolveBlow(world: World, blow: Blow, catalog: RelicRecord[]): EffectResult {
  if (!world.actor.alive) return fail(world, "already-dead", "Ellis is already dead.");
  const draft = structuredClone(world);
  const generous = draft.flags["coat.generous"] === true;
  const lethal = draft.actor.hp - blow.amount <= 0;
  const generousBand = generous && draft.actor.hp <= 2 && blow.amount > 0;
  if (!lethal && !generousBand) {
    draft.actor.hp -= blow.amount;
    const detail = `Ellis takes ${blow.amount} from ${blow.source} and is still up.`;
    draft.log.push(detail);
    return { ok: true, code: "wounded", detail, world: draft };
  }

  if (blow.scripted || blow.protected || !blow.bounded) {
    const why =
      blow.scripted || blow.protected
        ? "The vein does not bargain with a death the story already wrote."
        : "This death is outside the coat's narrow mercy. It is not a bounded near-death.";
    return die(draft, blow, catalog, why);
  }

  const coat = draft.inventory.find((item) => item.relicId === COAT);
  const improper = draft.flags["coat.improper"] === true;
  const coatReady =
    coat &&
    coat.bound.worn === true &&
    !improper &&
    (coat.state === "intact" || coat.state === "mending") &&
    draft.flags["coat.unavailable"] !== true;

  if (coatReady && coat) {
    coat.state = "fractured";
    coat.bound.worn = false;
    draft.inventory = draft.inventory.filter((item) => item !== coat);
    draft.placed.push({ where: String(draft.flags["coat.hearth"] ?? "hearth.silt"), instance: coat });
    draft.actor.hp = 1;
    draft.actor.mourningVisible = true;
    draft.death = { cause: blow.source, prevented: true, by: COAT, scripted: false, protected: false };
    const detail =
      "The coat takes the blow and leaves. It is already on the road toward the hearth, wet at the hem, and Ellis is alive with one breath.";
    draft.log.push(detail);
    draft.lineage.push({
      person: "Ione Pell",
      response: "She will find the coat on a chair again and hate that she recognizes the way it drips.",
    });
    return { ok: true, code: "coat-intercept", detail, world: draft };
  }

  const cloth = draft.inventory.find((item) => item.relicId === CLOTH);
  if (cloth && cloth.state === "intact" && cloth.bound.ready === true && lethal) {
    cloth.state = "spent";
    draft.actor.hp = 1;
    draft.actor.veinDebt = true;
    draft.flags["vein.debt"] = true;
    draft.death = { cause: blow.source, prevented: true, by: CLOTH, scripted: false, protected: false };
    const detail =
      "The bloodless handkerchief stains at last. Ellis stays. Until he sleeps at Silt Lane, no fractured relic will take a restoration.";
    draft.log.push(detail);
    return { ok: true, code: "cloth-intercept", detail, world: draft };
  }

  return die(draft, blow, catalog, `${blow.source} drops Ellis. Nothing he is wearing is allowed to argue.`);
}
