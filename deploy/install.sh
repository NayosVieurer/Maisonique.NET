#!/usr/bin/env bash
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
if [[ $(id -u) != 0 ]]; then echo "Run sudo ./install.sh from the extracted Pi release." >&2; exit 1; fi
if [[ $(uname -m) != aarch64 || $(getconf LONG_BIT) != 64 ]]; then
  echo "This release requires 64-bit Raspberry Pi OS on ARM64." >&2; exit 1
fi
if [[ ! -x "$here/app/KitchenTable" ]]; then echo "Extract the .tar.gz release before installing." >&2; exit 1; fi
target=/opt/kitchen-table
install -d -m 0755 "$target/releases"
release=$(mktemp -d "$target/releases/build-XXXXXXXX")
cp -a "$here/app/." "$release/"
install -m 0755 "$here/kiosk.sh" "$release/kiosk.sh"
if [[ -d "$here/notices" ]]; then cp -a "$here/notices" "$release/"; fi
chown -R root:root "$release"
chmod -R go-w "$release"
chmod 0755 "$release"
# Install the complete build before switching the running service to its new directory.
ln -s "$release" "$release.next"
mv -Tf "$release.next" "$target/current"
install -m 0644 "$here/kitchen-table.service" /etc/systemd/system/kitchen-table.service
systemctl daemon-reload
systemctl enable kitchen-table.service
systemctl restart kitchen-table.service
for attempt in {1..25}; do
  if curl -fsS --max-time 2 http://127.0.0.1:5080/api/health >/dev/null 2>&1; then
    echo "Kitchen Table is running at http://127.0.0.1:5080"
    exit 0
  fi
  sleep 1
done
echo "The service did not report ready. Run journalctl -u kitchen-table -n 60 to inspect startup." >&2
exit 1
