import { createFileRoute, Link } from "@tanstack/react-router";
import { InventoryScreen } from "../../support/grok-54-inventory/ui/InventoryScreen.tsx";

export const Route = createFileRoute("/satchel")({
  component: SatchelDesk,
});

function SatchelDesk() {
  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <div className="shrink-0 border-b border-border px-4 py-2">
        <Link to="/" className="font-mono text-xs tracking-widest text-fg-subtle uppercase">
          Back to the county
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <InventoryScreen />
      </div>
    </div>
  );
}
