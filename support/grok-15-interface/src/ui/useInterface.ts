import { useEffect, useReducer } from "react";
import type { InterfaceBindings } from "../types.ts";
import { intentFromGamepad } from "../logic/input.ts";
import { createSession, reduce, topScreen, type Action, type SessionState } from "../logic/session.ts";

export function useInterface(bindings: InterfaceBindings, initial?: SessionState) {
  const [state, dispatch] = useReducer(
    reduce,
    { bindings, initial },
    ({ bindings: source, initial: seeded }) =>
      seeded ??
      createSession({
        slots: source.readSlots(),
        settings: source.readSettings(),
        catalog: source.catalog,
        simulateField: source.simulateField,
        source: source.source,
        sourceLabel: source.sourceLabel,
      }),
  );

  useEffect(() => {
    const pending = state.pending;
    if (!pending) return;
    let cancel = false;
    bindings.loadSlot(pending.slotId, pending.repair).then(
      (snapshot) => {
        if (!cancel) dispatch({ type: "finish-load", snapshot });
      },
      (error: unknown) => {
        if (!cancel) {
          dispatch({
            type: "fail-load",
            message: error instanceof Error ? error.message : "The page could not be read.",
          });
        }
      },
    );
    return () => {
      cancel = true;
    };
  }, [bindings, state.pending]);

  useEffect(() => {
    const pending = state.pendingCreate;
    if (!pending) return;
    let cancel = false;
    const started = bindings.createLife ? bindings.createLife() : Promise.reject(new Error("No life could be started."));
    started.then(
      (snapshot) => {
        if (!cancel) dispatch({ type: "finish-create", snapshot });
      },
      (error: unknown) => {
        if (!cancel) {
          dispatch({
            type: "fail-create",
            message: error instanceof Error ? error.message : "The life could not be started.",
          });
        }
      },
    );
    return () => {
      cancel = true;
    };
  }, [bindings, state.pendingCreate]);

  useEffect(() => {
    if (!state.persist || state.persistNonce === 0) return;
    void bindings.saveSlot(state.persist.slotId, state.persist.snapshot);
  }, [bindings, state.persist, state.persistNonce]);

  useEffect(() => {
    if (state.settingsNonce === 0) return;
    void bindings.writeSettings(state.settings);
  }, [bindings, state.settings, state.settingsNonce]);

  const playing = topScreen(state) === "field" && !state.frozen && !state.modal && Boolean(state.gameplay);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => dispatch({ type: "tick", seconds: 0.25 }), 250);
    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    let previous = Array.from({ length: 16 }, () => false);
    let frame = 0;
    const loop = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const pad = Array.from(pads).find((entry) => entry && entry.connected);
      if (pad) {
        const next = pad.buttons.map((button) => button.pressed);
        const intent = intentFromGamepad(previous, next);
        previous = next;
        if (intent) {
          dispatch({ type: "set-device", device: "gamepad" });
          dispatch({ type: "intent", intent });
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return { state, dispatch: dispatch as (action: Action) => void, bindings };
}
