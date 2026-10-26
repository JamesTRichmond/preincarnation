import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/game-app";
import { LedgerGate } from "@/game/batch/ui/gate";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <GameApp />
      <LedgerGate />
    </>
  );
}
