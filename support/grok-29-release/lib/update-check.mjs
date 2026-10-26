/**
 * Update check for the web build. There is no service worker and no store updater.
 * A failed fetch is offline, not "up to date". Saves are never cleared here.
 */

export function checkUpdate({ localBuildId, localSaveMax, remote, offline }) {
  if (offline || remote == null) {
    return {
      status: "offline",
      action: "keep-local",
      message:
        "No network. This build has no offline shell. The save on this device was left untouched. Try again when the manifest can be fetched.",
    };
  }
  if (!remote.buildId || !remote.save) {
    return {
      status: "unreadable-manifest",
      action: "keep-local",
      message: "The update manifest was damaged. Nothing was replaced.",
    };
  }
  const remoteMax = remote.save.version;
  if (remote.buildId === localBuildId) {
    return { status: "current", action: "none", saveCompatible: true };
  }
  return {
    status: "update-available",
    action: "export-then-update",
    saveCompatible: remoteMax >= localSaveMax,
    remoteBuildId: remote.buildId,
    message:
      "A different web build is published. Export the life before opening it. This check does not download or swap cached files by itself.",
  };
}
