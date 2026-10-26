import { createFileRoute, Link } from "@tanstack/react-router";
import { Studio } from "../../support/grok-14-enemy-presentation/studio/Studio";

export const Route = createFileRoute("/plates")({
  component: PlatesPage,
});

function PlatesPage() {
  return (
    <>
      <p className="bg-bg px-3 pt-3">
        <Link to="/" className="text-sm text-primary">
          Back to the Green
        </Link>
      </p>
      <Studio />
    </>
  );
}
