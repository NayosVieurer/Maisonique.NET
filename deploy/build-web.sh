#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root/client"
npm ci --no-fund
npm run typecheck
npm run export:web -- --output-dir "$root/server/wwwroot" --max-workers 2
node "$root/deploy/web-notices.mjs" "$root/server/wwwroot"
