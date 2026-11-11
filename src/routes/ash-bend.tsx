import { createFileRoute, Link } from "@tanstack/react-router";
import { HouseholdRoom } from "../../support/grok-75-household-loot/ui/HouseholdRoom.tsx";

export const Route = createFileRoute("/ash-bend")({
  component: AshBendDesk,
});

function AshBendDesk() {
  return (
    <div className="min-h-screen bg-ash-pine text-ash-cream">
      <div className="mx-auto flex max-w-6xl items-center px-4 pt-3 md:px-6">
        <Link to="/" className="text-sm text-ash-plaster underline-offset-2 hover:underline">
          Back to the county
        </Link>
      </div>
      <HouseholdRoom />
    </div>
  );
}
