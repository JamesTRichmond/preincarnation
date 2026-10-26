#!/bin/sh
# Probe only. Does not start the shared dev server and does not modify the app.
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
exec node support/grok-10-acceptance/launch-probe.mjs "$@"
