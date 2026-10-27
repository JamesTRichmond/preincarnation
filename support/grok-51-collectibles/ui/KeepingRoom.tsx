import { useEffect, useRef, useState } from "react";
import { BookOpen, Flame, Home, Map, ScrollText, Layers } from "lucide-react";
import { initialSave, reduce, type Action } from "../archive.ts";
import { census, validateCatalog } from "../validate.ts";
import { hydrate, load, persist } from "../save.ts";
import type { Save } from "../types.ts";
import { DeskView } from "./DeskView.tsx";
import { GroundsView } from "./GroundsView.tsx";
import { LedgerView } from "./LedgerView.tsx";
import { RoomView } from "./RoomView.tsx";
import { TableView } from "./TableView.tsx";
import { householdThread, type RoomTab } from "./thread.ts";

type Tab = RoomTab;

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "room", label: "Room", icon: Home },
  { id: "ledger", label: "Ledger", icon: Layers },
  { id: "table", label: "Keeping", icon: Flame },
  { id: "desk", label: "Desk", icon: BookOpen },
  { id: "grounds", label: "Grounds", icon: Map },
];

export function KeepingRoom() {
  const [save, setSave] = useState<Save>(initialSave);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("room");
  const [cardId, setCardId] = useState("fw-004");
  const [docId, setDocId] = useState("doc-01");
  const [objectId, setObjectId] = useState("dec-01");
  const [when, setWhen] = useState<"then" | "later">("then");
  const [archive, setArchive] = useState<string[] | null>(null);
  const [armed, setArmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const counts = census();

  useEffect(() => {
    setSave(load(localStorage));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persist(save, localStorage);
    const flush = () => persist(save, localStorage);
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [save, hydrated]);

  function dispatch(action: Action) {
    setSave((prev) => reduce(prev, action));
    setArmed(false);
  }

  function openDoc(id: string) {
    setDocId(id);
    setWhen("then");
    setTab("desk");
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-widest text-ink/70 uppercase">
                White River valley
              </p>
              <h1 className="font-display text-4xl leading-none text-pine sm:text-5xl">Fourteen Winters</h1>
              <p className="mt-2 max-w-xl text-ink/80">
                The keeping room. Cards go into a legal ledger. Objects turn on the shelf. Papers are read,
                and maps are walked by their landmarks.
              </p>
            </div>
            <p className="text-sm text-ink/70 tabular-nums">
              {save.read.length} papers read · {save.huntsFound.length} of {counts.hunts} caches ·{" "}
              {save.playedCards.length} cards through a winter
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Keeping room">
            {TABS.map((item) => {
              const Icon = item.icon;
              const on = tab === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={on}
                  className={`press inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                    on ? "bg-pine text-paper" : "bg-ink/5 text-ink"
                  }`}
                  onClick={() => setTab(item.id)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <p
          className={`min-h-6 border-l-2 pl-3 text-sm text-ember ${save.lastNotice ? "border-ember" : "border-transparent"}`}
          role="status"
          aria-live="polite"
        >
          {save.lastNotice}
        </p>
        <Tonight save={save} tab={tab} onGo={setTab} />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {tab === "room" && (
          <RoomView
            save={save}
            dispatch={dispatch}
            objectId={objectId}
            setObjectId={setObjectId}
            when={when}
            setWhen={setWhen}
          />
        )}
        {tab === "ledger" && (
          <LedgerView
            save={save}
            dispatch={dispatch}
            cardId={cardId}
            setCardId={setCardId}
            when={when}
            setWhen={setWhen}
            onPractice={() => setTab("table")}
          />
        )}
        {tab === "table" && <TableView save={save} dispatch={dispatch} cardId={cardId} />}
        {tab === "desk" && (
          <DeskView
            save={save}
            dispatch={dispatch}
            docId={docId}
            setDocId={(id) => {
              setDocId(id);
              setWhen("then");
            }}
            when={when}
            setWhen={setWhen}
          />
        )}
        {tab === "grounds" && (
          <GroundsView save={save} dispatch={dispatch} docId={docId} openDoc={openDoc} />
        )}

        <footer className="mt-10 flex flex-col gap-3 border-t border-ink/15 pt-4 text-sm text-ink/70">
          <div className="flex flex-wrap gap-2">
            <button
              className="press h-11 rounded-full bg-ink/5 px-4 font-semibold text-ink"
              onClick={() => setArchive(validateCatalog())}
            >
              <ScrollText className="mr-2 inline size-4" aria-hidden="true" />
              Check the archive
            </button>
            <button
              className="h-11 rounded-full bg-ink/5 px-4 font-semibold text-ink"
              onClick={() => {
                const blob = new Blob([JSON.stringify(save)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "fourteen-winters-ledger.json";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download ledger
            </button>
            <button
              className="press h-11 rounded-full bg-ink/5 px-4 font-semibold text-ink"
              onClick={() => fileRef.current?.click()}
            >
              Load ledger
            </button>
            <input
              ref={fileRef}
              className="hidden"
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string") setSave(hydrate(reader.result));
                };
                reader.readAsText(file);
              }}
            />
            <button
              className="h-11 rounded-full bg-ink/5 px-4 font-semibold text-ink"
              onClick={() => {
                if (!armed) {
                  setArmed(true);
                  return;
                }
                setSave(initialSave());
                setArmed(false);
              }}
            >
              {armed ? "Put the room back — confirm" : "Put the room back"}
            </button>
          </div>
          {archive && (
            <p className={archive.length === 0 ? "text-pine" : "text-ember"}>
              {archive.length === 0
                ? "The archive holds: 72 cards seat in legal decks, 48 objects place and turn, 24 papers read through to a discovery, 3 hunts walk to their caches."
                : archive.slice(0, 6).join(" ")}
            </p>
          )}
          <p>Kept in this browser. Quest papers stay in the desk.</p>
        </footer>
      </div>
    </main>
  );
}

function Tonight({ save, tab, onGo }: { save: Save; tab: Tab; onGo: (tab: Tab) => void }) {
  const thread = householdThread(save);
  const here = thread.tab === tab;
  const label = TABS.find((item) => item.id === thread.tab)?.label ?? "room";
  const body = (
    <>
      <p className="text-xs font-semibold tracking-widest text-ink/60 uppercase">Tonight</p>
      <p className="font-display text-2xl text-pine">{thread.title}</p>
      <p className="max-w-prose text-pretty text-sm text-ink/80">{thread.detail}</p>
      {here ? null : <p className="text-sm font-semibold text-ember">Open the {label}</p>}
    </>
  );
  if (here) {
    return <div className="mt-3 rounded-card bg-ink/5 px-4 py-3">{body}</div>;
  }
  return (
    <button className="press mt-3 w-full rounded-card bg-ink/5 px-4 py-3 text-left" onClick={() => onGo(thread.tab)}>
      {body}
    </button>
  );
}
