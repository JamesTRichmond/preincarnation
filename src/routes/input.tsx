import { createFileRoute } from "@tanstack/react-router";
import { InputLab } from "../../support/grok-19-input/ui/InputLab.tsx";

export const Route = createFileRoute("/input")({
  component: InputBench,
});

function InputBench() {
  return <InputLab />;
}
