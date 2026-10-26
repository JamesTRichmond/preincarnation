import { useEffect, useState } from "react";
import { freshSave, hydrate, SAVE_KEY, serialize, type OutingSave } from "@/game/field/index.ts";

export function useOuting() {
  const [save, setSave] = useState<OutingSave>(() => freshSave());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setSave(hydrate(localStorage.getItem(SAVE_KEY)));
    } catch {
      setSave(freshSave());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      try {
        localStorage.setItem(SAVE_KEY, serialize(save));
      } catch {
        /* private mode or a full quota: the walk continues in memory */
      }
    };
    flush();
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [save, ready]);

  return { save, setSave, ready };
}
