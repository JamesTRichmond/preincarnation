import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowRightLeft,
  BookOpen,
  Hammer,
  HeartHandshake,
  Lock,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { acceptConfirm, CONTROLS, expectedPhrase } from "../actions.ts";
import { CONTAINERS, defOf } from "../catalog.ts";
import {
  abort,
  begin,
  buyback,
  commit,
  consumeOneSalvage,
  evaluateUndo,
  preview,
  releaseVendor,
  scavengeVoid,
  settle,
  spendMarks,
  stealBiscuits,
  undo,
} from "../engine.ts";
import { formatSummary, formatVerdict, t } from "../i18n.ts";
import { categoryOf, exclusionFor, selectEligible } from "../protections.ts";
import type {
  ActionKind,
  ActionRequest,
  Category,
  ConfirmInput,
  ContainerId,
  ExtendedAction,
  JournalEntry,
  Locale,
  World,
} from "../types.ts";
import { createWorld, instancesIn, occupancy } from "../world.ts";

const STORAGE_KEY = "preincarnation-batch-v1";
let tokenSeq = 0;

const CATEGORIES: Array<Category | "all"> = [
  "all",
  "materials",
  "named",
  "gear",
  "provisions",
  "evidence",
  "reservations",
];

const ACTION_ORDER: ActionKind[] = ["move", "sell", "dismantle", "donate", "discard", "restore"];

function nextToken(action: string, recent: { current: { token: string; at: number; action: string } | null }): string {
  const now = Date.now();
  if (recent.current && recent.current.action === action && now - recent.current.at < 600) {
    return recent.current.token;
  }
  tokenSeq += 1;
  const token = `ui-${now.toString(36)}-${tokenSeq}`;
  recent.current = { token, at: now, action };
  return token;
}

function originText(locale: Locale, inst: World["instances"][string]): string {
  const params = { ...inst.provenance.originParams };
  if (typeof params.name === "string") params.name = t(locale, String(params.name));
  return t(locale, inst.provenance.originKey, params);
}

function saleFor(world: World, instanceId: string): JournalEntry | undefined {
  return [...world.journal].reverse().find((entry) => {
    if (entry.action !== "sell" || entry.reversalOf) return false;
    return entry.lines.some((line) => line.instanceId === instanceId);
  });
}

function chordFrom(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  const keyName = event.key.toLowerCase();
  if (!["shift", "control", "alt", "meta"].includes(keyName)) parts.push(keyName);
  return parts.join("+");
}

function actionForChord(chord: string): ExtendedAction | null {
  const found = (Object.keys(CONTROLS) as ExtendedAction[]).find((kind) => CONTROLS[kind].chord === chord);
  return found ?? null;
}

export function Console({ onClose }: { onClose?: () => void } = {}) {
  const [world, setWorld] = useState<World>(() => createWorld());
  const [locale, setLocale] = useState<Locale>("en");
  const [container, setContainer] = useState<ContainerId>("pack");
  const [category, setCategory] = useState<Category | "all">("all");
  const [armed, setArmed] = useState<ActionKind>("move");
  const [destination, setDestination] = useState<ContainerId>("stash");
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [tray, setTray] = useState<ExtendedAction | null>(null);
  const [buybackId, setBuybackId] = useState<string | null>(null);
  const [phrase, setPhrase] = useState("");
  const [mode, setMode] = useState<"pointer" | "keyboard" | "controller" | "touch">("pointer");
  const [notice, setNotice] = useState("");
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [dropNext, setDropNext] = useState(false);
  const [lockedRevision, setLockedRevision] = useState<number | null>(null);
  const openedAt = useRef(0);
  const recentToken = useRef<{ token: string; at: number; action: string } | null>(null);
  const lastRequest = useRef<ActionRequest | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as World;
      if (parsed.schema === 1 && parsed.instances) setWorld(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
  }, [world]);

  const items = useMemo(() => {
    return instancesIn(world, container).filter((inst) => category === "all" || categoryOf(inst) === category);
  }, [world, container, category]);

  const occ = useMemo(() => occupancy(world), [world]);

  const lines = useMemo(
    () => Object.entries(selection).map(([instanceId, quantity]) => ({ instanceId, quantity })),
    [selection],
  );

  const destArg = armed === "move" || armed === "restore" ? destination : undefined;
  const view = useMemo(
    () =>
      preview(world, {
        action: tray && tray !== "buyback" ? tray : armed,
        lines,
        destinationId:
          tray === "move" || tray === "restore" || (!tray && (armed === "move" || armed === "restore"))
            ? destination
            : undefined,
        token: "preview",
        locale,
        expectedRevision: world.revision,
      }),
    [world, lines, armed, tray, destination, locale],
  );

  const flight = Object.keys(world.inflight)[0] ?? null;
  const stale = tray !== null && lockedRevision !== null && lockedRevision !== world.revision;
  const focused = lines.length === 1 ? world.instances[lines[0]!.instanceId] : undefined;
  const heldBack = useMemo(
    () => items.filter((inst) => exclusionFor(inst, armed, destArg)).length,
    [items, armed, destArg],
  );
  const lotReady = lines.length > 0 && view.ok && !stale;

  function note(text: string) {
    setNotice(text);
    setMistakes((prev) => [text, ...prev].slice(0, 6));
  }

  function openTray(action: ExtendedAction, journalId?: string) {
    setTray(action);
    setPhrase("");
    setBuybackId(journalId ?? null);
    setLockedRevision(world.revision);
    openedAt.current = performance.now();
    setNotice("");
    if (action !== "buyback") setArmed(action);
  }

  function closeTray() {
    setTray(null);
    setBuybackId(null);
  }

  function applyWorld(next: World, text: string, clear: boolean) {
    setWorld(next);
    setNotice(text);
    if (clear) {
      setSelection({});
      closeTray();
    }
  }

  function issue(action: ActionKind, confirm: ConfirmInput) {
    const request: ActionRequest = {
      action,
      lines,
      destinationId: action === "move" || action === "restore" ? destination : undefined,
      token: nextToken(action, recentToken),
      locale,
      expectedRevision: tray === action && lockedRevision !== null ? lockedRevision : world.revision,
      phrase,
      confirm,
    };
    lastRequest.current = request;
    if (dropNext) {
      const pending = begin(world, request);
      setDropNext(false);
      const text =
        pending.receipt.status === "pending"
          ? t(locale, "ui.inflight")
          : t(locale, `reject.${pending.receipt.reason ?? "missing-confirm"}`);
      applyWorld(pending.world, text, false);
      return;
    }
    const result = commit(world, request);
    const text =
      result.receipt.status === "duplicate"
        ? t(locale, "ui.duplicate")
        : result.receipt.status === "applied"
          ? formatSummary(locale, result.receipt.summaryKey, result.receipt.summaryParams)
          : t(locale, `reject.${result.receipt.reason ?? "missing-confirm"}`);
    applyWorld(result.world, text, result.receipt.status === "applied");
    if (result.receipt.status !== "applied" && result.receipt.status !== "duplicate") {
      setMistakes((prev) => [text, ...prev].slice(0, 6));
    }
  }

  function runBuyback(confirm: ConfirmInput) {
    if (!buybackId) return;
    const result = buyback(world, {
      journalId: buybackId,
      token: nextToken("buyback", recentToken),
      locale,
      expectedRevision: lockedRevision ?? world.revision,
      confirm,
    });
    const verdict = result.verdict ? formatVerdict(locale, result.verdict) : "";
    const text =
      result.receipt.status === "duplicate"
        ? t(locale, "ui.duplicate")
        : result.receipt.status === "applied"
          ? formatSummary(locale, result.receipt.summaryKey, result.receipt.summaryParams)
          : verdict || t(locale, `reject.${result.receipt.reason ?? "buyback-unavailable"}`);
    applyWorld(result.world, text, result.receipt.status === "applied");
  }

  function onAlternate(kind: ExtendedAction, confirm: ConfirmInput) {
    if (tray && tray !== kind) {
      const verdict = acceptConfirm(tray, confirm, locale, phrase);
      note(t(locale, `reject.${verdict.reason}`));
      return;
    }
    if (tray === kind) {
      if (confirm.channel !== "pointer" && performance.now() - openedAt.current < 400) {
        note(t(locale, "ui.too-soon"));
        return;
      }
      if (kind === "buyback") runBuyback(confirm);
      else issue(kind, confirm);
      return;
    }
    if (kind === "move") issue("move", confirm);
    else if (kind === "buyback") note(t(locale, "reject.not-buyback"));
    else openTray(kind);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) {
        if (event.key === "Escape" && tray) closeTray();
        return;
      }
      if (event.repeat) return;
      if (event.key === "Escape") {
        if (tray) {
          closeTray();
          note(t(locale, "reject.cancel-is-never-confirm"));
        } else {
          setSelection({});
        }
        return;
      }
      const chord = chordFrom(event);
      const kind = actionForChord(chord);
      if (!kind && (chord === "enter" || chord === " ")) {
        if (tray) note(t(locale, "reject.shared-confirm-rejected"));
        event.preventDefault();
        return;
      }
      if (!kind) return;
      event.preventDefault();
      onAlternate(kind, { channel: "key", chord });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function chooseContainer(next: ContainerId) {
    setContainer(next);
    setSelection({});
    if (next === "void") setArmed("restore");
    if (next === "stash" && destination === "stash") setDestination("pack");
    if (next === "pack" && destination === "pack") setDestination("stash");
  }

  function toggle(id: string) {
    const inst = world.instances[id];
    if (!inst) return;
    if (exclusionFor(inst, armed, destArg)) return;
    setSelection((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = inst.quantity;
      return next;
    });
  }

  function setQty(id: string, quantity: number) {
    const inst = world.instances[id];
    if (!inst) return;
    const max = inst.quantity;
    const nextQty = Math.max(1, Math.min(max, quantity));
    setSelection((prev) => ({ ...prev, [id]: nextQty }));
  }

  function takeEligible() {
    const picked = selectEligible(world, container, armed, category, destArg);
    const next: Record<string, number> = {};
    for (const line of picked.lines) next[line.instanceId] = line.quantity;
    setSelection(next);
  }

  function disturb(kind: "steal" | "spend" | "consume" | "scavenge" | "release") {
    const next =
      kind === "steal"
        ? stealBiscuits(world)
        : kind === "spend"
          ? spendMarks(world)
          : kind === "consume"
            ? consumeOneSalvage(world)
            : kind === "scavenge"
              ? scavengeVoid(world)
              : releaseVendor(world);
    if (next === world) {
      setNotice(t(locale, "summary.rejected"));
      return;
    }
    setWorld(next);
    setNotice(t(locale, next.notes.at(-1)?.key ?? "summary.rejected", next.notes.at(-1)?.params));
  }

  function undoLatest() {
    const entry = world.journal.at(-1);
    if (!entry) return;
    const report = evaluateUndo(world, entry.id);
    if (!report.available) {
      setNotice(formatVerdict(locale, report));
      return;
    }
    const result = undo(world, entry.id, nextToken("undo", recentToken));
    const text = result.verdict ? formatVerdict(locale, result.verdict) : t(locale, "reason.available");
    applyWorld(result.world, result.receipt.status === "applied" ? formatSummary(locale, result.receipt.summaryKey, result.receipt.summaryParams) : text, result.receipt.status === "applied");
  }

  function replay() {
    const request = lastRequest.current;
    if (!request) return;
    const result = commit(world, { ...request, expectedRevision: world.revision });
    const text = result.receipt.status === "duplicate" ? t(locale, "ui.duplicate") : t(locale, `reject.${result.receipt.reason ?? "missing-confirm"}`);
    applyWorld(result.world, text, false);
  }

  function reset() {
    const fresh = createWorld();
    setWorld(fresh);
    setSelection({});
    closeTray();
    setNotice("");
    setMistakes([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const latest = world.journal.at(-1);
  const latestVerdict = latest ? evaluateUndo(world, latest.id) : null;

  return (
    <main lang={locale} className="ledger-main min-h-screen overflow-x-clip bg-background text-foreground">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-5">
          <div className="max-w-xl">
            <p className="text-xs font-medium tracking-widest text-muted uppercase">{t(locale, "app.kicker")}</p>
            <h1 className="font-display text-4xl leading-none font-medium tracking-tight">{t(locale, "app.title")}</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{t(locale, "ui.arm-first")}</p>
          </div>
          <div className="flex flex-wrap items-stretch gap-2">
            {onClose && (
              <button type="button" data-testid="close-ledger" className="min-h-11 rounded-md border border-line px-3 text-sm" onClick={onClose}>
                Back to the field
              </button>
            )}
            <Stat label={t(locale, "app.marks")} value={world.currency.gold} />
            <Stat label={t(locale, "app.chapter")} value={world.currency.reputation} />
            <Stat label={t(locale, "app.revision")} value={world.revision} />
            <div className="flex rounded-lg bg-inset p-1">
              {(["en", "fr"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  data-testid={`locale-${code}`}
                  className={
                    "min-h-11 rounded-md px-3 text-sm font-medium " +
                    (locale === code ? "bg-accent text-accent-ink" : "text-muted")
                  }
                  onClick={() => setLocale(code)}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[14rem_minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex max-w-full gap-2 overflow-x-auto lg:flex-col">
            {CONTAINERS.map((id) => {
              const used = occ[id];
              const cap = world.capacity[id];
              const active = container === id;
              const ratio = cap === 0 ? 0 : Math.min(1, used / cap);
              return (
                <button
                  key={id}
                  type="button"
                  data-testid={`container-${id}`}
                  onClick={() => chooseContainer(id)}
                  className={
                    "flex min-h-14 w-36 shrink-0 flex-col justify-center gap-2 rounded-lg border px-3 py-2 text-left text-sm lg:w-auto " +
                    (active ? "border-accent bg-inset text-foreground" : "border-line bg-surface text-foreground")
                  }
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span>{t(locale, `container.${id}`)}</span>
                    <span className="font-mono text-xs tabular-nums text-muted">
                      {used}/{cap}
                    </span>
                  </span>
                  <span className="occ-track" aria-hidden="true">
                    <span className="occ-fill" style={{ width: `${ratio * 100}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium tracking-widest text-muted uppercase">{t(locale, "ui.filter")}</p>
            <div className="flex gap-2 overflow-x-auto">
              {CATEGORIES.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setCategory(id);
                    setSelection({});
                  }}
                  className={
                    "min-h-11 shrink-0 rounded-full border px-3 text-sm " +
                    (category === id ? "border-accent bg-inset text-foreground" : "border-line text-muted")
                  }
                >
                  {t(locale, `category.${id}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button type="button" data-testid="select-eligible" className="min-h-11 rounded-md bg-inset px-3 text-sm" onClick={takeEligible}>
              {t(locale, "ui.select-eligible")}
            </button>
            <button type="button" className="min-h-11 rounded-md px-3 text-sm text-muted" onClick={() => setSelection({})}>
              {t(locale, "ui.clear")}
            </button>
            {(armed === "move" || armed === "restore") && (
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <span className="text-muted">{t(locale, "ui.destination")}</span>
                <select
                  className="h-11 rounded-md border border-line bg-inset px-2"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value as ContainerId)}
                >
                  {(armed === "restore" ? (["pack", "stash", "quest-satchel"] as const) : (["pack", "stash", "equipped", "quest-satchel"] as const)).map((id) => (
                    <option key={id} value={id}>
                      {t(locale, `container.${id}`)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {heldBack > 0 && (
              <span className="text-sm text-danger">{t(locale, "ui.excluded-count", { count: heldBack })}</span>
            )}
          </div>

          <section className="mb-3 rounded-lg border border-line bg-surface p-4" aria-live="polite">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium tracking-widest text-muted uppercase">{t(locale, "ui.live")}</p>
              <p className="font-mono text-xs text-muted">{t(locale, "ui.picked", { count: lines.length })}</p>
            </div>
            {lines.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{t(locale, "ui.none-selected")}</p>
            ) : view.ok ? (
              <>
                <p className="mt-2 text-lg leading-snug font-medium">{formatSummary(locale, view.summaryKey, view.summaryParams)}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{formatSummary(locale, view.outlookKey, view.summaryParams)}</p>
                <Delta locale={locale} gold={view.currencyDelta.gold} rep={view.currencyDelta.reputation} />
              </>
            ) : (
              <div className="mt-2 space-y-2 text-sm">
                {view.errors.map((error) => (
                  <p key={error}>{t(locale, `reject.${error}`)}</p>
                ))}
                {view.exclusions.map((item) => (
                  <p key={item.instanceId} className="text-danger">
                    {t(locale, defOf(item.defId).nameKey)} — {t(locale, `exclusion.${item.code}`)}
                  </p>
                ))}
              </div>
            )}
            {container === "equipped" && armed === "move" && (
              <p className="mt-2 text-sm text-muted">{t(locale, "ui.equipped-note")}</p>
            )}
            {notice && <p className="mt-3 text-sm">{notice}</p>}
            {flight && <p className="mt-2 text-sm text-ok">{t(locale, "ui.inflight")}</p>}
          </section>

          {items.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface px-4 py-10 text-sm text-muted">{t(locale, "ui.empty")}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((inst) => {
                const def = defOf(inst.defId);
                const code = exclusionFor(inst, armed, destArg);
                const selected = selection[inst.id] !== undefined;
                const sale = container === "vendor" ? saleFor(world, inst.id) : undefined;
                const mark = def.id.slice(0, 2).toUpperCase();
                return (
                  <li
                    key={inst.id}
                    data-testid={`item-${inst.id}`}
                    className={
                      "rounded-lg border bg-surface p-3 " +
                      (selected ? "border-accent" : "border-line") +
                      (code ? " opacity-70" : "")
                    }
                  >
                    <label className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 size-5"
                        checked={selected}
                        disabled={Boolean(code)}
                        aria-label={t(locale, def.nameKey)}
                        onChange={() => toggle(inst.id)}
                      />
                      <span className="min-w-0">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-mono text-xs tracking-widest text-subtle">{mark}</span>
                          <span className="font-mono text-sm tabular-nums">
                            {selected ? selection[inst.id] : inst.quantity}
                            {inst.quantity > 1 ? <span className="text-muted"> / {inst.quantity}</span> : null}
                          </span>
                        </span>
                        <span className="mt-1 block font-medium">{t(locale, def.nameKey)}</span>
                        <span className="mt-1 block text-sm text-muted">
                          {t(locale, `kind.${def.kind}`)}
                          {inst.provenance.serial ? <span className="font-mono"> · {inst.provenance.serial}</span> : null}
                        </span>
                        <span className="mt-1 block text-sm text-subtle">{originText(locale, inst)}</span>
                      </span>
                    </label>
                    {code && (
                      <p className="mt-3 flex items-start gap-2 text-sm text-danger">
                        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span>{t(locale, `exclusion.${code}`)}</span>
                      </p>
                    )}
                    {selected && def.partial && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-muted">{t(locale, "ui.partial")}</span>
                        <button type="button" className="size-11 rounded-md border border-line bg-inset" onClick={() => setQty(inst.id, (selection[inst.id] ?? 1) - 1)} aria-label="-">
                          −
                        </button>
                        <span className="w-8 text-center font-mono tabular-nums">{selection[inst.id]}</span>
                        <button type="button" className="size-11 rounded-md border border-line bg-inset" onClick={() => setQty(inst.id, (selection[inst.id] ?? 1) + 1)} aria-label="+">
                          +
                        </button>
                      </div>
                    )}
                    {sale && (
                      <button
                        type="button"
                        className="mt-3 min-h-11 w-full rounded-lg border border-line px-3 text-sm"
                        onClick={() => openTray("buyback", sale.id)}
                      >
                        {t(locale, "verb.buyback")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="font-display text-2xl leading-none">{t(locale, "ui.identity")}</h2>
            {focused ? (
              <div className="mt-3 text-sm">
                <p className="font-medium">{t(locale, defOf(focused.defId).nameKey)}</p>
                <p className="mt-1 font-mono text-xs text-muted">{focused.id}</p>
                {focused.containerId && (
                  <p className="mt-2">
                    <span className="text-muted">{t(locale, "ui.where")}</span> {t(locale, `container.${focused.containerId}`)}
                  </p>
                )}
                {focused.provenance.serial && (
                  <p className="mt-1">
                    <span className="text-muted">{t(locale, "ui.serial")}</span> {focused.provenance.serial}
                  </p>
                )}
                <p className="mt-1 text-muted">{originText(locale, focused)}</p>
                {focused.questId && <p className="mt-2 font-mono text-xs text-muted">{focused.questId}</p>}
                {focused.reservationId && <p className="mt-1 text-xs text-danger">{t(locale, "ui.protected")}</p>}
                <p className="mt-3 text-xs tracking-widest text-muted uppercase">{t(locale, "ui.chain")}</p>
                <ul className="mt-1 space-y-1">
                  {focused.provenance.chain.length === 0 && <li className="text-muted">—</li>}
                  {focused.provenance.chain.map((event, index) => (
                    <li key={`${event.kind}-${index}`}>{t(locale, event.detailKey)}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">{t(locale, "ui.none-selected")}</p>
            )}
          </section>

          <section className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl leading-none">{t(locale, "ui.undo")}</h2>
              <button
                type="button"
                data-testid="undo-latest"
                className={
                  "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium " +
                  (latestVerdict?.available
                    ? "bg-accent text-accent-ink"
                    : "border border-line bg-inset text-muted")
                }
                onClick={undoLatest}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {latestVerdict?.available ? t(locale, "ui.undo") : t(locale, "ui.undo-unavailable")}
              </button>
            </div>
            <p className="mt-3 text-sm">{latestVerdict ? formatVerdict(locale, latestVerdict) : t(locale, "ui.none-selected")}</p>
            {latestVerdict?.buyback && <p className="mt-2 text-sm text-muted">{formatVerdict(locale, latestVerdict.buyback)}</p>}
          </section>

          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="flex items-center gap-2 font-display text-2xl leading-none">
              <BookOpen className="size-5" aria-hidden="true" />
              {t(locale, "ui.journal")}
            </h2>
            <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto">
              {world.journal.length === 0 && <li className="text-sm text-muted">{t(locale, "ui.none-selected")}</li>}
              {[...world.journal].reverse().map((entry) => {
                const report = evaluateUndo(world, entry.id);
                return (
                  <li key={entry.id} className="border-t border-line pt-3 text-sm">
                    <p className="font-mono text-xs tracking-wide text-subtle uppercase">
                      {t(locale, `action.${entry.action}`)}
                      {entry.reversedBy ? " · " + t(locale, "event.undo") : ""}
                    </p>
                    <p className="mt-1">{formatSummary(locale, entry.summaryKey, entry.summaryParams)}</p>
                    <p className="mt-1 font-mono text-xs text-muted">{entry.id}</p>
                    {(entry.currencyDelta.gold !== 0 || entry.currencyDelta.reputation !== 0) && (
                      <Delta locale={locale} gold={entry.currencyDelta.gold} rep={entry.currencyDelta.reputation} />
                    )}
                    <p className="mt-1 text-muted">{formatVerdict(locale, report)}</p>
                    {report.buyback && <p className="mt-1 text-muted">{formatVerdict(locale, report.buyback)}</p>}
                    {entry.action === "sell" && report.buyback?.available && (
                      <button type="button" className="mt-2 min-h-11 rounded-md border border-line px-3" onClick={() => openTray("buyback", entry.id)}>
                        {t(locale, "verb.buyback")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <details className="rounded-lg border border-line bg-surface p-4">
            <summary className="text-sm font-medium">{t(locale, "ui.field")}</summary>
            <div className="mt-3 flex flex-col gap-2">
              <FieldButton label={t(locale, "ui.steal")} onClick={() => disturb("steal")} />
              <FieldButton label={t(locale, "ui.spend")} onClick={() => disturb("spend")} />
              <FieldButton label={t(locale, "ui.consume")} onClick={() => disturb("consume")} />
              <FieldButton label={t(locale, "ui.scavenge")} onClick={() => disturb("scavenge")} />
              <FieldButton label={t(locale, "ui.release")} onClick={() => disturb("release")} />
              <FieldButton label={t(locale, "ui.drop")} onClick={() => setDropNext(true)} />
              <FieldButton label={t(locale, "ui.replay")} onClick={replay} />
              {flight && (
                <>
                  <FieldButton
                    label={t(locale, "ui.settle")}
                    onClick={() => {
                      const result = settle(world, flight);
                      applyWorld(
                        result.world,
                        result.receipt.status === "applied"
                          ? formatSummary(locale, result.receipt.summaryKey, result.receipt.summaryParams)
                          : t(locale, `reject.${result.receipt.reason ?? "no-such-entry"}`),
                        result.receipt.status === "applied",
                      );
                    }}
                  />
                  <FieldButton
                    label={t(locale, "ui.abort")}
                    onClick={() => {
                      const result = abort(world, flight);
                      applyWorld(result.world, t(locale, "note.abort"), false);
                    }}
                  />
                </>
              )}
              <FieldButton label={t(locale, "ui.reset")} onClick={reset} />
              <label className="mt-2 flex flex-col gap-1 text-sm">
                <span className="text-muted">{t(locale, "ui.input")}</span>
                <select className="h-11 rounded-md border border-line bg-inset px-2" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
                  <option value="pointer">{t(locale, "ui.pointer")}</option>
                  <option value="keyboard">{t(locale, "ui.keyboard")}</option>
                  <option value="controller">{t(locale, "ui.controller")}</option>
                  <option value="touch">{t(locale, "ui.touch")}</option>
                </select>
              </label>
              {mode !== "pointer" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(Object.keys(CONTROLS) as ExtendedAction[]).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      className="min-h-11 rounded-md border border-line px-2 text-left text-xs"
                      onClick={() =>
                        onAlternate(
                          kind,
                          mode === "keyboard"
                            ? { channel: "key", chord: CONTROLS[kind].chord }
                            : mode === "controller"
                              ? { channel: "controller", button: CONTROLS[kind].controller, holdMs: CONTROLS[kind].holdMs }
                              : { channel: "touch", gesture: CONTROLS[kind].touch, holdMs: CONTROLS[kind].holdMs },
                        )
                      }
                    >
                      {t(locale, `action.${kind}`)}
                      <span className="mt-1 block text-muted">
                        {mode === "keyboard" ? t(locale, `chord.${kind}`) : mode === "controller" ? t(locale, `pad.${kind}`) : t(locale, `touch.${kind}`)}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="min-h-11 rounded-md border border-line px-2 text-left text-xs"
                    onClick={() => note(t(locale, "reject.shared-confirm-rejected"))}
                  >
                    {t(locale, "reject.shared-confirm-rejected")}
                  </button>
                </div>
              )}
            </div>
          </details>

          <section className="rounded-lg border border-line p-4">
            <h2 className="text-xs font-medium tracking-widest text-muted uppercase">{t(locale, "ui.mistakes")}</h2>
            {mistakes.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{t(locale, "ui.no-mistakes")}</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {mistakes.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <div className="action-dock fixed inset-x-0 bottom-0 z-20 border-t border-line bg-background">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-3 px-4 pt-2">
          <p className="font-mono text-xs text-muted">{t(locale, "ui.picked", { count: lines.length })}</p>
          <p className={"text-xs " + (lines.length === 0 ? "text-muted" : lotReady ? "text-ok" : "text-danger")}>
            {lines.length === 0
              ? armed === "move"
                ? t(locale, "hint.move")
                : t(locale, "ui.open-review")
              : lotReady
                ? t(locale, "ui.ready")
                : t(locale, "ui.blocked")}
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-4 py-2 sm:grid-cols-6">
          {ACTION_ORDER.map((kind) => {
            const Icon = ICONS[kind];
            const active = armed === kind;
            return (
              <button
                key={kind}
                type="button"
                data-testid={`action-${kind}`}
                onClick={() => {
                  setArmed(kind);
                  if (kind !== "move") {
                    openTray(kind);
                    return;
                  }
                  if (lines.length === 0) {
                    setNotice(t(locale, "reject.empty-selection"));
                    return;
                  }
                  issue("move", { channel: "pointer", controlId: "commit-move" });
                }}
                className={
                  "flex min-h-11 min-w-0 flex-col items-start justify-center rounded-lg border px-2 py-2 text-left text-sm " +
                  (active ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface")
                }
              >
                <Icon className="mb-1 size-4" aria-hidden="true" />
                {t(locale, `action.${kind}`)}
                <span className={"text-xs " + (active ? "text-accent-ink" : "text-muted")}>{t(locale, `chord.${kind}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tray && (
        <div className="fixed inset-0 z-30 flex justify-end bg-background/80" onClick={closeTray}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tray-title"
            className="tray-panel h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-widest text-muted uppercase">{t(locale, "ui.review")}</p>
                <h2 id="tray-title" className="mt-1 font-display text-4xl leading-none">
                  {t(locale, `verb.${tray}`)}
                </h2>
                <p className="mt-2 text-sm text-muted">{t(locale, `hint.${tray}`)}</p>
              </div>
              <button type="button" className="min-h-11 rounded-md px-3 text-sm text-muted" onClick={closeTray}>
                {t(locale, "ui.close")}
              </button>
            </div>

            {stale && <p className="mt-4 rounded-md border border-danger px-3 py-3 text-sm text-danger">{t(locale, "reject.inventory-changed")}</p>}

            {tray === "buyback" && buybackId ? (
              <BuybackBody world={world} locale={locale} journalId={buybackId} onConfirm={(confirm) => runBuyback(confirm)} />
            ) : (
              <ReviewBody
                locale={locale}
                action={tray === "buyback" ? "sell" : tray}
                viewOk={view.ok}
                summary={lines.length ? formatSummary(locale, view.summaryKey, view.summaryParams) : t(locale, "ui.none-selected")}
                outlook={lines.length ? formatSummary(locale, view.outlookKey, view.summaryParams) : ""}
                lines={view.lines}
                outputs={view.outputs}
                exclusions={view.exclusions}
                gold={view.currencyDelta.gold}
                rep={view.currencyDelta.reputation}
                phrase={phrase}
                onPhrase={setPhrase}
                onConfirm={(confirm) => issue(tray as ActionKind, confirm)}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

const ICONS: Record<ActionKind, typeof ArrowRightLeft> = {
  move: ArrowRightLeft,
  sell: Receipt,
  dismantle: Hammer,
  donate: HeartHandshake,
  discard: Archive,
  restore: ArchiveRestore,
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-lg bg-inset px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-mono text-lg tabular-nums">{value}</p>
    </div>
  );
}

function FieldButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="min-h-11 rounded-md border border-line px-3 text-left text-sm" onClick={onClick}>
      {label}
    </button>
  );
}

function ReviewBody({
  locale,
  action,
  summary,
  outlook,
  lines,
  outputs,
  exclusions,
  gold,
  rep,
  phrase,
  onPhrase,
  onConfirm,
}: {
  locale: Locale;
  action: ActionKind;
  viewOk: boolean;
  summary: string;
  outlook: string;
  lines: Array<{
    instanceId: string;
    defId: string;
    serial: string | null;
    quantity: number;
    from: string | null;
    to: string | null;
  }>;
  outputs: Array<{ defId: string; quantity: number }>;
  exclusions: Array<{ instanceId: string; defId: string; code: string }>;
  gold: number;
  rep: number;
  phrase: string;
  onPhrase: (value: string) => void;
  onConfirm: (confirm: ConfirmInput) => void;
}) {
  const control = CONTROLS[action];
  const phraseWord = expectedPhrase(locale, action);
  return (
    <div className="mt-6">
      <p className="text-lg">{summary}</p>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {lines.map((line) => (
          <li key={line.instanceId} className="flex items-baseline justify-between gap-3 py-3 text-sm">
            <span>
              {t(locale, defOf(line.defId).nameKey)}
              {line.serial && <span className="ml-2 font-mono text-xs text-muted">{line.serial}</span>}
              {(line.from || line.to) && (
                <span className="mt-1 block font-mono text-xs text-subtle">
                  {line.from ? t(locale, `container.${line.from}`) : "—"}
                  {" → "}
                  {line.to ? t(locale, `container.${line.to}`) : "—"}
                </span>
              )}
            </span>
            <span className="font-mono tabular-nums">{line.quantity}</span>
          </li>
        ))}
      </ul>
      {exclusions.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm text-danger">
          {exclusions.map((item) => (
            <li key={item.instanceId}>
              {t(locale, defOf(item.defId).nameKey)} — {t(locale, `exclusion.${item.code}`)}
            </li>
          ))}
        </ul>
      )}
      {outputs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs tracking-widest text-muted uppercase">{t(locale, "ui.outputs")}</p>
          <ul className="mt-2 text-sm">
            {outputs.map((output) => (
              <li key={output.defId} className="flex justify-between py-1">
                <span>{t(locale, defOf(output.defId).nameKey)}</span>
                <span className="font-mono tabular-nums">{output.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Delta locale={locale} gold={gold} rep={rep} />
      {outlook && <p className="mt-4 text-sm text-muted">{outlook}</p>}
      {action === "discard" && <p className="mt-3 text-sm text-danger">{t(locale, "ui.same-pieces")}</p>}
      {action === "restore" && <p className="mt-3 text-sm">{t(locale, "ui.same-pieces")}</p>}
      {phraseWord && (
        <label className="mt-5 block text-sm">
          <span className="text-muted">{t(locale, "ui.phrase")}</span>
          <span className="ml-2 font-mono">{phraseWord}</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-line bg-inset px-3"
            value={phrase}
            onChange={(event) => onPhrase(event.target.value)}
            autoComplete="off"
          />
        </label>
      )}
      {control.holdMs > 0 ? (
        <HoldButton
          label={t(locale, "ui.hold")}
          holding={t(locale, "ui.holding")}
          ms={control.holdMs}
          onRelease={(ms) => onConfirm({ channel: "pointer", controlId: control.pointerId, holdMs: ms })}
        />
      ) : (
        <button
          type="button"
          data-testid={`commit-${action}`}
          className="mt-5 min-h-12 w-full rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink"
          onClick={() => onConfirm({ channel: "pointer", controlId: control.pointerId })}
        >
          {t(locale, `verb.${action}`)}
          <span className="ml-2 font-mono text-xs">{t(locale, `chord.${action}`)}</span>
        </button>
      )}
    </div>
  );
}

function BuybackBody({
  world,
  locale,
  journalId,
  onConfirm,
}: {
  world: World;
  locale: Locale;
  journalId: string;
  onConfirm: (confirm: ConfirmInput) => void;
}) {
  const entry = world.journal.find((item) => item.id === journalId);
  const report = evaluateUndo(world, journalId);
  if (!entry) return null;
  return (
    <div className="mt-6">
      <p className="text-lg">{formatSummary(locale, entry.summaryKey, entry.summaryParams)}</p>
      <p className="mt-3 text-sm">{report.buyback ? formatVerdict(locale, report.buyback) : formatVerdict(locale, report)}</p>
      <p className="mt-3 text-sm text-muted">{t(locale, "ui.buyback-note")}</p>
      <button
        type="button"
        data-testid="commit-buyback"
        className="mt-5 min-h-12 w-full rounded-lg border border-line bg-inset px-4 text-sm font-medium"
        onClick={() => onConfirm({ channel: "pointer", controlId: "commit-buyback" })}
      >
        {t(locale, "verb.buyback")}
        <span className="ml-2 font-mono text-xs">{t(locale, "chord.buyback")}</span>
      </button>
    </div>
  );
}

function HoldButton({ label, holding, ms, onRelease }: { label: string; holding: string; ms: number; onRelease: (held: number) => void }) {
  const start = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const [down, setDown] = useState(false);
  const [ratio, setRatio] = useState(0);

  function stop(commit: boolean) {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const held = start.current === null ? 0 : performance.now() - start.current;
    start.current = null;
    setDown(false);
    setRatio(0);
    if (commit) onRelease(Math.round(held));
  }

  function tick() {
    if (start.current === null) return;
    setRatio(Math.min(1, (performance.now() - start.current) / ms));
    frame.current = requestAnimationFrame(tick);
  }

  return (
    <button
      type="button"
      className="relative mt-5 min-h-12 w-full overflow-hidden rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        start.current = performance.now();
        setDown(true);
        setRatio(0);
        frame.current = requestAnimationFrame(tick);
      }}
      onPointerUp={() => stop(true)}
      onPointerCancel={() => stop(false)}
    >
      <span className="hold-fill" style={{ transform: `scaleX(${ratio})` }} aria-hidden="true" />
      <span className="relative">
        {down ? holding : label}
        <span className="ml-2 font-mono text-xs">{ms}ms</span>
      </span>
    </button>
  );
}

function Delta({ locale, gold, rep }: { locale: Locale; gold: number; rep: number }) {
  if (gold === 0 && rep === 0) return null;
  return (
    <p className="mt-3 font-mono text-sm tabular-nums">
      {gold !== 0 && (
        <span>
          {gold > 0 ? "+" : ""}
          {gold} {t(locale, "app.marks")}
        </span>
      )}
      {rep !== 0 && (
        <span className="ml-4">
          {rep > 0 ? "+" : ""}
          {rep} {t(locale, "app.chapter")}
        </span>
      )}
    </p>
  );
}
