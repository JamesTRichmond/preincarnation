import { useEffect, useState } from "react";
import { Board } from "./Board.tsx";
import { Gathering } from "./Gathering.tsx";
import { LetterView, Parlor, People, Person } from "./Parlor.tsx";
import { Button } from "./bits.tsx";
import {
  abandonGathering,
  acknowledgeIntro,
  advanceWeek,
  amendCaption,
  beginFestival,
  boardModel,
  chooseHeat,
  declineFestival,
  fileGathering,
  markLetterRead,
  passFourteenYears,
  pinInRoom,
  placeInRoom,
  setRoomTune,
  townIsReady,
  withdrawHeat,
} from "../hub/engine.ts";
import { festivalById } from "../festivals/index.ts";
import { loadSave, persistSave, createInitialSave, deserialize, serialize } from "../save/save.ts";
import type { Amendment, FestivalId, RivalId, SaveData } from "../types.ts";
import type { SlotKey } from "../memory/room.ts";

type Screen =
  | { name: "board" }
  | { name: "gathering" }
  | { name: "parlor" }
  | { name: "people" }
  | { name: "person"; rivalId: RivalId; from: "board" | "gathering" | "parlor" | "people" }
  | { name: "letter"; rewardId: string };

function screenKey(screen: Screen): string {
  if (screen.name === "person") return `person:${screen.rivalId}:${screen.from}`;
  if (screen.name === "letter") return `letter:${screen.rewardId}`;
  return screen.name;
}

export function CommunityHub() {
  const [save, setSave] = useState<SaveData>(createInitialSave);
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: "board" });
  const [notice, setNotice] = useState("The record is kept in this browser.");
  const [armReset, setArmReset] = useState(false);

  useEffect(() => {
    const storage = window.localStorage;
    const loaded = loadSave(storage);
    setSave(loaded);
    if (loaded.inProgress) setScreen({ name: "gathering" });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistSave(window.localStorage, save);
    const onHide = () => {
      if (document.visibilityState === "hidden") persistSave(window.localStorage, save);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [save, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.scrollTo(0, 0);
  }, [screen, hydrated]);

  function update(next: SaveData, nextScreen?: Screen, note?: string) {
    setSave(next);
    if (nextScreen) setScreen(nextScreen);
    setNotice(note ?? "Record kept.");
    setArmReset(false);
  }

  function openFestival(id: FestivalId) {
    if (save.inProgress && save.inProgress.festivalId !== id) {
      setScreen({ name: "gathering" });
      setNotice("A gathering is already underway. File it or leave it before starting another.");
      return;
    }
    if (save.inProgress?.festivalId === id) {
      setScreen({ name: "gathering" });
      return;
    }
    const next = beginFestival(save, id);
    if (!next.inProgress) return;
    update(next, { name: "gathering" }, `${festivalById(id).name} is open.`);
  }

  function importRecord(file: File) {
    void file.text().then((raw) => {
      try {
        const parsed = JSON.parse(raw) as { version?: number };
        if (parsed.version !== 1) {
          setNotice("That file is not a Harrowford record. This one stands.");
          return;
        }
      } catch {
        setNotice("That file could not be read. This record stands.");
        return;
      }
      const next = deserialize(raw);
      update(next, next.inProgress ? { name: "gathering" } : { name: "board" }, "Record brought in.");
    });
  }

  function exportRecord() {
    const blob = new Blob([serialize(save)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "harrowford-record.json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Ruth's copy is in your downloads.");
  }

  const model = boardModel(save);
  const backTarget: Screen =
    screen.name === "person"
      ? { name: screen.from }
      : screen.name === "letter"
        ? { name: "parlor" }
        : { name: "board" };
  const backLabel =
    screen.name === "gathering" ? "Board" : screen.name === "person" ? "Back" : screen.name === "letter" ? "Parlor" : "Board";
  const back =
    screen.name === "board" ? null : (
      <Button variant="quiet" onClick={() => setScreen(backTarget)}>
        {backLabel}
      </Button>
    );

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-maple uppercase">Preincarnation</p>
          <p className="font-display text-2xl text-ink">Harrowford</p>
          <p className="text-sm text-walnut">
            {model.eraYear} · {model.weekLabel} · {model.ellis}
          </p>
        </div>
        {back}
      </header>
      <div key={screenKey(screen)} className="town-in">
        {screen.name === "board" ? (
          <Board
            model={model}
            onOpen={openFestival}
            onTurn={() => update(advanceWeek(save), undefined, "One week turns.")}
            onJump={() => update(townIsReady(save), undefined, "The town moved to the next posting.")}
            onPass={() =>
              update(
                passFourteenYears(save),
                undefined,
                "Fourteen years pass. The people who were your age are not your age.",
              )
            }
            onParlor={() => setScreen({ name: "parlor" })}
            onPeople={() => setScreen({ name: "people" })}
            onDecline={(id) => update(declineFestival(save, id), undefined, "Absence filed. The life continues.")}
          />
        ) : null}
        {screen.name === "gathering" ? (
          <Gathering
            save={save}
            onIntro={() => update(acknowledgeIntro(save), undefined, "The first heat begins.")}
            onChoose={(decisionId, useAccessible) => update(chooseHeat(save, { decisionId, useAccessible }))}
            onWithdraw={() => update(withdrawHeat(save), undefined, "You stepped back from the heat.")}
            onFile={() => {
              const name = save.inProgress ? festivalById(save.inProgress.festivalId).name : "The gathering";
              const filed = fileGathering(save);
              const kept = Boolean(filed.attended[`${save.eraId}:${save.inProgress?.festivalId}`]);
              update(filed, { name: "board" }, kept ? `${name} is filed.` : `${name} was set aside. The bonds return.`);
            }}
            onAbandon={() => update(abandonGathering(save), { name: "board" }, "You left. The doorway is as you found it.")}
            onDecline={() =>
              save.inProgress
                ? update(
                    declineFestival(save, save.inProgress.festivalId),
                    { name: "board" },
                    "Absence filed. The life continues.",
                  )
                : setScreen({ name: "board" })
            }
            onPerson={(rivalId) => setScreen({ name: "person", rivalId, from: "gathering" })}
          />
        ) : null}
        {screen.name === "parlor" ? (
          <Parlor
            save={save}
            onPlace={(kind: SlotKey, index, rewardId) => update(placeInRoom(save, kind, index, rewardId))}
            onPin={(rewardId) => update(pinInRoom(save, rewardId))}
            onTune={(rewardId) => update(setRoomTune(save, rewardId), undefined, "The stool has a piece.")}
            onAmend={(rewardId, amendment: Amendment) => update(amendCaption(save, rewardId, amendment))}
            onRead={(rewardId) => update(markLetterRead(save, rewardId))}
            onPerson={(rivalId) => setScreen({ name: "person", rivalId, from: "parlor" })}
            onLetter={(rewardId) => setScreen({ name: "letter", rewardId })}
          />
        ) : null}
        {screen.name === "people" ? (
          <People save={save} onPerson={(rivalId) => setScreen({ name: "person", rivalId, from: "people" })} />
        ) : null}
        {screen.name === "person" ? <Person save={save} rivalId={screen.rivalId} /> : null}
        {screen.name === "letter" ? <LetterView save={save} rewardId={screen.rewardId} /> : null}
      </div>

      <footer className="mt-10 border-t border-line pt-4 text-sm text-walnut">
        <p>{notice}</p>
        <details className="mt-3">
          <summary className="flex min-h-11 items-center font-medium text-ink">The record</summary>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button onClick={exportRecord}>Take Ruth's copy</Button>
            {hydrated ? (
              <label className="inline-flex min-h-11 cursor-pointer items-center border border-line bg-cream px-4 text-sm text-ink">
                Bring a record back
                <input
                  type="file"
                  accept="application/json"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) importRecord(file);
                    event.target.value = "";
                  }}
                />
              </label>
            ) : (
              <span className="inline-flex min-h-11 items-center border border-line bg-cream px-4 text-sm text-ink">
                Bring a record back
              </span>
            )}
            {armReset ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => {
                    update(createInitialSave(), { name: "board" }, "The record was set aside.");
                  }}
                >
                  Yes, set it aside
                </Button>
                <Button variant="quiet" onClick={() => setArmReset(false)}>
                  Keep this record
                </Button>
              </>
            ) : (
              <Button variant="quiet" onClick={() => setArmReset(true)}>
                Set this record aside
              </Button>
            )}
          </div>
        </details>
      </footer>
    </main>
  );
}
