#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
if [[ ! -f server/wwwroot/index.html ]]; then
  bash "$root/deploy/build-web.sh"
fi
mkdir -p artifacts
stage=$(mktemp -d "$root/artifacts/.publish-XXXXXXXX")
trap 'rm -rf "$stage"' EXIT
release="$stage/KitchenTable-Pi"
mkdir -p "$release/app"
dotnet publish server/KitchenTable.csproj -c Release -r linux-arm64 --self-contained true \
  -p:RestoreLockedMode=true -p:DebugSymbols=false -p:DebugType=None -o "$release/app"
while IFS= read -r -d '' asset; do
  if ! cmp -s "$asset" "$release/app/${asset#server/}"; then
    echo "Published web asset is missing or different: $asset" >&2; exit 1
  fi
done < <(find server/wwwroot -type f -print0)
cp deploy/install.sh deploy/kitchen-table.service deploy/kiosk.sh "$release/"
cp docs/pi.md "$release/README.md"
# Redistribute the licence and notice files provided in the restored runtime and SQLite packages.
packages=$(dotnet nuget locals global-packages --list | sed 's/^[^:]*: //')
mkdir -p "$release/notices"
for name in microsoft.aspnetcore.app.runtime.linux-arm64 microsoft.netcore.app.runtime.linux-arm64 \
            microsoft.data.sqlite microsoft.data.sqlite.core sqlitepclraw.core sqlitepclraw.lib.e_sqlite3 \
            sqlitepclraw.provider.e_sqlite3 sqlitepclraw.bundle_e_sqlite3; do
  if [[ -d "$packages/$name" ]]; then
    while IFS= read -r -d '' notice; do
      version=$(basename "$(dirname "$notice")")
      cp "$notice" "$release/notices/$name-$version-$(basename "$notice")"
    done < <(find "$packages/$name" -maxdepth 2 -type f \( -iname 'license*' -o -iname '*third*party*' -o -iname 'notice*' \) -print0)
  fi
done
tar -C "$stage" -czf "$stage/KitchenTable-Pi-linux-arm64.tar.gz" KitchenTable-Pi
mv "$stage/KitchenTable-Pi-linux-arm64.tar.gz" artifacts/
echo "Created artifacts/KitchenTable-Pi-linux-arm64.tar.gz"
