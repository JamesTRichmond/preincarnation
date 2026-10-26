import { createFileRoute } from "@tanstack/react-router";
import { FourteenWinters } from "@/components/fourteen/play";

export const Route = createFileRoute("/winters")({
  component: FourteenWinters,
});
