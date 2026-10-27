import { useEffect, useRef, type KeyboardEvent } from "react";
import { findById, pageCount, pageSlice } from "../catalog.ts";
import { intentFromKeyboard } from "../logic/input.ts";
import {
  discoveredPlaces,
  focusItems,
  passage,
  topScreen,
  visibleEvidence,
  type Action,
  type SessionState,
} from "../logic/session.ts";
import type { InterfaceBindings } from "../types.ts";
import { Icon } from "./Icon.tsx";
import { FIGURE, STOOD_AT, SURVEY, groundFor } from "./ground.ts";
import "./interface.css";

interface ViewProps {
  state: SessionState;
  dispatch: (action: Action) => void;
  renderField?: InterfaceBindings["renderField"];
}

export function InterfaceView({ state, dispatch, renderField }: ViewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const top = topScreen(state);
  const overField = Boolean(state.gameplay) && state.stack.includes("field") && top !== "field";
  const showField = Boolean(state.gameplay) && (top === "field" || overField);

  useEffect(() => {
    const root = frameRef.current;
    if (!root) return;
    const active = root.querySelector<HTMLElement>('[data-active="true"]');
    if (active) {
      active.focus({ preventScroll: true });
      active.scrollIntoView({ block: "nearest" });
    } else if (top === "field") {
      root.focus({ preventScroll: true });
    }
  }, [state.focusId, state.modal, state.journalFilter, state.stack, top]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const intent = intentFromKeyboard({
      key: event.key,
      code: event.code,
      shiftKey: event.shiftKey,
      repeat: event.repeat,
    });
    if (!intent) return;
    event.preventDefault();
    dispatch({ type: "set-device", device: "keyboard" });
    dispatch({ type: "intent", intent });
  };

  return (
    <div
      className="pi-frame"
      data-ground={showField && top === "field" ? "field" : overField ? "field" : "ledger"}
      data-screen={top}
      data-touch={state.settings.touch}
      data-motion={state.settings.reduceMotion ? "reduce" : "full"}
      ref={frameRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") dispatch({ type: "set-device", device: "touch" });
      }}
    >
      {state.source === "dev-fixture" ? <p className="pi-ribbon">{state.sourceLabel}</p> : null}
      <div className="pi-fill">
        {showField && state.gameplay ? (
          <Field state={state} dispatch={dispatch} dim={overField} renderField={renderField} />
        ) : null}
        {top !== "field" ? (
          overField ? (
            <div className="pi-card" role="dialog" aria-modal="true" aria-labelledby="pi-screen-title">
              <Screen state={state} dispatch={dispatch} />
            </div>
          ) : (
            <div className="pi-ledger" role="region" aria-labelledby="pi-screen-title">
              <Screen state={state} dispatch={dispatch} />
            </div>
          )
        ) : null}
        {state.modal ? <Modal state={state} dispatch={dispatch} /> : null}
      </div>
      <TouchBar state={state} dispatch={dispatch} />
      <p className="pi-hint">{hintLine(state)}</p>
      <div className="pi-live" aria-live="polite">
        {screenTitle(state)}
        {state.notice ? ` ${state.notice}` : ""}
      </div>
    </div>
  );
}

function Screen({ state, dispatch }: ViewProps) {
  const top = topScreen(state);
  if (top === "title") return <Title state={state} dispatch={dispatch} />;
  if (top === "slots") return <Slots state={state} dispatch={dispatch} />;
  if (top === "loading") return <Loading state={state} dispatch={dispatch} />;
  if (top === "error") return <LoadError state={state} dispatch={dispatch} />;
  if (top === "character") return <Character state={state} dispatch={dispatch} />;
  if (top === "pause") return <Pause state={state} dispatch={dispatch} />;
  if (top === "settings") return <Settings state={state} dispatch={dispatch} />;
  if (top === "inventory") return <Inventory state={state} dispatch={dispatch} />;
  if (top === "quick") return <Quick state={state} dispatch={dispatch} />;
  if (top === "bottles") return <Bottles state={state} dispatch={dispatch} />;
  if (top === "upgrades") return <Upgrades state={state} dispatch={dispatch} />;
  if (top === "journal") return <Journal state={state} dispatch={dispatch} />;
  if (top === "entry") return <Entry state={state} dispatch={dispatch} />;
  if (top === "map") return <County state={state} dispatch={dispatch} />;
  if (top === "place") return <Place state={state} dispatch={dispatch} />;
  if (top === "history") return <History state={state} dispatch={dispatch} />;
  if (top === "credits") return <Credits state={state} dispatch={dispatch} />;
  if (top === "ending") return <Ending state={state} dispatch={dispatch} />;
  if (top === "epitaph") return <Epitaph state={state} dispatch={dispatch} />;
  return <p className="pi-empty">This screen is not in the register.</p>;
}

function Title({ state, dispatch }: ViewProps) {
  return (
    <>
      <figure className="pi-frontispiece">
        <img src={groundFor("ferry")} alt="" />
        <figcaption>Lark Ferry, before a name is set down.</figcaption>
      </figure>
      <Header kicker={state.catalog.county} title={state.catalog.title} lede="One soul. Twelve tools. A county that does not stay put." />
      <div className="pi-tools" aria-hidden="true">
        {state.catalog.tools.map((tool) => (
          <Icon key={tool.id} id={tool.icon} />
        ))}
      </div>
      <div className="pi-list">
        <Choice state={state} dispatch={dispatch} id="new-game" title="New life" detail="Open a blank page." icon="foot" />
        <Choice
          state={state}
          dispatch={dispatch}
          id="continue"
          title="Continue"
          detail="Resume a life already written."
          icon="key"
          disabled={focusItems(state).find((item) => item.id === "continue")?.disabled}
        />
        {state.slots.some((slot) => slot.snapshot?.completion) ? (
          <Choice state={state} dispatch={dispatch} id="afterward" title="Afterward" detail="The life that was set down." icon="seal" />
        ) : null}
        <Choice state={state} dispatch={dispatch} id="credits" title="Names" detail="Who the county kept." icon="inspect" />
        <Choice state={state} dispatch={dispatch} id="settings" title="Settings" detail="Sound, text, and touch." icon="fork" />
      </div>
    </>
  );
}

function Slots({ state, dispatch }: ViewProps) {
  const fresh = state.slotIntent === "new";
  return (
    <>
      <Header
        kicker="Pages"
        title={fresh ? "Choose a page" : "Continue a life"}
        lede={fresh ? "A blank page starts at the ferry. A written page must be erased first." : "Torn ink can be tried, and it can fail."}
      />
      <div className="pi-list">
        {state.slots.map((slot) => {
          const life = slot.snapshot;
          const era = life ? findById(state.catalog.eras, life.eraId)?.name : null;
          const detail = !slot.occupied
            ? "Blank page. No life is written here."
            : slot.damaged
              ? "Torn page. The ink ran."
              : `${era ?? "Unknown era"} · Life ${life?.returnIndex ?? "?"} · ${formatLifeTime(life?.playSeconds ?? 0)}`;
          return (
            <Choice
              key={slot.id}
              state={state}
              dispatch={dispatch}
              id={slot.id}
              title={slot.occupied ? (life?.lifeName ?? "Written page") : "Blank page"}
              detail={detail}
              icon={slot.damaged ? "error" : slot.occupied ? "heart" : "empty"}
              disabled={focusItems(state).find((item) => item.id === slot.id)?.disabled}
            />
          );
        })}
        <Back state={state} dispatch={dispatch} />
      </div>
    </>
  );
}

function Loading({ state, dispatch }: ViewProps) {
  const creating = Boolean(state.pendingCreate);
  return (
    <>
      <Header kicker="Please wait" title={creating ? "Setting the name down" : "Turning the page"} lede={creating ? "A new life is being written at the bank." : "The register is opening."} />
      <Icon id="loading" label="Loading" />
      <div className="pi-list">
        <Choice state={state} dispatch={dispatch} id="cancel-load" title="Stop" detail="Leave this page unopened." icon="cancel" />
      </div>
    </>
  );
}

function LoadError({ state, dispatch }: ViewProps) {
  return (
    <>
      <Header kicker="Unread" title="The page tore" lede={state.loadError ?? "This page could not be read."} />
      <Icon id="error" label="Error" />
      <div className="pi-list">
        <Choice state={state} dispatch={dispatch} id="retry" title="Read it again" detail="Try the same page once more." icon="inspect" />
        <Back state={state} dispatch={dispatch} label="Other pages" />
      </div>
    </>
  );
}

function Character({ state, dispatch }: ViewProps) {
  const character = state.catalog.character;
  const creating = state.characterMode === "create";
  return (
    <>
      <div className="pi-who">
        <img className="pi-portrait" src={FIGURE} alt="" />
        <Header
          kicker={character.epithet}
          title={character.name}
          lede={creating ? "Read this before the life begins. It is the same soul every time." : "The same soul, reviewed. Nothing here is spent."}
        />
      </div>
      <div className="pi-list">
        <Section state={state} dispatch={dispatch} id="background" title="Background" scrollKey="background" text={passage(state, "background")} />
        <Section state={state} dispatch={dispatch} id="bond" title={`Bond · ${character.bondName}`} scrollKey="bond" text={passage(state, "bond")} />
        <Section state={state} dispatch={dispatch} id="ideal" title="Ideal" scrollKey="ideal" text={passage(state, "ideal")} />
        <Section state={state} dispatch={dispatch} id="flaw" title="Flaw" scrollKey="flaw" text={passage(state, "flaw")} />
        {creating ? <Choice state={state} dispatch={dispatch} id="begin" title="Begin this life" detail="Wake at Lark Ferry." icon="foot" /> : null}
        <Back state={state} dispatch={dispatch} />
      </div>
    </>
  );
}

function Pause({ state, dispatch }: ViewProps) {
  return (
    <>
      <Header kicker="Paused" title="The county waits" lede="Closing this returns you to the same ground. The life clock does not run in here." />
      <div className="pi-list">
        <Choice state={state} dispatch={dispatch} id="resume" title="Resume" detail="Step back onto the ground." icon="confirm" />
        <Choice state={state} dispatch={dispatch} id="tools" title="Tools" detail="What is in hand." icon="hammer" />
        <Choice state={state} dispatch={dispatch} id="quick" title="Quick belt" detail="Four loops, chosen by you." icon="coil" />
        <Choice state={state} dispatch={dispatch} id="bottles" title="Bottles" detail="Glass in the brace." icon="bottle" />
        <Choice state={state} dispatch={dispatch} id="kept" title="What stayed" detail="Changes that already came back." icon="heart" />
        <Choice state={state} dispatch={dispatch} id="evidence" title="Evidence" detail="Notes you hold." icon="inspect" />
        <Choice state={state} dispatch={dispatch} id="county" title="County" detail="Places you have stood." icon="foot" />
        <Choice state={state} dispatch={dispatch} id="life" title="This life" detail="Background, bond, ideal, flaw." icon="shard" />
        <Choice state={state} dispatch={dispatch} id="returns" title="Returns" detail="Lives already lived." icon="loading" />
        <Choice state={state} dispatch={dispatch} id="settings" title="Settings" icon="fork" />
        <Choice state={state} dispatch={dispatch} id="quit" title="Title" detail="The page keeps what you have done." icon="back" />
      </div>
    </>
  );
}

function Settings({ state, dispatch }: ViewProps) {
  const { settings } = state;
  return (
    <>
      <Header kicker="Settings" title="How the page behaves" lede="Left and right change a row. Up and down move between rows." />
      <div className="pi-settings">
        <Slider id="music" label="Music" value={settings.music} state={state} dispatch={dispatch} />
        <Slider id="sfx" label="Sound" value={settings.sfx} state={state} dispatch={dispatch} />
        <Choice state={state} dispatch={dispatch} id="shake" title="Screen shake" detail={settings.screenShake ? "On" : "Off"} icon="hammer" />
        <Choice state={state} dispatch={dispatch} id="pace" title="Text pace" detail={settings.textPace} icon="inspect" />
        <Choice state={state} dispatch={dispatch} id="motion" title="Reduce motion" detail={settings.reduceMotion ? "On" : "Off"} icon="pause" />
        <Choice state={state} dispatch={dispatch} id="touch" title="Touch controls" detail={settings.touch} icon="confirm" />
        <Choice state={state} dispatch={dispatch} id="hints" title="Button hints" detail={settings.hints} icon="key" />
        <Back state={state} dispatch={dispatch} />
      </div>
    </>
  );
}

function Inventory({ state, dispatch }: ViewProps) {
  const owned = state.gameplay?.ownedToolIds ?? [];
  const keys = state.gameplay?.keyIds ?? [];
  return (
    <>
      <Header kicker="Tools" title="In hand" lede={`${owned.length} of ${state.catalog.tools.length} carried this life. The rest are remembered, not carried.`} />
      <div className="pi-grid">
        {state.catalog.tools.map((tool) => {
          const has = owned.includes(tool.id);
          const active = state.gameplay?.activeToolId === tool.id;
          return (
            <Choice
              key={tool.id}
              state={state}
              dispatch={dispatch}
              id={`tool-${tool.id}`}
              title={tool.name}
              detail={has ? (active ? "In hand." : tool.blurb) : "Not carried this life."}
              icon={tool.icon}
              disabled={!has}
            />
          );
        })}
      </div>
      {(state.gameplay?.ownedToolIds ?? []).filter((id) => !findById(state.catalog.tools, id)).map((id) => (
        <p key={id} className="pi-empty">
          This tool is not in the register ({id}).
        </p>
      ))}
      <div className="pi-keys">
        <h2 className="pi-choice-title">Keys</h2>
        {keys.length === 0 ? <p className="pi-empty">No key is on the ring.</p> : null}
        {keys.map((id) => {
          const def = findById(state.catalog.keys, id);
          const opened = def ? state.gameplay?.openedLockIds.includes(def.lockId) : false;
          return (
            <div key={id} className="pi-key">
              <Icon id={opened ? "unlocked" : def ? "key" : "error"} label={def?.name ?? id} />
              <div>
                <div className="pi-choice-title">{def?.name ?? "Unknown key"}</div>
                <div className="pi-choice-detail">
                  {def ? (opened ? `${def.answers} Opened.` : def.answers) : `Not in the register (${id}).`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Back state={state} dispatch={dispatch} />
    </>
  );
}

function Quick({ state, dispatch }: ViewProps) {
  const slots = state.gameplay?.quickSlots ?? [null, null, null, null];
  const owned = state.gameplay?.ownedToolIds ?? [];
  return (
    <>
      <Header kicker="Quick belt" title={`Loop ${state.quickIndex + 1}`} lede="Choose a loop, then a tool you carry. Number keys and the shoulder buttons use these on the ground." />
      <div className="pi-grid">
        {slots.slice(0, 4).map((toolId, index) => {
          const tool = toolId ? findById(state.catalog.tools, toolId) : undefined;
          return (
            <Choice
              key={index}
              state={state}
              dispatch={dispatch}
              id={`qslot-${index}`}
              title={`Loop ${index + 1}`}
              detail={tool?.name ?? "Empty"}
              icon={tool?.icon ?? "empty"}
            />
          );
        })}
      </div>
      <div className="pi-grid">
        {owned.map((id) => {
          const tool = findById(state.catalog.tools, id);
          return (
            <Choice
              key={id}
              state={state}
              dispatch={dispatch}
              id={`qtool-${id}`}
              title={tool?.name ?? id}
              detail={tool ? tool.blurb : `Not in the register (${id}).`}
              icon={tool?.icon ?? "error"}
            />
          );
        })}
      </div>
      <Back state={state} dispatch={dispatch} />
    </>
  );
}

function Bottles({ state, dispatch }: ViewProps) {
  const bottles = state.gameplay?.bottles ?? [];
  return (
    <>
      <Header kicker="Brace" title="Bottles" lede="Glass you are carrying. A sip is a sip. It is not stored as coin." />
      {bottles.length === 0 ? (
        <p className="pi-empty">No bottles in the brace.</p>
      ) : (
        <div className="pi-list">
          {bottles.map((bottle) => {
            const def = findById(state.catalog.bottles, bottle.kindId);
            return (
              <Choice
                key={bottle.id}
                state={state}
                dispatch={dispatch}
                id={`bottle-${bottle.id}`}
                title={def?.name ?? "Unknown bottle"}
                detail={def ? `${def.blurb} ${bottle.sips} sip${bottle.sips === 1 ? "" : "s"} left.` : `Not in the register (${bottle.kindId}).`}
                icon={def?.icon ?? "error"}
              />
            );
          })}
        </div>
      )}
      <Back state={state} dispatch={dispatch} />
    </>
  );
}

function Upgrades({ state, dispatch }: ViewProps) {
  const held = new Set(state.gameplay?.upgradeIds ?? []);
  return (
    <>
      <Header kicker="Across lives" title="What stayed" lede="These already changed the body or the tools. They are not priced and they are not bought." />
      {state.catalog.upgrades.length === 0 ? <p className="pi-empty">Nothing in this register stays between lives.</p> : null}
      <div className="pi-list">
        {state.catalog.upgrades.map((upgrade) => (
          <Choice
            key={upgrade.id}
            state={state}
            dispatch={dispatch}
            id={`upgrade-${upgrade.id}`}
            title={upgrade.name}
            detail={held.has(upgrade.id) ? upgrade.blurb : "Not carried across a life."}
            icon={held.has(upgrade.id) ? upgrade.icon : "empty"}
          />
        ))}
        <Back state={state} dispatch={dispatch} />
      </div>
      {held.size === 0 ? <p className="pi-empty">None of these have come back with you yet.</p> : null}
    </>
  );
}

function Journal({ state, dispatch }: ViewProps) {
  const rows = visibleEvidence(state);
  return (
    <>
      <Header kicker="Journal" title="Evidence" lede="Only notes you have actually held. A loose note is one you read and did not ink." />
      <div className="pi-filters">
        <Choice state={state} dispatch={dispatch} id="filter-all" title="All" />
        <Choice state={state} dispatch={dispatch} id="filter-inked" title="Inked" />
        <Choice state={state} dispatch={dispatch} id="filter-loose" title="Loose" />
      </div>
      {rows.length === 0 ? (
        <p className="pi-empty">
          {(state.gameplay?.evidence.length ?? 0) === 0
            ? "No notes in this life yet."
            : "Nothing in this set."}
        </p>
      ) : (
        <div className="pi-list">
          {rows.map((row) => {
            const def = findById(state.catalog.evidence, row.id);
            const place = def ? findById(state.catalog.places, def.placeId) : undefined;
            return (
              <Choice
                key={row.id}
                state={state}
                dispatch={dispatch}
                id={`entry-${row.id}`}
                title={def?.title ?? "Missing note"}
                detail={def ? `${place?.name ?? "Unknown place"} · ${row.inked ? "Inked" : "Loose"}` : `Not in the register (${row.id}).`}
                icon={row.inked ? "inspect" : "empty"}
              />
            );
          })}
        </div>
      )}
      <Back state={state} dispatch={dispatch} />
    </>
  );
}

function Entry({ state, dispatch }: ViewProps) {
  const def = state.selectedEntryId ? findById(state.catalog.evidence, state.selectedEntryId) : undefined;
  return (
    <>
      <Header kicker={def ? "Note" : "Missing"} title={def?.title ?? "Not in the register"} lede={def ? "Up and down turn a long note." : "This note is not in the register."} />
      <Section state={state} dispatch={dispatch} id="entry-body" title="Page" scrollKey="entry" text={passage(state, "entry")} />
      <Back state={state} dispatch={dispatch} />
    </>
  );
}

function County({ state, dispatch }: ViewProps) {
  const places = discoveredPlaces(state);
  return (
    <>
      <Header
        kicker={state.catalog.county}
        title="Where you have stood"
        lede="A place is listed after you have stood there. Nothing else is marked."
      />
      <div className="pi-survey">
        <img src={SURVEY} alt="" />
        {places.map((place) => {
          const at = STOOD_AT[place.id];
          if (!at) return null;
          const def = findById(state.catalog.places, place.id);
          return (
            <button
              key={place.id}
              type="button"
              className="pi-pin"
              data-here={state.gameplay?.placeId === place.id ? "true" : "false"}
              style={{ left: `${at.x}%`, top: `${at.y}%` }}
              tabIndex={-1}
              onClick={() => dispatch({ type: "pointer", id: `place-${place.id}`, kind: "activate" })}
            >
              <span>{def?.name ?? "Stood"}</span>
              <i />
            </button>
          );
        })}
      </div>
      {places.length === 0 ? <p className="pi-empty">You have not stood anywhere in this life yet.</p> : null}
      <div className="pi-list">
        {places.map((place) => {
          const def = findById(state.catalog.places, place.id);
          return (
            <Choice
              key={place.id}
              state={state}
              dispatch={dispatch}
              id={`place-${place.id}`}
              title={def?.name ?? "Not in the register"}
              detail={def?.memory ?? `This place is not in the register (${place.id}).`}
              icon={def ? "foot" : "error"}
            />
          );
        })}
        <Back state={state} dispatch={dispatch} />
      </div>
    </>
  );
}

function Place({ state, dispatch }: ViewProps) {
  const def = state.selectedPlaceId ? findById(state.catalog.places, state.selectedPlaceId) : undefined;
  const notes = (state.gameplay?.evidence ?? []).filter((entry) => {
    const evidence = findById(state.catalog.evidence, entry.id);
    return evidence?.placeId === state.selectedPlaceId;
  });
  return (
    <>
      <Header kicker="Stood here" title={def?.name ?? "Not in the register"} lede="A memory of ground you already reached. It does not point onward." />
      <Section state={state} dispatch={dispatch} id="place-body" title="Memory" scrollKey="place" text={passage(state, "place")} />
      {notes.length > 0 ? (
        <p className="pi-meta">Notes held from here: {notes.map((entry) => findById(state.catalog.evidence, entry.id)?.title ?? entry.id).join(", ")}.</p>
      ) : (
        <p className="pi-meta">No notes held from here.</p>
      )}
      <Back state={state} dispatch={dispatch} />
    </>
  );
}

function History({ state, dispatch }: ViewProps) {
  const chapters = state.gameplay?.history ?? [];
  return (
    <>
      <Header kicker="Returns" title="Lives already lived" lede="A return is a life the river gave back. It is not something you spend." />
      {chapters.length === 0 ? <p className="pi-empty">No life has been written yet.</p> : null}
      <div className="pi-list">
        {chapters.map((chapter) => {
          const era = findById(state.catalog.eras, chapter.eraId);
          return (
            <Choice
              key={chapter.returnIndex}
              state={state}
              dispatch={dispatch}
              id={`chapter-${chapter.returnIndex}`}
              title={`Life ${chapter.returnIndex}${chapter.living ? " · still open" : ""}`}
              detail={`${era?.name ?? "Unknown era"} · ${chapter.years} years · ${chapter.closed}`}
              icon={chapter.living ? "heart" : "seal"}
            />
          );
        })}
        <Back state={state} dispatch={dispatch} />
      </div>
    </>
  );
}

function Credits({ state, dispatch }: ViewProps) {
  return (
    <>
      <Header kicker="Names" title="Kept" lede="Up and down turn the page." />
      <Section state={state} dispatch={dispatch} id="credits-body" title="Register" scrollKey="credits" text={passage(state, "credits")} />
      <Back state={state} dispatch={dispatch} />
    </>
  );
}

function Ending({ state, dispatch }: ViewProps) {
  const reached = state.gameplay?.completion?.endingId;
  return (
    <>
      <Header kicker="After the last return" title="What was set down" lede="One life, written to its end. The other endings stay shut." />
      <div className="pi-list">
        {state.catalog.endings.map((ending) => (
          <Choice
            key={ending.id}
            state={state}
            dispatch={dispatch}
            id={`ending-${ending.id}`}
            title={ending.name}
            detail={reached === ending.id ? "The life you set down. Open it." : "Pages shut."}
            icon={reached === ending.id ? "heart" : "lock"}
          />
        ))}
        <Choice state={state} dispatch={dispatch} id="to-credits" title="Names" icon="inspect" />
        <Choice state={state} dispatch={dispatch} id="to-county" title="Review the county" detail="Only places already walked." icon="foot" />
        <Choice state={state} dispatch={dispatch} id="to-field" title="Walk the ground again" detail="The same place you left." icon="confirm" disabled={!state.gameplay} />
        <Choice state={state} dispatch={dispatch} id="to-title" title="Title" icon="back" />
      </div>
      {state.notice ? <p className="pi-notice">{state.notice}</p> : null}
    </>
  );
}

function Epitaph({ state, dispatch }: ViewProps) {
  const ending = findById(state.catalog.endings, state.selectedEndingId ?? "");
  return (
    <>
      <Header kicker="Epitaph" title={ending?.name ?? "Pages shut"} lede="This is the life that was set down." />
      <Section state={state} dispatch={dispatch} id="epitaph-body" title="Page" scrollKey="epitaph" text={passage(state, "epitaph")} />
      <Back state={state} dispatch={dispatch} />
    </>
  );
}

function Field({
  state,
  dispatch,
  dim,
  renderField,
}: ViewProps & { dim: boolean }) {
  const life = state.gameplay;
  if (!life) return null;
  if (renderField) return <div className="pi-field">{renderField(life)}</div>;
  const place = findById(state.catalog.places, life.placeId);
  const era = findById(state.catalog.eras, life.eraId);
  const tool = life.activeToolId ? findById(state.catalog.tools, life.activeToolId) : undefined;
  const here = {
    left: `${8 + (life.position.x / 64) * 78}%`,
    bottom: `${28 + ((64 - life.position.y) / 64) * 28}%`,
  };
  const lit = life.activeToolId === "lantern" || Boolean(life.flags.lanternFed);
  return (
    <div className="pi-field" data-dim={dim ? "true" : "false"} data-era={life.eraId} aria-hidden={dim}>
      <img key={life.placeId} className="pi-ground" src={groundFor(life.placeId)} alt="" />
      <div className="pi-weather" />
      {lit ? <div className="pi-wick" style={here} /> : null}
      {life.flags.smokeCloud ? <div className="pi-smoke" style={here} /> : null}
      <div className="pi-figure" data-facing={life.facing} style={here}>
        <img src={FIGURE} alt="" />
      </div>
      <div className="pi-hud">
        <div className="pi-hud-card">
          <Hearts current={life.hearts.current} max={life.hearts.max} />
          <div className="pi-meta">
            {era?.name ?? "Unknown era"} · {place?.name ?? "Unknown ground"}
          </div>
        </div>
        <div className="pi-hud-card">
          <div className="pi-mono">{formatLifeTime(life.playSeconds)}</div>
          <div className="pi-meta">Life {life.returnIndex}</div>
        </div>
      </div>
      <div className="pi-plate">
        <strong>{place?.name ?? "Unknown ground"}</strong>
        <div className="pi-meta">{place?.memory ?? "This ground is not in the register."}</div>
        {tool || life.flags.smokeCloud || life.flags.lanternFed ? (
          <div className="pi-meta">
            {tool ? `${tool.name} in hand.` : ""}
            {life.flags.smokeCloud ? " Smoke at your feet." : ""}
            {life.flags.lanternFed ? " Wick fed." : ""}
          </div>
        ) : null}
        {dim || state.frozen ? <div className="pi-meta">The county waits.</div> : null}
      </div>
      <div className="pi-quick">
        {life.quickSlots.slice(0, 4).map((toolId, index) => {
          const quick = toolId ? findById(state.catalog.tools, toolId) : undefined;
          return (
            <button
              key={index}
              type="button"
              className="pi-icon-btn"
              data-held={life.activeToolId === toolId && toolId ? "true" : "false"}
              aria-label={quick ? `Loop ${index + 1}, ${quick.name}` : `Loop ${index + 1}, empty`}
              onClick={() => dispatch({ type: "pointer", id: `hud-quick-${index}`, kind: "activate" })}
            >
              <Icon id={quick?.icon ?? "empty"} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Modal({ state, dispatch }: ViewProps) {
  const modal = state.modal;
  if (!modal) return null;
  let title = "Are you sure?";
  let lede = "";
  let yes = "Yes";
  let no = "No";
  if (modal.kind === "overwrite") {
    title = "Erase this life?";
    lede = "This page already holds a life. Beginning again removes it.";
    yes = "Erase and begin";
    no = "Keep the page";
  } else if (modal.kind === "quit") {
    title = "Return to the title?";
    lede = "The page keeps what you have done.";
    yes = "Leave";
    no = "Stay";
  } else if (modal.kind === "use-bottle") {
    const bottle = state.gameplay?.bottles.find((entry) => entry.id === modal.bottleId);
    const def = bottle ? findById(state.catalog.bottles, bottle.kindId) : undefined;
    title = def ? `Use ${def.name.toLowerCase()}?` : "Use this bottle?";
    lede = def?.blurb ?? "This bottle is not in the register.";
    yes = "Use";
    no = "Not now";
  }
  return (
    <div className="pi-modal-back">
      <div className="pi-modal" role="dialog" aria-modal="true" aria-labelledby="pi-modal-title">
        <h2 id="pi-modal-title">{title}</h2>
        <p className="pi-lede">{lede}</p>
        <Choice state={state} dispatch={dispatch} id="modal-yes" title={yes} icon="confirm" />
        <Choice state={state} dispatch={dispatch} id="modal-no" title={no} icon="cancel" />
      </div>
    </div>
  );
}

function TouchBar({ state, dispatch }: ViewProps) {
  const field = topScreen(state) === "field" && !state.modal;
  const press = (id: string) => () => {
    dispatch({ type: "set-device", device: "touch" });
    dispatch({ type: "pointer", id, kind: "activate" });
  };
  return (
    <div className="pi-touch">
      <div className="pi-pad" aria-hidden={false}>
        <span />
        <button type="button" className="pi-dir pi-dir-n" aria-label={field ? "Step north" : "Move up"} onClick={press(field ? "nudge-up" : "focus-up")}>
          <Icon id="back" />
        </button>
        <span />
        <button type="button" className="pi-dir pi-dir-w" aria-label={field ? "Step west" : "Move left"} onClick={press(field ? "nudge-left" : "focus-left")}>
          <Icon id="back" />
        </button>
        <span />
        <button type="button" className="pi-dir pi-dir-e" aria-label={field ? "Step east" : "Move right"} onClick={press(field ? "nudge-right" : "focus-right")}>
          <Icon id="back" />
        </button>
        <span />
        <button type="button" className="pi-dir pi-dir-s" aria-label={field ? "Step south" : "Move down"} onClick={press(field ? "nudge-down" : "focus-down")}>
          <Icon id="back" />
        </button>
        <span />
      </div>
      <div className="pi-touch-actions">
        {field ? (
          <>
            <button type="button" onClick={press("hud-pause")}>
              Pause
            </button>
            <button type="button" onClick={press("hud-tools")}>
              Tools
            </button>
            <button type="button" onClick={press("hud-map")}>
              County
            </button>
            <button type="button" onClick={press("hud-journal")}>
              Notes
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={press("touch-back")}>
              Back
            </button>
            <button type="button" onClick={press("touch-confirm")}>
              Confirm
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Header({ kicker, title, lede }: { kicker: string; title: string; lede?: string }) {
  return (
    <header>
      <p className="pi-kicker">{kicker}</p>
      <h1 id="pi-screen-title">{title}</h1>
      {lede ? <p className="pi-lede">{lede}</p> : null}
    </header>
  );
}

function Choice({
  state,
  dispatch,
  id,
  title,
  detail,
  icon,
  disabled,
}: ViewProps & { id: string; title: string; detail?: string; icon?: string; disabled?: boolean }) {
  const active = state.focusId === id && !disabled;
  return (
    <button
      type="button"
      className="pi-choice"
      data-active={active ? "true" : "false"}
      disabled={disabled}
      tabIndex={active ? 0 : -1}
      onClick={() => dispatch({ type: "pointer", id, kind: "activate" })}
    >
      {icon ? <Icon id={icon} /> : null}
      <span className="pi-choice-copy">
        <span className="pi-choice-title">{title}</span>
        {detail ? <span className="pi-choice-detail">{detail}</span> : null}
      </span>
    </button>
  );
}

function Section({
  state,
  dispatch,
  id,
  title,
  scrollKey,
  text,
}: ViewProps & { id: string; title: string; scrollKey: string; text: string }) {
  const active = state.focusId === id;
  const page = state.scrolls[scrollKey] ?? 0;
  const pages = pageCount(text);
  return (
    <button
      type="button"
      className="pi-choice"
      data-active={active ? "true" : "false"}
      tabIndex={active ? 0 : -1}
      onClick={() => dispatch({ type: "pointer", id, kind: "activate" })}
    >
      <span className="pi-choice-copy">
        <span className="pi-choice-title">{title}</span>
        {active ? (
          <span className="pi-page">
            <span className="pi-choice-detail">{pageSlice(text, page)}</span>
            {pages > 1 ? (
              <span className="pi-page-count">
                Page {page + 1} of {pages}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function Slider({
  id,
  label,
  value,
  state,
  dispatch,
}: ViewProps & { id: string; label: string; value: number }) {
  const active = state.focusId === id;
  return (
    <button
      type="button"
      className="pi-choice"
      data-active={active ? "true" : "false"}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={value}
      aria-label={label}
      tabIndex={active ? 0 : -1}
      onClick={() => dispatch({ type: "pointer", id, kind: "focus" })}
    >
      <span className="pi-choice-copy">
        <span className="pi-choice-title">{label}</span>
        <span className="pi-choice-detail pi-mono">
          {value} / 10
        </span>
      </span>
    </button>
  );
}

function Back({ state, dispatch, label = "Back" }: ViewProps & { label?: string }) {
  return <Choice state={state} dispatch={dispatch} id="back" title={label} icon="back" />;
}

function Hearts({ current, max }: { current: number; max: number }) {
  const total = Math.max(0, Math.min(max, 8));
  return (
    <div className="pi-hearts" aria-label={`${current} of ${max} hearts`}>
      {Array.from({ length: total }, (_, index) => (
        <Icon key={index} id={index < current ? "heart" : "heart-empty"} />
      ))}
    </div>
  );
}

function screenTitle(state: SessionState): string {
  const titles: Record<string, string> = {
    title: "Title",
    slots: "Pages",
    loading: "Loading",
    error: "Unread page",
    character: "This life",
    field: "On the ground",
    pause: "Paused",
    settings: "Settings",
    inventory: "Tools",
    quick: "Quick belt",
    bottles: "Bottles",
    upgrades: "What stayed",
    journal: "Evidence",
    entry: "Note",
    map: "County",
    place: "Place",
    history: "Returns",
    credits: "Names",
    ending: "Afterward",
    epitaph: "Epitaph",
  };
  return titles[topScreen(state)] ?? "Register";
}

function hintLine(state: SessionState): string {
  const buttons =
    state.settings.hints === "buttons" || (state.settings.hints === "auto" && state.device === "gamepad");
  if (buttons) return "A confirm · B back · Start pause · Shoulders change the belt";
  if (state.device === "touch" || state.settings.hints === "keys") {
    return "Enter confirm · Backspace back · Esc pause · 1–4 belt loops";
  }
  return "Enter confirm · Backspace back · Esc pause · 1–4 belt loops";
}

function formatLifeTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
