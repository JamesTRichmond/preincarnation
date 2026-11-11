import { createFileRoute } from "@tanstack/react-router";
import { ScoreDesk } from "../../support/grok-17-score/audition/ScoreDesk";

export const Route = createFileRoute("/score")({ component: ScoreDesk });
