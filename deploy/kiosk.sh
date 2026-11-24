#!/usr/bin/env bash
set -euo pipefail
# Run in the desktop user's graphical session.
until curl -fsS --max-time 2 http://127.0.0.1:5080/api/health >/dev/null 2>&1; do sleep 2; done
exec chromium --kiosk --no-first-run --noerrdialogs \
  --user-data-dir="$HOME/.local/share/kitchen-table-kiosk" http://127.0.0.1:5080/
