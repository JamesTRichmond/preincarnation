import { useEffect, useState } from "react";
import { Console } from "./console.tsx";

/** Opens the field ledger over the game. Closed, it does not take the keyboard. */
export function LedgerGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      delete document.body.dataset.ledgerOpen;
      return;
    }
    document.body.dataset.ledgerOpen = "1";
    return () => {
      delete document.body.dataset.ledgerOpen;
    };
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        data-testid="open-ledger"
        className="fixed right-3 bottom-3 z-30 min-h-11 rounded-md border border-border bg-bg-elevated px-3 text-sm text-fg"
        onClick={() => setOpen(true)}
      >
        Field ledger
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-bg">
      <Console onClose={() => setOpen(false)} />
    </div>
  );
}
