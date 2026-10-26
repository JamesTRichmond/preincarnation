import { createFileRoute } from "@tanstack/react-router";
import { Arena } from "../../support/grok-48-equipment/ui/Arena.tsx";

export const Route = createFileRoute("/yard")({
  component: Yard,
});

function Yard() {
  return (
    <div className="yard-shell">
      <a href="/" className="kit-link">
        Back to the green
      </a>
      <Arena />
    </div>
  );
}
