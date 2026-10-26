import { getPort } from "./reference/game-ports.ts";
import type {
  CatalogItem,
  HandlerId,
  HandlerResult,
  Instance,
  UseDef,
  Weather,
  WorkshopState,
} from "./types.ts";

export type UseContext = {
  state: WorkshopState;
  item: CatalogItem;
  instance: Instance;
  targetItem: CatalogItem | null;
  target: Instance | null;
  use: UseDef;
  confirmed: boolean;
};

const FOOD_HANDLERS = new Set<HandlerId>([
  "handler.cook",
  "handler.preserve",
  "handler.pour",
]);

export const SIGNATURE_KEYS: Record<HandlerId, string[]> = {
  "handler.noise-lure": ["action", "pitch", "rangeM", "windCut", "cadence", "indoor"],
  "handler.light-fit": ["role", "host", "needsSun"],
  "handler.cord-mend": ["stitch", "fiber", "wet", "loadKg", "refuses"],
  "handler.tether": ["role", "loadKg", "wet"],
  "handler.time-interval": ["method", "spanMin", "accuracy"],
  "handler.keepsake": ["proves"],
  "handler.contain": ["capacityMl", "accepts", "seal", "heat"],
  "handler.pour": ["stream", "goods"],
  "handler.store-dry": ["goods", "enemy"],
  "handler.preserve": ["method", "goods"],
  "handler.specimen": ["medium", "holds"],
  "handler.cook": ["method", "vessel"],
  "handler.heat-work": ["method", "charges"],
  "handler.cut": ["kerf", "stock"],
  "handler.fasten": ["method", "stock"],
  "handler.release": ["method", "stock"],
  "handler.bore": ["purpose", "stock"],
  "handler.hold": ["method", "span"],
  "handler.strike": ["face", "target"],
  "handler.press": ["method", "stock"],
  "handler.abrade": ["medium", "goal"],
  "handler.mark": ["medium", "surface"],
  "handler.measure": ["kind", "unit"],
  "handler.true-work": ["check", "surface"],
  "handler.seal": ["substance", "onto"],
  "handler.clean": ["method", "soil"],
  "handler.fuel": ["substance", "device"],
  "handler.carry": ["how", "what"],
  "handler.animal": ["method", "beast"],
  "handler.plant": ["method", "crop"],
  "handler.water-move": ["method", "volume"],
  "handler.boat": ["method", "piece"],
  "handler.stone": ["method", "rock"],
  "handler.teach": ["subject", "tool"],
  "handler.record": ["kind", "surface"],
  "handler.navigate": ["by", "waters"],
  "handler.signal": ["method", "rangeM"],
  "handler.wrap": ["against", "material"],
  "handler.cloth": ["method", "cloth"],
  "handler.filter": ["method", "mesh"],
  "handler.agitate": ["method", "batch"],
  "handler.probe": ["method", "finds"],
  "handler.lock": ["method", "bit"],
  "handler.hang": ["what", "place"],
  "handler.support": ["method", "holds"],
  "handler.template": ["of"],
  "handler.play": ["game"],
  "handler.protect": ["method", "against"],
  "handler.trap": ["method", "quarry"],
  "handler.repair-fit": ["method", "part"],
  "handler.smoke": ["method", "purpose"],
  "handler.mix": ["method", "batch"],
  "handler.pack": ["method", "fills"],
};

const HANDLER_PORTS: Record<HandlerId, string[]> = {
  "handler.noise-lure": ["port.world", "port.audio.emit"],
  "handler.light-fit": ["port.world"],
  "handler.cord-mend": ["port.world"],
  "handler.tether": ["port.world"],
  "handler.time-interval": ["port.clock", "port.world"],
  "handler.keepsake": ["port.quest.flag", "port.social.consent"],
  "handler.contain": ["port.world"],
  "handler.pour": ["port.world"],
  "handler.store-dry": ["port.world"],
  "handler.preserve": ["port.world"],
  "handler.specimen": ["port.world"],
  "handler.cook": ["port.world"],
  "handler.heat-work": ["port.world"],
  "handler.cut": ["port.world"],
  "handler.fasten": ["port.world"],
  "handler.release": ["port.world"],
  "handler.bore": ["port.world"],
  "handler.hold": ["port.world"],
  "handler.strike": ["port.world"],
  "handler.press": ["port.world"],
  "handler.abrade": ["port.world"],
  "handler.mark": ["port.world"],
  "handler.measure": ["port.world"],
  "handler.true-work": ["port.world"],
  "handler.seal": ["port.world"],
  "handler.clean": ["port.world"],
  "handler.fuel": ["port.world"],
  "handler.carry": ["port.inventory", "port.world"],
  "handler.animal": ["port.world"],
  "handler.plant": ["port.world"],
  "handler.water-move": ["port.world"],
  "handler.boat": ["port.world"],
  "handler.stone": ["port.world"],
  "handler.teach": ["port.world"],
  "handler.record": ["port.quest.flag"],
  "handler.navigate": ["port.world"],
  "handler.signal": ["port.world", "port.audio.emit"],
  "handler.wrap": ["port.world"],
  "handler.cloth": ["port.world"],
  "handler.filter": ["port.world"],
  "handler.agitate": ["port.world"],
  "handler.probe": ["port.world"],
  "handler.lock": ["port.world"],
  "handler.hang": ["port.display.fixture", "port.world"],
  "handler.support": ["port.world"],
  "handler.template": ["port.world"],
  "handler.play": ["port.world"],
  "handler.protect": ["port.world"],
  "handler.trap": ["port.world"],
  "handler.repair-fit": ["port.world"],
  "handler.smoke": ["port.world"],
  "handler.mix": ["port.world"],
  "handler.pack": ["port.world"],
};

export function portsFor(handler: HandlerId): string[] {
  return HANDLER_PORTS[handler];
}

function missingFrom(handler: HandlerId): string[] {
  return portsFor(handler).filter((id) => getPort(id)?.status === "missing");
}

function result(handler: HandlerId, partial: Omit<HandlerResult, "missingPorts" | "via">): HandlerResult {
  return { ...partial, missingPorts: missingFrom(handler), via: "workshop-stand-in" };
}

function fail(handler: HandlerId, message: string): HandlerResult {
  return result(handler, { ok: false, messages: [message] });
}

function ok(handler: HandlerId, messages: string[], extra?: Partial<HandlerResult>): HandlerResult {
  return result(handler, { ok: true, messages, ...extra });
}

function num(params: UseDef["params"], key: string): number {
  const value = params[key];
  return typeof value === "number" ? value : Number(value);
}

function str(params: UseDef["params"], key: string): string {
  const value = params[key];
  return value === undefined ? "" : String(value);
}

function hasRule(item: CatalogItem, id: string): boolean {
  return item.protection.rules.some((rule) => rule.id === id);
}

function tooWorn(ctx: UseContext, min: number): HandlerResult | null {
  if (ctx.instance.condition < min) {
    return fail(
      ctx.use.handler,
      `${ctx.item.name} is too far gone for that (${ctx.instance.condition}). It needs to be at least ${min}.`,
    );
  }
  return null;
}

function foodBlocked(ctx: UseContext): HandlerResult | null {
  const foodGoods = /food|drink|milk|flour|lard|cider|jam|apple|butter|meal|lunch|cracker|tea|egg|kraut|broth/;
  const blob = `${str(ctx.use.params, "accepts")} ${str(ctx.use.params, "goods")} ${str(ctx.use.params, "vessel")}`;
  const foodish = FOOD_HANDLERS.has(ctx.use.handler) || foodGoods.test(blob);
  if (!foodish) return null;
  if (hasRule(ctx.item, "no-food-use")) {
    return fail(ctx.use.handler, `${ctx.item.name} is barred from food. ${ctx.item.protection.plain}`);
  }
  if (hasRule(ctx.item, "scour-before-food") && !ctx.instance.tags.includes("scoured")) {
    return fail(
      ctx.use.handler,
      `${ctx.item.name} has to be scoured and marked before it touches anything you would eat.`,
    );
  }
  return null;
}

function personBlocked(ctx: UseContext): HandlerResult | null {
  if (!hasRule(ctx.item, "no-person-as-target")) return null;
  const target = `${str(ctx.use.params, "target")} ${str(ctx.use.params, "stock")}`.toLowerCase();
  if (target.includes("person") || target.includes("body")) {
    return fail(ctx.use.handler, `${ctx.item.name} is a tool. It is not turned on a person.`);
  }
  return null;
}

function snareBlocked(ctx: UseContext): HandlerResult | null {
  if (!hasRule(ctx.item, "no-animal-snare")) return null;
  const blob = Object.values(ctx.use.params).join(" ").toLowerCase();
  if (blob.includes("snare") || blob.includes("trap-animal")) {
    return fail(ctx.use.handler, ctx.item.protection.plain);
  }
  return null;
}

function sparkBlocked(ctx: UseContext): HandlerResult | null {
  if (!hasRule(ctx.item, "spark-ban")) return null;
  if (ctx.use.handler === "handler.strike" || str(ctx.use.params, "method") === "strike") {
    return fail(ctx.use.handler, `${ctx.item.name} is the piece you use where steel would throw a spark.`);
  }
  return null;
}

function needFixture(ctx: UseContext, fixture: string, why: string): HandlerResult | null {
  if (!ctx.state.fixtures.includes(fixture)) {
    return fail(ctx.use.handler, why);
  }
  return null;
}

function needTarget(ctx: UseContext): HandlerResult | null {
  if (!ctx.use.targetTag && !ctx.use.targetItemId) return null;
  if (!ctx.target) {
    const hint = ctx.use.targetTag ?? ctx.use.targetItemId ?? "a second object";
    return fail(ctx.use.handler, `${ctx.item.name} needs ${hint} on the bench, and one chosen.`);
  }
  if (ctx.use.targetTag && !ctx.target.tags.includes(ctx.use.targetTag)) {
    return fail(ctx.use.handler, `${ctx.targetItem?.name ?? "That"} is not a ${ctx.use.targetTag}.`);
  }
  if (ctx.use.targetItemId && ctx.target.itemId !== ctx.use.targetItemId) {
    return fail(ctx.use.handler, `That is the wrong object for this job.`);
  }
  return null;
}

function weatherName(weather: Weather): string {
  if (weather === "calm") return "still air";
  if (weather === "wind") return "this wind";
  if (weather === "wet") return "the wet";
  if (weather === "frost") return "the frost";
  return "this fog";
}

function guard(ctx: UseContext, min: number): HandlerResult | null {
  return (
    tooWorn(ctx, ctx.use.minCondition ?? min) ??
    foodBlocked(ctx) ??
    personBlocked(ctx) ??
    snareBlocked(ctx) ??
    sparkBlocked(ctx) ??
    needTarget(ctx)
  );
}

function wear(amount = 2): Partial<HandlerResult> {
  return { conditionDelta: -amount };
}

export function runUse(ctx: UseContext): HandlerResult {
  const blocked = guard(ctx, 15);
  if (blocked) return blocked;
  const handler = ctx.use.handler;
  switch (handler) {
    case "handler.noise-lure":
      return runNoise(ctx);
    case "handler.light-fit":
      return runLight(ctx);
    case "handler.cord-mend":
      return runMend(ctx);
    case "handler.tether":
      return runTether(ctx);
    case "handler.time-interval":
      return runTime(ctx);
    case "handler.keepsake":
      return runKeepsake(ctx);
    case "handler.contain":
      return runContain(ctx);
    case "handler.pour":
      return runPour(ctx);
    case "handler.store-dry":
      return runStore(ctx);
    case "handler.preserve":
      return runPreserve(ctx);
    case "handler.specimen":
      return runSpecimen(ctx);
    case "handler.cook":
      return runCook(ctx);
    case "handler.heat-work":
      return runHeat(ctx);
    case "handler.cut":
      return runStock(ctx, "cut", str(ctx.use.params, "kerf"), str(ctx.use.params, "stock"));
    case "handler.fasten":
      return runStock(ctx, "fastened", str(ctx.use.params, "method"), str(ctx.use.params, "stock"));
    case "handler.release":
      return runStock(ctx, "released", str(ctx.use.params, "method"), str(ctx.use.params, "stock"));
    case "handler.bore":
      return runStock(ctx, "bored", str(ctx.use.params, "purpose"), str(ctx.use.params, "stock"));
    case "handler.hold":
      return runHold(ctx);
    case "handler.strike":
      return runStrike(ctx);
    case "handler.press":
      return runStock(ctx, "pressed", str(ctx.use.params, "method"), str(ctx.use.params, "stock"));
    case "handler.abrade":
      return runAbrade(ctx);
    case "handler.mark":
      return runMark(ctx);
    case "handler.measure":
      return runMeasure(ctx);
    case "handler.true-work":
      return runTrue(ctx);
    case "handler.seal":
      return runSeal(ctx);
    case "handler.clean":
      return runClean(ctx);
    case "handler.fuel":
      return runFuel(ctx);
    case "handler.carry":
      return runCarry(ctx);
    case "handler.animal":
      return runAnimal(ctx);
    case "handler.plant":
      return runPlant(ctx);
    case "handler.water-move":
      return runWater(ctx);
    case "handler.boat":
      return runBoat(ctx);
    case "handler.stone":
      return runStone(ctx);
    case "handler.teach":
      return ok(handler, [ctx.use.line, `Lesson held: ${str(ctx.use.params, "subject")}, using ${str(ctx.use.params, "tool")}.`], {
        flags: [`taught:${str(ctx.use.params, "subject")}`],
        ...wear(1),
      });
    case "handler.record":
      return runRecord(ctx);
    case "handler.navigate":
      return ok(
        handler,
        [ctx.use.line, `Read by ${str(ctx.use.params, "by")} for ${str(ctx.use.params, "waters")}. The sheet does not move you.`],
        { flags: [`nav:${str(ctx.use.params, "waters")}`] },
      );
    case "handler.signal":
      return runSignal(ctx);
    case "handler.wrap":
      return ok(
        handler,
        [ctx.use.line, `Wrapped against ${str(ctx.use.params, "against")} with ${str(ctx.use.params, "material")}.`],
        { addTags: [`wrapped:${str(ctx.use.params, "against")}`], ...wear(1) },
      );
    case "handler.cloth":
      return runCloth(ctx);
    case "handler.filter":
      return ok(
        handler,
        [ctx.use.line, `Separated on ${str(ctx.use.params, "mesh")} by ${str(ctx.use.params, "method")}.`],
        { addTags: [`filtered:${str(ctx.use.params, "method")}`], ...wear(1) },
      );
    case "handler.agitate":
      return ok(handler, [ctx.use.line, `${str(ctx.use.params, "method")} worked through ${str(ctx.use.params, "batch")}.`], {
        addTags: [`worked:${str(ctx.use.params, "batch")}`],
        ...wear(2),
      });
    case "handler.probe":
      return ok(handler, [ctx.use.line, `Probed for ${str(ctx.use.params, "finds")} by ${str(ctx.use.params, "method")}.`], {
        flags: [`probed:${str(ctx.use.params, "finds")}`],
        ...wear(1),
      });
    case "handler.lock":
      return runLock(ctx);
    case "handler.hang":
      return ok(
        handler,
        [ctx.use.line, `${str(ctx.use.params, "what")} can hang at ${str(ctx.use.params, "place")} without the heat, or the cloth, touching the wall.`],
        { addTags: [`hung:${str(ctx.use.params, "what")}`] },
      );
    case "handler.support":
      return runSupport(ctx);
    case "handler.template":
      return ok(handler, [ctx.use.line, `The outline of ${str(ctx.use.params, "of")} is taken. The original is not cut.`], {
        flags: [`template:${str(ctx.use.params, "of")}`],
      });
    case "handler.play":
      return ok(handler, [ctx.use.line, `Played as ${str(ctx.use.params, "game")}. Pegs or cards also tally if you keep the count honest.`], {
        flags: [`played:${str(ctx.use.params, "game")}`],
      });
    case "handler.protect":
      return runProtect(ctx);
    case "handler.trap":
      return runTrap(ctx);
    case "handler.repair-fit":
      return ok(
        handler,
        [ctx.use.line, `${str(ctx.use.params, "method")} fitted to ${str(ctx.use.params, "part")}. It is a repair, not a new part from a shop.`],
        { addTags: [`fitted:${str(ctx.use.params, "part")}`], ...wear(2) },
      );
    case "handler.smoke":
      return runSmoke(ctx);
    case "handler.mix":
      return ok(handler, [ctx.use.line, `Mixed ${str(ctx.use.params, "batch")} by ${str(ctx.use.params, "method")}. One batch, in this vessel.`], {
        addTags: [`mixed:${str(ctx.use.params, "batch")}`],
        ...wear(2),
      });
    case "handler.pack":
      return runPack(ctx);
    default:
      return fail(handler, `No handler is implemented for ${handler}.`);
  }
}

function runNoise(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  if (str(ctx.use.params, "indoor") === "yes" && !ctx.state.fixtures.includes("interior")) {
    return fail(handler, "That note is meant for a room. There is no interior here to hold it.");
  }
  const range = num(ctx.use.params, "rangeM");
  const cut = ctx.state.weather === "wind" ? num(ctx.use.params, "windCut") : 0;
  const heard = Math.round(range * (1 - cut));
  if (heard < 10) {
    return fail(
      handler,
      `${ctx.use.line} ${weatherName(ctx.state.weather)} eats it. About ${heard} paces, which will not raise anyone.`,
    );
  }
  const fog =
    ctx.state.weather === "fog" && str(ctx.use.params, "action") === "blast"
      ? " Fog is what this one is for."
      : "";
  return ok(
    handler,
    [
      ctx.use.line,
      `${str(ctx.use.params, "pitch")} ${str(ctx.use.params, "action")}, cadence “${str(ctx.use.params, "cadence")}”, about ${heard} paces in ${weatherName(ctx.state.weather)}.${fog} No sound is played — the county audio is not connected.`,
    ],
    { flags: [`heard:${str(ctx.use.params, "cadence")}`], ...wear(1) },
  );
}

function runLight(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  const role = str(ctx.use.params, "role");
  if (str(ctx.use.params, "needsSun") === "yes") {
    const sun = ctx.state.hour >= 9 && ctx.state.hour <= 15 && (ctx.state.weather === "calm" || ctx.state.weather === "frost");
    if (!sun) {
      return fail(handler, "A burning glass needs a clear hour between nine and three. Not now.");
    }
  }
  if (role === "hood" || role === "reflector" || role === "wick") {
    const host = ctx.target;
    if (!host || !host.tags.includes("lamp")) {
      return fail(handler, "That fitting needs a lamp chosen on the bench. It does not light by itself.");
    }
    if (host.tags.some((tag) => tag.startsWith("fitting:"))) {
      return fail(handler, "The lamp already wears one fitting. Take it off before adding another.");
    }
  }
  const extra: Partial<HandlerResult> =
    role === "hood" || role === "reflector" || role === "wick"
      ? {
          targetId: ctx.target?.instanceId,
          targetAddTags: [`fitting:${role}`],
          consumeInstance: role === "hood",
          qtyDelta: role === "wick" ? -1 : undefined,
        }
      : { addTags: [`light:${role}`] };
  return ok(handler, [ctx.use.line, `Fitted as ${role} on ${str(ctx.use.params, "host")}.`], { ...extra, ...wear(1) });
}

function runMend(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  const load = num(ctx.use.params, "loadKg");
  if (load > 12 && str(ctx.use.params, "fiber") === "linen") {
    return fail(handler, `Linen thread is a whipping and a net mend, not a line for ${load} kilos.`);
  }
  if (ctx.state.weather === "wet" && str(ctx.use.params, "wet") === "no") {
    return fail(handler, "This fiber slacks in the wet. Wait until it is dry, or use a waxed thread.");
  }
  const refuses = str(ctx.use.params, "refuses");
  if (
    refuses &&
    ctx.target &&
    refuses.split(",").some((part) => ctx.target?.tags.includes(part) || ctx.targetItem?.tags.includes(part))
  ) {
    return fail(handler, `This needle or thread refuses ${refuses}. Use the tool shaped for that cloth.`);
  }
  if (ctx.instance.qty < 1 && ctx.item.stack !== "unique") {
    return fail(handler, "Nothing left on the spool or in the hank.");
  }
  return ok(
    handler,
    [ctx.use.line, `${str(ctx.use.params, "stitch")} in ${str(ctx.use.params, "fiber")}, rated about ${load} kg while the stitch is new.`],
    {
      qtyDelta: ctx.item.stack === "unique" ? 0 : -Math.max(1, Math.round(load / 2)),
      targetId: ctx.target?.instanceId,
      targetAddTags: [`mended:${str(ctx.use.params, "stitch")}`],
      targetConditionDelta: ctx.target ? 12 : 0,
      ...wear(1),
    },
  );
}

function runTether(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  const load = num(ctx.use.params, "loadKg");
  if (str(ctx.use.params, "role") === "component" && load > 8) {
    return fail(handler, "A thread spool is a component in a tether, not the tether. The load is too high for the fiber alone.");
  }
  if (ctx.state.weather === "wet" && str(ctx.use.params, "wet") === "no") {
    return fail(handler, "The knot will slip while this is wet.");
  }
  return ok(handler, [ctx.use.line, `${str(ctx.use.params, "role")}, about ${load} kg, in ${weatherName(ctx.state.weather)}.`], {
    addTags: [`tether:${str(ctx.use.params, "role")}`],
    qtyDelta: ctx.item.stack === "counted" ? -2 : 0,
    ...wear(1),
  });
}

function runTime(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  const span = num(ctx.use.params, "spanMin");
  if (str(ctx.use.params, "method") === "balance" && !ctx.instance.tags.includes("keeps-time-short") && ctx.instance.condition < 60) {
    return fail(handler, "The balance will not hold an interval until the watch is oiled and the pivots are free.");
  }
  if (str(ctx.use.params, "method") === "noon-crosscheck" && (ctx.state.hour < 11 || ctx.state.hour > 13)) {
    return fail(handler, "Local noon is the only check this needle can give the watch. It is not that hour.");
  }
  return ok(
    handler,
    [ctx.use.line, `${str(ctx.use.params, "method")} marks about ${span} minutes, accuracy ${str(ctx.use.params, "accuracy")}. The game clock did not move.`],
    { flags: [`timed:${span}`], ...wear(1) },
  );
}

function runKeepsake(ctx: UseContext): HandlerResult {
  return ok(
    ctx.use.handler,
    [
      ctx.use.line,
      `It proves ${str(ctx.use.params, "proves")}. No quest memory is written — that store is not connected. The shed only notes that you looked.`,
    ],
    { flags: [`keepsake:${ctx.item.id}`] },
  );
}

function runContain(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  if (ctx.instance.condition < 25 && str(ctx.use.params, "seal") !== "none-leaks") {
    return fail(handler, "It leaks. Scour or mend it before it will hold.");
  }
  const goods = str(ctx.use.params, "accepts");
  if (ctx.state.weather === "frost" && str(ctx.use.params, "heat") === "no" && goods.includes("liquid")) {
    return fail(handler, "A hard frost will split this if you leave liquid in it.");
  }
  return ok(handler, [ctx.use.line, `Holds about ${num(ctx.use.params, "capacityMl")} ml. Accepts ${goods}. Seal: ${str(ctx.use.params, "seal")}.`], {
    contents: goods,
    addTags: ["filled"],
  });
}

function runPour(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  if (!ctx.instance.contents && !ctx.instance.tags.includes("filled") && str(ctx.use.params, "goods") !== "empty-directed") {
    return fail(handler, "Nothing is in it to pour. Fill it first, or use it only as a director for goods you tip from something else.");
  }
  return ok(handler, [ctx.use.line, `${str(ctx.use.params, "stream")} stream of ${str(ctx.use.params, "goods")}.`], {
    addTags: [`poured:${str(ctx.use.params, "stream")}`],
    ...wear(1),
  });
}

function runStore(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  if (ctx.state.weather === "wet" && str(ctx.use.params, "enemy") === "damp" && str(ctx.use.params, "seal") !== "tight") {
    return fail(handler, `Damp is the enemy of ${str(ctx.use.params, "goods")}. This will not keep them in the wet as it sits.`);
  }
  return ok(handler, [ctx.use.line, `Keeps ${str(ctx.use.params, "goods")} from ${str(ctx.use.params, "enemy")}.`], {
    contents: str(ctx.use.params, "goods"),
    addTags: ["stored"],
  });
}

function runPreserve(ctx: UseContext): HandlerResult {
  return ok(
    ctx.use.handler,
    [ctx.use.line, `${str(ctx.use.params, "method")} set aside ${str(ctx.use.params, "goods")}. One vessel, one batch.`],
    { contents: `${str(ctx.use.params, "method")}:${str(ctx.use.params, "goods")}`, addTags: ["preserved"], ...wear(1) },
  );
}

function runSpecimen(ctx: UseContext): HandlerResult {
  return ok(
    ctx.use.handler,
    [ctx.use.line, `Specimen kept ${str(ctx.use.params, "medium")}: ${str(ctx.use.params, "holds")}.`],
    { contents: `specimen:${str(ctx.use.params, "holds")}`, addTags: ["specimen"], ...wear(0) },
  );
}

function runCook(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  const needsStove = str(ctx.use.params, "method") !== "steep";
  if (needsStove) {
    const missing = needFixture(ctx, "shed-stove", "There is no stove in reach. This shed's stand-in stove is the only heat, and it is not lit in the fixtures.");
    if (missing && !ctx.state.fixtures.includes("shed-stove")) return missing;
  }
  return ok(handler, [ctx.use.line, `${str(ctx.use.params, "method")} in ${str(ctx.use.params, "vessel")}.`], {
    addTags: [`cooked:${str(ctx.use.params, "method")}`],
    ...wear(2),
  });
}

function runHeat(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  const method = str(ctx.use.params, "method");
  if (method !== "spring-chill" && method !== "thaw-latch") {
    if (!ctx.state.fixtures.includes("shed-stove") && method !== "sun-warm") {
      return fail(handler, "This needs the shed stove. No other fire is modeled.");
    }
  }
  if (method === "thaw-latch" && ctx.state.weather !== "frost") {
    return fail(handler, "The latch is not frozen. Salt would only pit the iron.");
  }
  return ok(handler, [ctx.use.line, `${method}, charge: ${str(ctx.use.params, "charges")}.`], {
    addTags: [`heat:${method}`],
    flags: [`heat:${method}`],
    ...wear(method === "warm-mass" ? 1 : 2),
  });
}

function runStock(ctx: UseContext, verb: string, method: string, stock: string): HandlerResult {
  if (!method || !stock) return fail(ctx.use.handler, "The action is missing its method or its stock.");
  if (method === "flush" && !ctx.instance.tags.includes("blade-free")) {
    return ok(
      ctx.use.handler,
      [ctx.use.line, `The blade has to come out of the frame to ${verb} ${stock} flush. Count it done only in a gap the frame cannot enter.`],
      { addTags: ["blade-free"], ...wear(3) },
    );
  }
  return ok(ctx.use.handler, [ctx.use.line, `${verb}: ${method} on ${stock}.`], {
    addTags: [`${verb}:${method}`],
    ...wear(2),
  });
}

function runHold(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  return ok(ctx.use.handler, [ctx.use.line, `Held by ${method}, span ${str(ctx.use.params, "span")}. One piece at a time.`], {
    targetId: ctx.target?.instanceId,
    targetAddTags: [`held:${method}`],
    addTags: [`holding:${method}`],
    ...wear(1),
  });
}

function runStrike(ctx: UseContext): HandlerResult {
  const face = str(ctx.use.params, "face");
  const target = str(ctx.use.params, "target");
  if (face === "claw" && target === "nail-head") {
    return ok(ctx.use.handler, [ctx.use.line, "The face drives. The claw is the other use."], { ...wear(2) });
  }
  return ok(ctx.use.handler, [ctx.use.line, `${face} on ${target}.`], {
    targetId: ctx.target?.instanceId,
    targetAddTags: target ? [`struck:${target}`] : undefined,
    ...wear(2),
  });
}

function runAbrade(ctx: UseContext): HandlerResult {
  const medium = str(ctx.use.params, "medium");
  const goal = str(ctx.use.params, "goal");
  if (medium === "oilstone-back" && goal !== "chisel-back") {
    return fail(ctx.use.handler, "The flat of the oilstone is for a chisel or plane back, not a general scrub.");
  }
  return ok(ctx.use.handler, [ctx.use.line, `${medium} worked toward ${goal}.`], {
    targetId: ctx.target?.instanceId,
    targetConditionDelta: ctx.target && goal.includes("edge") ? 6 : 0,
    ...wear(3),
  });
}

function runMark(ctx: UseContext): HandlerResult {
  const medium = str(ctx.use.params, "medium");
  if (medium === "whitewash" || medium === "lime") {
    return ok(ctx.use.handler, [ctx.use.line, `Lime on ${str(ctx.use.params, "surface")}. It will weather off; it is not paint from a can.`], {
      addTags: ["marked"],
      qtyDelta: ctx.item.stack === "counted" ? -1 : 0,
      ...wear(1),
    });
  }
  return ok(ctx.use.handler, [ctx.use.line, `${medium} on ${str(ctx.use.params, "surface")}.`], {
    addTags: ["marked"],
    qtyDelta: ctx.item.stack === "counted" && medium === "chalk" ? -1 : 0,
    ...wear(1),
  });
}

function runMeasure(ctx: UseContext): HandlerResult {
  return ok(
    ctx.use.handler,
    [ctx.use.line, `${str(ctx.use.params, "kind")} in ${str(ctx.use.params, "unit")}. The number stays on the stock or in the log, not in a quest.`],
    { flags: [`measured:${str(ctx.use.params, "kind")}`] },
  );
}

function runTrue(ctx: UseContext): HandlerResult {
  const check = str(ctx.use.params, "check");
  if (check === "plumb-line" && ctx.state.weather === "wind") {
    return fail(ctx.use.handler, "A bare line will not hang true in this wind. Use the bob, or wait.");
  }
  return ok(ctx.use.handler, [ctx.use.line, `Checked ${check} against ${str(ctx.use.params, "surface")}.`], {
    flags: [`trued:${check}`],
  });
}

function runSeal(ctx: UseContext): HandlerResult {
  if (ctx.item.stack !== "unique" && ctx.instance.qty <= 0) {
    return fail(ctx.use.handler, "The tin or the block is empty.");
  }
  return ok(
    ctx.use.handler,
    [ctx.use.line, `${str(ctx.use.params, "substance")} on ${str(ctx.use.params, "onto")}.`],
    {
      qtyDelta: ctx.item.stack === "unique" ? 0 : -1,
      targetId: ctx.target?.instanceId,
      targetAddTags: [`sealed:${str(ctx.use.params, "substance")}`],
      ...wear(1),
    },
  );
}

function runClean(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "solvent" && ctx.state.era === "return" && str(ctx.use.params, "soil") === "pine-tar") {
    return ok(
      ctx.use.handler,
      [ctx.use.line, "The kerosene is fourteen years stale. It still cuts tar, and it leaves a varnish smell on the hands."],
      { addTags: ["solvent-used"], qtyDelta: ctx.item.stack === "counted" ? -1 : 0, ...wear(1) },
    );
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method} against ${str(ctx.use.params, "soil")}.`], {
    targetId: ctx.target?.instanceId,
    targetAddTags: method === "scour" ? ["scoured"] : [`cleaned:${method}`],
    ...wear(1),
  });
}

function runFuel(ctx: UseContext): HandlerResult {
  const handler = ctx.use.handler;
  if (hasRule(ctx.item, "do-not-burn")) {
    return fail(handler, ctx.item.protection.plain);
  }
  if (hasRule(ctx.item, "leave-a-reserve") && ctx.instance.qty <= 1) {
    return fail(handler, "Leave the last of it. The lamp or the stove still needs a reserve.");
  }
  const substance = str(ctx.use.params, "substance");
  const stale = ctx.state.era === "return" && (substance === "kerosene" || substance === "lard");
  const sputter = stale && ctx.state.hour % 2 === 1;
  return ok(
    handler,
    [
      ctx.use.line,
      stale
        ? `${substance} for ${str(ctx.use.params, "device")}. Fourteen years on, it is stale.${sputter ? " It catches, then crawls." : " It will burn, poorly."}`
        : `${substance} for ${str(ctx.use.params, "device")}.`,
    ],
    {
      qtyDelta: ctx.item.stack === "unique" ? 0 : -1,
      addTags: [stale ? "burned-stale" : "burned"],
      flags: [sputter ? "sputter" : `fueled:${substance}`],
      ...wear(1),
    },
  );
}

function runCarry(ctx: UseContext): HandlerResult {
  const how = str(ctx.use.params, "how");
  if (how === "tongs-hot" && ctx.instance.tags.includes("ice-wet")) {
    return fail(ctx.use.handler, "Wipe the melt off before the tongs take a hot kettle. They will spit.");
  }
  if (how === "tongs-ice") {
    return ok(ctx.use.handler, [ctx.use.line, `Gripped ${str(ctx.use.params, "what")}.`], {
      addTags: ["ice-wet"],
      ...wear(1),
    });
  }
  if (how === "pick-bag" && ctx.instance.tags.includes("sooty")) {
    return fail(ctx.use.handler, "The bag is sooty from kindling. Fruit would take the smell. Dump and beat it first.");
  }
  if (how === "dump-kindling") {
    return ok(ctx.use.handler, [ctx.use.line, "Kindling dumped. The canvas is sooty now and will not carry fruit until it is beaten."], {
      addTags: ["sooty"],
      removeTags: ["fruit-clean"],
    });
  }
  return ok(ctx.use.handler, [ctx.use.line, `${how}: ${str(ctx.use.params, "what")}.`], { ...wear(1) });
}

function runAnimal(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "medicine-person") {
    return fail(ctx.use.handler, "This package does not treat a person. The liniment is for leather and for stock, as labeled.");
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method} for ${str(ctx.use.params, "beast")}. No animal is simulated; the gear is only prepared or noted.`], {
    addTags: [`animal:${method}`],
    flags: [`animal:${method}`],
    ...wear(1),
  });
}

function runPlant(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "graft" && !ctx.state.fixtures.includes("living-stock")) {
    return fail(
      ctx.use.handler,
      "There is no living stock in the shed. Orchard trees are not connected (port.world flora). The dressing can be made; it cannot be set here.",
    );
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method} on ${str(ctx.use.params, "crop")}.`], {
    qtyDelta: ctx.item.stack === "counted" ? -1 : 0,
    flags: [`plant:${method}`],
    ...wear(1),
  });
}

function runWater(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "wet-down" && !ctx.state.fixtures.includes("creek") && str(ctx.use.params, "volume") === "creek") {
    return fail(ctx.use.handler, "The creek is not in reach of this gesture.");
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method}, ${str(ctx.use.params, "volume")}.`], {
    addTags: [`water:${method}`],
    targetId: ctx.target?.instanceId,
    targetAddTags: method === "rinse-tool" ? ["rinsed"] : undefined,
    ...wear(1),
  });
}

function runBoat(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if ((method === "row" || method === "pole") && !ctx.state.fixtures.includes("creek")) {
    return fail(ctx.use.handler, "The oar needs water. The creek is a stand-in fixture; it is not here if the list drops it.");
  }
  if (method === "caulk" && !ctx.state.fixtures.includes("skiff-on-the-ways")) {
    return fail(ctx.use.handler, "The skiff is not on the ways. There is no seam in reach.");
  }
  if (method === "sample" && ctx.state.weather === "frost") {
    return fail(ctx.use.handler, "The tallow will not take a bottom sample through ice.");
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method} on ${str(ctx.use.params, "piece")}.`], {
    flags: [`boat:${method}`],
    addTags: [`boat:${method}`],
    ...wear(2),
  });
}

function runStone(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "drift" && str(ctx.use.params, "rock") !== "non-spark") {
    return fail(ctx.use.handler, "The copper drift is for a pin where steel would spark. It is a poor chisel for dressed stone.");
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method} in ${str(ctx.use.params, "rock")}.`], {
    addTags: [`stone:${method}`],
    ...wear(3),
  });
}

function runRecord(ctx: UseContext): HandlerResult {
  const kind = str(ctx.use.params, "kind");
  if (kind === "tab" && hasRule(ctx.item, "no-wipe-tab") && !ctx.confirmed) {
    return fail(ctx.use.handler, "The tab stays until you mark it paid. Wiping it to clear a debt is refused.");
  }
  if (kind === "dated-paper" && hasRule(ctx.item, "do-not-burn")) {
    return ok(
      ctx.use.handler,
      [ctx.use.line, "The date is read and left intact. These sheets are evidence of the fourteen years, not kindling."],
      { flags: [`record:${kind}`] },
    );
  }
  return ok(ctx.use.handler, [ctx.use.line, `Recorded as ${kind} on ${str(ctx.use.params, "surface")}. Not written into quest memory.`], {
    flags: [`record:${kind}`],
    addTags: kind === "tab" && ctx.confirmed ? ["tab-cleared"] : ["noted"],
  });
}

function runSignal(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "mirror" && (ctx.state.weather === "fog" || ctx.state.weather === "wet")) {
    return fail(ctx.use.handler, "There is no sun to throw. A mirror does nothing useful in this weather.");
  }
  if (method === "mirror" && (ctx.state.hour < 8 || ctx.state.hour > 17)) {
    return fail(ctx.use.handler, "Too dark for a flash.");
  }
  const range = num(ctx.use.params, "rangeM");
  return ok(ctx.use.handler, [ctx.use.line, `${method}, about ${range} paces if someone is looking.`], {
    flags: [`signal:${method}`],
  });
}

function runCloth(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "repurpose" && ctx.instance.contents) {
    return fail(ctx.use.handler, "Empty it first. The cloth is still a sack of something.");
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method} on ${str(ctx.use.params, "cloth")}.`], {
    addTags: [`cloth:${method}`],
    qtyDelta: ctx.item.stack === "batch" ? -1 : 0,
    ...wear(1),
  });
}

function runLock(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "skeleton") {
    return ok(
      ctx.use.handler,
      [ctx.use.line, "A skeleton key tries old wards. It is not a promise, and it opens nothing that is not in this shed."],
      { flags: ["lock:tried"], ...wear(1) },
    );
  }
  if (method === "room" && !hasRule(ctx.item, "inn-property")) {
    return fail(ctx.use.handler, "A room key that nobody owns is just iron. This one is marked to a house.");
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method}, bit ${str(ctx.use.params, "bit")}.`], {
    flags: [`lock:${method}`],
    ...wear(1),
  });
}

function runSupport(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "span" && ctx.instance.tags.includes("in-use-step")) {
    return fail(ctx.use.handler, "It is already a step. Take the weight off before you lay it across a gap.");
  }
  if (method === "step") {
    return ok(ctx.use.handler, [ctx.use.line, `Step for ${str(ctx.use.params, "holds")}.`], {
      addTags: ["in-use-step"],
      ...wear(2),
    });
  }
  if (method === "span") {
    return ok(ctx.use.handler, [ctx.use.line, `Spanned ${str(ctx.use.params, "holds")}. It is a short, honest reach, not a bridge.`], {
      addTags: ["spanned"],
      flags: ["spanned"],
      ...wear(4),
    });
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method} holding ${str(ctx.use.params, "holds")}.`], {
    addTags: [`support:${method}`],
    ...wear(1),
  });
}

function runProtect(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if ((method === "hands" || method === "eyes") && ctx.item.stack === "pair" && ctx.instance.qty < 2) {
    const which = method === "eyes" ? "One lens does not cover a pair of eyes." : "One glove does not protect a pair of hands.";
    return fail(ctx.use.handler, `${which} Find the mate or do not pretend.`);
  }
  if (method === "float" && ctx.instance.condition < 30) {
    return fail(ctx.use.handler, "The cover is rotten. It will drink water instead of holding you up.");
  }
  return ok(ctx.use.handler, [ctx.use.line, `Protects against ${str(ctx.use.params, "against")} by ${method}.`], {
    addTags: [`protect:${method}`],
    ...wear(1),
  });
}

function runTrap(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "mouse" && ctx.instance.tags.includes("sprung")) {
    return fail(ctx.use.handler, "It is already sprung. Reset it before it will catch.");
  }
  if (method === "clamp") {
    return ok(ctx.use.handler, [ctx.use.line, "The spring arm holds a small glue-up. It is a bad trap while it does this."], {
      addTags: ["clamping"],
      ...wear(1),
    });
  }
  return ok(ctx.use.handler, [ctx.use.line, `Set for ${str(ctx.use.params, "quarry")}.`], {
    addTags: ["set"],
    flags: ["trap:set"],
    ...wear(1),
  });
}

function runSmoke(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "frost" && ctx.state.weather !== "frost" && ctx.state.weather !== "calm") {
    return ok(
      ctx.use.handler,
      [ctx.use.line, `The pot will light, but ${weatherName(ctx.state.weather)} is not a frost night. You would only smoke the shed.`],
      { flags: ["smoke:wasted"], ...wear(2) },
    );
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method} for ${str(ctx.use.params, "purpose")}.`], {
    addTags: [`smoke:${method}`],
    flags: [`smoke:${method}`],
    ...wear(2),
  });
}

function runPack(ctx: UseContext): HandlerResult {
  const method = str(ctx.use.params, "method");
  if (method === "dated-keep" && hasRule(ctx.item, "do-not-burn")) {
    return ok(
      ctx.use.handler,
      [ctx.use.line, "Undated scraps can pack glass. The dated sheet stays in the bundle."],
      { qtyDelta: ctx.instance.qty > 1 ? -1 : 0, addTags: ["dated-kept"], flags: ["paper:packed"] },
    );
  }
  return ok(ctx.use.handler, [ctx.use.line, `${method}, filling ${str(ctx.use.params, "fills")}.`], {
    targetId: ctx.target?.instanceId,
    targetAddTags: [`packed:${method}`],
    qtyDelta: ctx.item.stack === "unique" ? 0 : -1,
    ...wear(1),
  });
}

export function purposeSignature(item: CatalogItem): string {
  return item.uses
    .map((use) => {
      const keys = SIGNATURE_KEYS[use.handler] ?? [];
      const picked = keys.map((key) => `${key}=${String(use.params[key] ?? "")}`).join(",");
      return `${use.handler}[${picked}]`;
    })
    .sort()
    .join(" || ");
}

export function knownHandler(id: string): id is HandlerId {
  return id in SIGNATURE_KEYS;
}
