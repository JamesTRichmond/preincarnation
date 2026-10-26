import { useEffect, useMemo, useRef, useState } from "react";
import "./yard.css";
import { Glyph } from "./Glyph.tsx";
import { paint, type SceneId } from "./paint.ts";
import { COACH, factLabel, factValue, sceneNotes } from "./speak.ts";
import {
  CATALOG,
  MATRIX_TAGS,
  PRESETS,
  SAMPLE_FORMS,
  SURVEY,
  TOOL_IDS,
  applyPreset,
  compatibilityMatrix,
  equippedIds,
  equip,
  getItem,
  lootId,
  migrate,
  modify,
  moveBy,
  onDeath,
  restoreMod,
  restoreStow,
  revive,
  runBeat,
  serialize,
  setForm,
  setKey,
  setTool,
  unequip,
} from "../src/index.ts";
import type { Action, BodySlot, Category, Facts, Session, ToolId } from "../src/types.ts";

const SLOTS: { id: BodySlot; label: string }[] = [
  { id: "mainHand", label: "Main hand" },
  { id: "head", label: "Head" },
  { id: "torso", label: "Torso" },
  { id: "waist", label: "Waist" },
  { id: "hands", label: "Hands" },
  { id: "feet", label: "Feet" },
  { id: "cloak", label: "Cloak" },
  { id: "trinket", label: "Trinket" },
  { id: "utility", label: "Utility" },
];

const SCENES: { id: SceneId; label: string }[] = [
  { id: "counter", label: "Counter" },
  { id: "coat", label: "Coat" },
  { id: "crate", label: "Crate" },
  { id: "charm", label: "Charm" },
  { id: "net", label: "Net" },
  { id: "gates", label: "Gates" },
];

const REASONS: Record<string, string> = {
  "already-equipped": "That piece is already worn.",
  "not-owned": "That piece is not in the pack.",
  "off-hand-reserved": "The off-hand is reserved for the pry. A two-handed weapon will not equip.",
  "off-hand-occupied-by-two-hand": "A two-handed weapon is using that hand. Sling it or put it away first.",
  "no-channel": "That modification does not fit this piece.",
  unknown: "That piece is not in this kit.",
};

const CHIP_KEYS: Record<SceneId, string[]> = {
  counter: ["counterConverted", "counterWindowMs", "faultLength", "faultDir", "faultTaped", "homingCut", "slung"],
  coat: ["stored", "storeRefused", "released", "releaseVector", "releaseMode", "rewound", "glazeStick"],
  crate: ["crateResponse", "slideUnits", "grainSource", "knot"],
  charm: ["markLegal", "markReason"],
  net: ["caughtTags", "forkCatches", "forkRefuses", "netMouth"],
  gates: ["doorOpen", "doorReason", "keybell", "seamOpen", "seamReason", "darknessRevealed", "revealMode", "stake"],
};

function reasonText(reason: string): string {
  return REASONS[reason] ?? reason;
}

const YARD_KEY = "kit-yard-v1";

function readYard(): { session: Session; scene: SceneId; counterMs: number; seam: "square" | "slanted" } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(YARD_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { session?: unknown; scene?: string; counterMs?: number; seam?: string };
    const scene = SCENES.some((entry) => entry.id === data.scene) ? (data.scene as SceneId) : "counter";
    const counterMs = typeof data.counterMs === "number" ? Math.max(0, Math.min(180, data.counterMs)) : 40;
    const seam = data.seam === "slanted" ? "slanted" : "square";
    return { session: migrate(data.session), scene, counterMs, seam };
  } catch {
    return null;
  }
}

function actionsFor(scene: SceneId, counterMs: number, seam: "square" | "slanted"): Action[] {
  if (scene === "counter") return [{ kind: "counter", counterMs, facing: "N", useCharge: true }];
  if (scene === "coat") return [{ kind: "block", projectileTag: "bolt" }];
  if (scene === "crate") return [{ kind: "shove", useCharge: true }];
  if (scene === "charm") return [{ kind: "mark", inCombat: true, hitstun: false }];
  if (scene === "net") return [{ kind: "net" }];
  return [
    { kind: "door" },
    { kind: "wedge", seam },
    { kind: "dark" },
    { kind: "stake" },
  ];
}

function toolLabel(id: ToolId): string {
  return id.replace("tool.", "").replace(".", " ");
}

function clearWorn(session: Session): Session {
  let next = session;
  for (const id of equippedIds(session)) {
    const off = unequip(next, id);
    if (off.ok) next = off.session;
  }
  return next;
}

export function Arena() {
  const [session, setSession] = useState<Session>(() => applyPreset(PRESETS[0].equip));
  const [scene, setScene] = useState<SceneId>("counter");
  const [counterMs, setCounterMs] = useState(40);
  const [seam, setSeam] = useState<"square" | "slanted">("square");
  const [facts, setFacts] = useState<Facts | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [notice, setNotice] = useState("Time a counter. A late one does not hit harder.");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"yard" | "compare" | "matrix">("yard");
  const [matrixScope, setMatrixScope] = useState<"all" | "worn" | "live">("all");
  const [focus, setFocus] = useState(lootId(1));
  const [pinB, setPinB] = useState(lootId(25));
  const [pulse, setPulse] = useState(0);
  const [booted, setBooted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const saved = readYard();
    if (saved) {
      setSession(saved.session);
      setScene(saved.scene);
      setCounterMs(saved.counterMs);
      setSeam(saved.seam);
      const worn = equippedIds(saved.session);
      if (worn[0]) setFocus(worn[0]);
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;
    try {
      window.localStorage.setItem(
        YARD_KEY,
        JSON.stringify({ session: JSON.parse(serialize(session)), scene, counterMs, seam }),
      );
    } catch {
      /* The yard still works if the browser refuses storage. */
    }
  }, [booted, session, scene, counterMs, seam]);

  const windowMs = useMemo(() => {
    const beat = runBeat(session, { kind: "counter", counterMs: 0, facing: "N", useCharge: false });
    return typeof beat.facts.counterWindowMs === "number" ? beat.facts.counterWindowMs : null;
  }, [session]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    const start = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (now: number) => {
      const t = reduced ? 1 : Math.min(1, (now - start) / 720);
      paint(canvas, { scene, facts, session, t, counterMs, windowMs, seam });
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [scene, facts, session, counterMs, pulse, windowMs, seam]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (!q) return true;
      return `${item.name} ${item.purpose} ${item.mastery}`.toLowerCase().includes(q);
    });
  }, [filter, query]);

  const focused = getItem(focus);
  const matrix = useMemo(() => compatibilityMatrix(), []);
  const wornSet = useMemo(() => new Set(equippedIds(session)), [session]);
  const liveIds = useMemo(() => new Set(CATALOG.filter((item) => item.spotlight).map((item) => item.id)), []);
  const verdict = sceneNotes(scene, facts);
  const attached = TOOL_IDS.flatMap((tool) => {
    const id = session.attachments[tool];
    const item = id ? getItem(id) : undefined;
    return item ? [{ tool, item }] : [];
  });
  const reading = useMemo(() => {
    if (!focused) return null;
    const wornNow = equippedIds(session).includes(focused.id);
    const withResult = wornNow ? { ok: true as const, session } : equip(session, focused.id);
    if (!withResult.ok) return { error: reasonText(withResult.reason), wornNow, quiet: false, gained: [] as string[], lost: [] as string[] };
    let bare = session;
    if (wornNow) {
      const off = unequip(session, focused.id);
      if (off.ok) bare = off.session;
    }
    const gained: string[] = [];
    const lost: string[] = [];
    for (const action of actionsFor(scene, counterMs, seam)) {
      const withLines = sceneNotes(scene, runBeat(withResult.session, action).facts);
      const withoutLines = sceneNotes(scene, runBeat(bare, action).facts);
      for (const line of withLines) if (!withoutLines.includes(line) && !gained.includes(line)) gained.push(line);
      for (const line of withoutLines) if (!withLines.includes(line) && !lost.includes(line)) lost.push(line);
    }
    return {
      wornNow,
      quiet: withResult.session.suppressed.includes(focused.id),
      gained: gained.slice(0, 4),
      lost: lost.slice(0, 3),
      error: "",
    };
  }, [focused, session, scene, counterMs, seam]);

  function commit(next: Session, beatFacts: Facts, lines: string[], note?: string) {
    setSession(next);
    setFacts(beatFacts);
    setLog(lines);
    if (note) setNotice(note);
    setPulse((n) => n + 1);
  }

  function act(action: Action, note: string) {
    const beat = runBeat(session, action);
    commit(beat.session, beat.facts, beat.log, note);
  }

  function toggle(id: string) {
    if (equippedIds(session).includes(id)) {
      const off = unequip(session, id);
      if (off.ok) {
        setSession(off.session);
        setNotice(`${getItem(id)?.name ?? "Piece"} set back in the pack.`);
      }
      return;
    }
    const on = equip(session, id);
    if (!on.ok) {
      setNotice(reasonText(on.reason));
      return;
    }
    setSession(on.session);
    setFocus(id);
    setNotice(`${getItem(id)?.name ?? "Piece"} equipped.`);
  }

  function runPreset(index: number) {
    const preset = PRESETS[index];
    setSession(applyPreset(preset.equip));
    setScene(preset.scene);
    setFacts(null);
    setLog([]);
    setNotice(preset.blurb);
    setView("yard");
    setFocus(lootId(preset.equip[0]));
  }

  const compare = useMemo(() => {
    if (view !== "compare") return null;
    const base = runBeat(createLike(session), SURVEY).facts;
    const left = soloFacts(session, focus);
    const right = soloFacts(session, pinB);
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])]
      .filter((key) => left[key] !== right[key] && (left[key] !== base[key] || right[key] !== base[key]))
      .sort()
      .slice(0, 18);
    const leftNotes = sceneNotes(scene, left).filter((line) => !sceneNotes(scene, right).includes(line));
    const rightNotes = sceneNotes(scene, right).filter((line) => !sceneNotes(scene, left).includes(line));
    return { left, right, keys, base, leftNotes, rightNotes };
  }, [view, focus, pinB, session, scene]);

  return (
    <main className="yard">
      <header className="yard-head">
        <p className="eyebrow">Preincarnation</p>
        <h1>Kit Yard</h1>
        <p className="lede">
          Ellis carries one kit across a fourteen-year return. Pick a piece to read what it changes in the open yard, then wear it. The kit stays on this device.
        </p>
      </header>

      <div className="preset-row" role="list">
        {PRESETS.map((preset, index) => (
          <button key={preset.id} type="button" className="preset" onClick={() => runPreset(index)}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="view-row" role="tablist">
        {(
          [
            ["yard", "Yard"],
            ["compare", "Compare"],
            ["matrix", "Compatibility"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} className={view === id ? "tab on" : "tab"} onClick={() => setView(id)}>
            {label}
          </button>
        ))}
      </div>

      {view === "yard" && (
        <div className="yard-layout">
          <section className="panel doll" aria-label="Worn kit">
            <div className="panel-head">
              <h2>Worn</h2>
              <span className={session.alive ? "alive" : "down"}>{session.alive ? "Walking" : "Between lives"}</span>
            </div>
            <ul className="slots">
              {SLOTS.map((slot) => {
                const id = session.slots[slot.id];
                const item = id ? getItem(id) : undefined;
                const quiet = id ? session.suppressed.includes(id) : false;
                return (
                  <li key={slot.id}>
                    <button type="button" className="slot" onClick={() => id && toggle(id)} disabled={!id}>
                      {item ? <Glyph index={item.index} silhouette={item.silhouette} mark={item.mark} label={item.name} /> : <span className="empty-slot" />}
                      <span>
                        <span className="slot-label">{slot.label}</span>
                        <span className="slot-name">{item ? item.name : "Empty"}</span>
                        {item && item.chargeMax != null && (
                          <span className={(session.charges[item.id] ?? 0) > 0 ? "charged" : "spent"}>
                            {(session.charges[item.id] ?? 0) > 0 ? "charged" : "spent"}
                          </span>
                        )}
                        {quiet && <span className="quiet">suppressed by form</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {attached.length > 0 && (
              <div className="attached">
                <p className="slot-label">On tools</p>
                {attached.map(({ tool, item }) => (
                  <button key={item.id} type="button" className="slot" onClick={() => toggle(item.id)}>
                    <Glyph index={item.index} silhouette={item.silhouette} mark={item.mark} label={item.name} />
                    <span>
                      <span className="slot-label">{toolLabel(tool)}</span>
                      <span className="slot-name">{item.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {session.stowMemory.length > 0 && (
              <button type="button" className="ghost wide" onClick={() => setSession(restoreStow(session))}>
                Put stowed gear back
              </button>
            )}
            <div className="row-actions">
              <button type="button" data-testid="die-button" onClick={() => setSession(onDeath(session))} disabled={!session.alive}>
                Die
              </button>
              <button type="button" className="ghost" onClick={() => setSession(revive(session))} disabled={session.alive}>
                Return
              </button>
              <button type="button" className="ghost" onClick={() => setSession(clearWorn(session))} disabled={wornSet.size === 0}>
                Clear
              </button>
            </div>
            <label className="field">
              Form
              <select
                value={session.form.id}
                onChange={(event) => {
                  const form = SAMPLE_FORMS.find((entry) => entry.id === event.target.value) ?? SAMPLE_FORMS[0];
                  setSession(setForm(session, form));
                }}
              >
                {SAMPLE_FORMS.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.id.replace("form.", "").replaceAll("-", " ")}
                    {form.tags.length ? ` · ${form.tags.join(", ")}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="panel stage">
            <div className="scene-row" role="tablist">
              {SCENES.map((entry) => (
                <button key={entry.id} type="button" className={scene === entry.id ? "chip on" : "chip"} onClick={() => setScene(entry.id)}>
                  {entry.label}
                </button>
              ))}
            </div>
            <canvas ref={canvasRef} className="yard-canvas" aria-hidden="true" />
            <p className="coach">{COACH[scene]}</p>
            {verdict.length > 0 && (
              <div className="verdict" role="status">
                {verdict.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}
            <p className="notice">{notice}</p>
            <div className="actions">
              {scene === "counter" && (
                <>
                  <label className="field grow">
                    Timing {counterMs} ms
                    {windowMs != null ? ` · window ${windowMs}` : " · no window worn"}
                    <input type="range" min={0} max={180} value={counterMs} onChange={(event) => setCounterMs(Number(event.target.value))} />
                  </label>
                  <button type="button" data-testid="counter-button" onClick={() => act({ kind: "counter", counterMs, facing: "N", useCharge: true }, "Counter thrown.")}>
                    Counter
                  </button>
                </>
              )}
              {scene === "coat" && (
                <>
                  <button type="button" data-testid="block-button" onClick={() => act({ kind: "block", projectileTag: "bolt" }, "Block.")}>
                    Block a bolt
                  </button>
                  <button type="button" className="ghost" onClick={() => act({ kind: "block", projectileTag: "barbed" }, "Second block.")}>
                    Block another
                  </button>
                  <button type="button" data-testid="release-button" onClick={() => act({ kind: "release", missed: false, useCharge: true }, "Release.")}>
                    Release
                  </button>
                </>
              )}
              {scene === "crate" && (
                <button type="button" data-testid="shove-button" onClick={() => act({ kind: "shove", useCharge: true }, "Shove.")}>
                  Shove the crate
                </button>
              )}
              {scene === "charm" && (
                <>
                  <button type="button" className="ghost" onClick={() => setSession(moveBy(session, -1, 0))}>
                    West
                  </button>
                  <button type="button" className="ghost" onClick={() => setSession(moveBy(session, 1, 0))}>
                    East
                  </button>
                  <button type="button" className="ghost" onClick={() => setSession(moveBy(session, 0, -1))}>
                    North
                  </button>
                  <button type="button" className="ghost" onClick={() => setSession(moveBy(session, 0, 1))}>
                    South
                  </button>
                  <button type="button" data-testid="mark-button" onClick={() => act({ kind: "mark", inCombat: true, hitstun: false }, "Charm consulted in a fight.")}>
                    Mark, in combat
                  </button>
                  <button type="button" className="ghost" onClick={() => act({ kind: "mark", inCombat: false, hitstun: false }, "Charm consulted out of combat.")}>
                    Mark, calm
                  </button>
                </>
              )}
              {scene === "net" && (
                <button type="button" data-testid="net-button" onClick={() => act({ kind: "net" }, "Net cast.")}>
                  Cast the net
                </button>
              )}
              {scene === "gates" && (
                <>
                  <button type="button" data-testid="door-button" onClick={() => act({ kind: "door" }, "The door is tried.")}>
                    Try the door
                  </button>
                  <button type="button" className={seam === "square" ? "chip on" : "chip"} onClick={() => setSeam("square")}>
                    Square seam
                  </button>
                  <button type="button" className={seam === "slanted" ? "chip on" : "chip"} onClick={() => setSeam("slanted")}>
                    Slanted seam
                  </button>
                  <button type="button" data-testid="wedge-button" onClick={() => act({ kind: "wedge", seam }, "Wedge used.")}>
                    Use wedge
                  </button>
                  <button type="button" data-testid="dark-button" onClick={() => act({ kind: "dark" }, "The dark is entered.")}>
                    Enter dark
                  </button>
                  <button type="button" className="ghost" onClick={() => act({ kind: "stake" }, "Stake checked.")}>
                    Plant lantern
                  </button>
                  <button type="button" className="ghost" onClick={() => act({ kind: "dark", removeLantern: true }, "Lantern taken off the stake.")}>
                    Take lantern
                  </button>
                </>
              )}
            </div>
            <fieldset className="conditions">
              <legend>Field</legend>
              <label>
                <input
                  type="checkbox"
                  checked={session.tools["tool.lantern.body"]}
                  onChange={(event) => setSession(setTool(session, "tool.lantern.body", event.target.checked))}
                />
                Lantern tool
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={session.tools["tool.quarry.wedge"]}
                  onChange={(event) => setSession(setTool(session, "tool.quarry.wedge", event.target.checked))}
                />
                Wedge tool
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={session.tools["tool.creek.net"]}
                  onChange={(event) => setSession(setTool(session, "tool.creek.net", event.target.checked))}
                />
                Creek net
              </label>
              <label>
                <input type="checkbox" checked={session.hasKey} onChange={(event) => setSession(setKey(session, event.target.checked))} />
                Key in pocket
              </label>
            </fieldset>
            {facts && (
              <details className="ledger">
                <summary>Ledger</summary>
                <ul className="chips">
                  {CHIP_KEYS[scene]
                    .filter((key) => facts[key] !== undefined)
                    .map((key) => (
                      <li key={key}>
                        {factLabel(key)} {factValue(key, facts[key])}
                      </li>
                    ))}
                </ul>
              </details>
            )}
            <ol className="log" aria-live="polite">
              {log.map((line, index) => (
                <li key={`${index}-${line}`}>{line}</li>
              ))}
            </ol>
          </section>

          <section className="panel bench" aria-label="Equipment bench">
            <div className="panel-head">
              <h2>Bench</h2>
              <span>{shown.length}</span>
            </div>
            <input
              className="search"
              value={query}
              placeholder="Search the kit"
              aria-label="Search the kit"
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="scene-row">
              {(
                [
                  ["all", "All"],
                  ["mainHand", "Weapons"],
                  ["wearable", "Wear"],
                  ["trinket", "Trinkets"],
                  ["toolAttachment", "Attachments"],
                  ["utility", "Utility"],
                ] as const
              ).map(([category, label]) => (
                <button key={category} type="button" className={filter === category ? "chip on" : "chip"} onClick={() => setFilter(category)}>
                  {label}
                </button>
              ))}
            </div>
            {focused && reading && (
              <div className="detail">
                <p className="card-name">{focused.name}</p>
                <p className="card-purpose">{focused.purpose}</p>
                <p className="meta">
                  {focused.mastery} · {focused.slot}
                  {focused.hands === 2 ? " · two-handed" : ""}
                  {focused.attachesTo ? ` · ${toolLabel(focused.attachesTo)}` : ""}
                  {focused.chargeMax != null ? ` · ${(session.charges[focused.id] ?? 0) > 0 ? "charged" : "spent"}` : ""}
                </p>
                <button type="button" onClick={() => toggle(focused.id)}>
                  {reading.wornNow ? "Put away" : "Wear this"}
                </button>
                {reading.error ? (
                  <p className="quiet">{reading.error}</p>
                ) : (
                  <div className="changes">
                    <p className="slot-label">{reading.wornNow ? "What it is doing here" : "If you wear it here"}</p>
                    {reading.quiet && <p className="quiet">This form quiets the piece, so the beat may ignore it.</p>}
                    {reading.gained.length === 0 && reading.lost.length === 0 && <p>This piece does not change the current beat.</p>}
                    {reading.gained.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                    {reading.lost.map((line) => (
                      <p key={line} className="meta">
                        Without it: {line}
                      </p>
                    ))}
                  </div>
                )}
                {focused.channels.length > 0 && (
                  <div className="row-actions">
                    {focused.channels.map((channel) => {
                      const active = session.mods[focused.id] === channel;
                      return (
                        <button
                          key={channel}
                          type="button"
                          className={active ? "chip on" : "chip"}
                          onClick={() => {
                            if (active) {
                              setSession(restoreMod(session, focused.id));
                              setNotice(`${focused.name} restored.`);
                              return;
                            }
                            const result = modify(session, focused.id, channel);
                            if (!result.ok) {
                              setNotice(reasonText(result.reason));
                              return;
                            }
                            setSession(result.session);
                            setNotice(`${focused.name} modified: ${channel}.`);
                          }}
                        >
                          {active ? `Restore ${channel}` : channel}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <ul className="bench-list">
              {shown.map((item) => {
                const on = wornSet.has(item.id);
                const selected = focus === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={on ? (selected ? "card on focus" : "card on") : selected ? "card focus" : "card"}
                      aria-pressed={on}
                      onClick={() => setFocus(item.id)}
                    >
                      <Glyph index={item.index} silhouette={item.silhouette} mark={item.mark} label={item.name} />
                      <span className="card-name">
                        {item.name}
                        {item.spotlight ? " · live" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {view === "compare" && compare && focused && (
        <section className="panel compare">
          <div className="compare-pick">
            <ItemSelect label="Left" value={focus} onChange={setFocus} />
            <ItemSelect label="Right" value={pinB} onChange={setPinB} />
          </div>
          <div className="compare-grid">
            <article>
              <h2>{getItem(focus)?.name}</h2>
              <p>{getItem(focus)?.purpose}</p>
            </article>
            <article>
              <h2>{getItem(pinB)?.name}</h2>
              <p>{getItem(pinB)?.purpose}</p>
            </article>
          </div>
          <table className="matrix">
            <thead>
              <tr>
                <th>Outcome</th>
                <th>{getItem(focus)?.name}</th>
                <th>{getItem(pinB)?.name}</th>
              </tr>
            </thead>
            <tbody>
              {compare.keys.map((key) => (
                <tr key={key}>
                  <th>{factLabel(key)}</th>
                  <td>{compare.left[key] === undefined ? "—" : factValue(key, compare.left[key])}</td>
                  <td>{compare.right[key] === undefined ? "—" : factValue(key, compare.right[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="compare-grid">
            <article>
              <h2>Only the left</h2>
              {(compare.leftNotes.length ? compare.leftNotes : ["Nothing the other side doesn't already do."]).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </article>
            <article>
              <h2>Only the right</h2>
              {(compare.rightNotes.length ? compare.rightNotes : ["Nothing the other side doesn't already do."]).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </article>
          </div>
          <p className="meta">Solo survey on the same field, read for the yard you have open. Shared baseline outcomes stay hidden. Doors stay shut in both columns.</p>
        </section>
      )}

      {view === "matrix" && (
        <section className="panel matrix-wrap">
          <p className="meta">Light-body is a form, not the lantern tool. No row can turn a key or light a dungeon without that tool. The current form is marked on the columns it actually carries.</p>
          <div className="scene-row">
            {(
              [
                ["all", "All pieces"],
                ["worn", "Worn now"],
                ["live", "Live set"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" className={matrixScope === id ? "chip on" : "chip"} onClick={() => setMatrixScope(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="matrix-scroll">
            <table className="matrix">
              <thead>
                <tr>
                  <th>Piece</th>
                  <th>Slot</th>
                  <th>Tool</th>
                  {MATRIX_TAGS.map((tag) => (
                    <th key={tag} className={session.form.tags.includes(tag) ? "form-on" : ""}>
                      {tag}
                    </th>
                  ))}
                  <th>Door</th>
                  <th>Light</th>
                </tr>
              </thead>
              <tbody>
                {matrix
                  .filter((row) => (matrixScope === "worn" ? wornSet.has(row.id) : matrixScope === "live" ? liveIds.has(row.id) : true))
                  .map((row) => (
                  <tr key={row.id} className={wornSet.has(row.id) ? "worn-row" : ""}>
                    <th>{row.name}</th>
                    <td>{row.slot}</td>
                    <td>{row.needsTool ? toolLabel(row.needsTool as ToolId) : "—"}</td>
                    {MATRIX_TAGS.map((tag) => (
                      <td key={tag} className={row.forms[tag] === "suppressed" ? "bad" : "ok"}>
                        {row.forms[tag] === "suppressed" ? "off" : "on"}
                      </td>
                    ))}
                    <td className="bad">no</td>
                    <td className="bad">no</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function ItemSelect({ label, value, onChange }: { label: string; value: string; onChange: (id: string) => void }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {CATALOG.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function createLike(session: Session): Session {
  const fresh = applyPreset([]);
  return { ...fresh, tools: { ...session.tools }, hasKey: session.hasKey, form: { ...session.form, tags: [...session.form.tags] }, lanternLocation: session.lanternLocation };
}

function soloFacts(session: Session, id: string): Facts {
  const base = createLike(session);
  const worn = equip(base, id);
  return runBeat(worn.ok ? worn.session : base, SURVEY).facts;
}

