import { createFileRoute, Link } from "@tanstack/react-router";
import { FieldKitchen } from "../../support/grok-50-provisions/ui/FieldKitchen";

export const Route = createFileRoute("/kitchen")({
  component: KitchenPage,
});

function KitchenPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-4">
        <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">Camp book · not the Vein</p>
        <Link to="/" className="inline-flex min-h-11 items-center rounded-lg bg-bg-elevated px-3 text-sm text-fg">
          Back to the Green
        </Link>
      </div>
      <FieldKitchen />
    </div>
  );
}
