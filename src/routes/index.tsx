import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/game-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <a href="/yard" className="kit-link">
        Kit yard
      </a>
      <GameApp />
    </>
  );
}
