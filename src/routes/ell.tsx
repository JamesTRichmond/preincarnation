import { createFileRoute, Link } from "@tanstack/react-router";
import { StorageRoomScreen } from "@/game/quick-storage/ui/storage-room-screen";

export const Route = createFileRoute("/ell")({
  component: EastEll,
});

function EastEll() {
  return (
    <div className="ell-skin">
      <p className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-4 sm:px-6">
        <Link to="/" className="text-sm text-copper underline-offset-2 hover:underline">
          Return to the Green
        </Link>
        <span className="text-xs tracking-widest text-muted uppercase">Reference room</span>
      </p>
      <StorageRoomScreen />
    </div>
  );
}
