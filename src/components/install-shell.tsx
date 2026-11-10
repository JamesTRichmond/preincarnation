import { useEffect } from "react";

/** Registers the one shell worker. It does not touch the save and it does not sign anyone in. */
export function InstallShell() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}
