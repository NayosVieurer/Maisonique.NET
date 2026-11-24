# Run Kitchen Table on a Raspberry Pi

The release targets a Pi 4 or Pi 5 running 64-bit Raspberry Pi OS. A headless installation serves phones and tablets. Install the desktop edition if the Pi drives a touchscreen or monitor. The release includes the ARM64 .NET runtime, bundled SQLite library, web assets and fonts. The OS supplies its usual native libraries, time-zone data, systemd and curl. [Microsoft's Debian dependencies](https://learn.microsoft.com/en-us/dotnet/core/install/linux-debian)

## Install

Copy `KitchenTable-Pi-linux-arm64.tar.gz` to the Pi. These commands run **on the Pi**, in the directory containing the download.

```sh
uname -m
getconf LONG_BIT
tar -xzf KitchenTable-Pi-linux-arm64.tar.gz
cd KitchenTable-Pi
sudo bash install.sh
```

The expected architecture is `aarch64` and the word size is `64`. The installer starts a service listening on port **5080** on the home network. Any device that can reach it can read and change the household. Keep the port on trusted home Wi-Fi and leave router port forwarding disabled.

Open **http://127.0.0.1:5080** on the Pi. From a phone on the same network, open **http://kitchen-table.local:5080** if the Pi's hostname is `kitchen-table`. Otherwise substitute its actual hostname or its LAN address. `hostname -I` on the Pi displays its addresses. A browser on iOS or Android requires no app installation.

## Start the kitchen display at login

From the Pi desktop terminal, launch the kiosk once to check it.

```sh
/opt/kitchen-table/current/kiosk.sh
```

For a Raspberry Pi OS desktop using labwc, add the following line to the desktop user's `~/.config/labwc/autostart`, preserving any existing entries. Create the directory and file if needed. Enable desktop autologin if the screen should start unattended after power-up. The launcher waits for the local API and opens a separate Chromium profile. [Raspberry Pi kiosk guide](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)

```sh
/opt/kitchen-table/current/kiosk.sh &
```

## Configuration and diagnosis

| Setting | Default after installation |
| --- | --- |
| `ASPNETCORE_URLS` | `http://0.0.0.0:5080` |
| `KitchenTable__TimeZone` | `Europe/London` |
| `KitchenTable__DatabasePath` | `/var/lib/kitchen-table/kitchen-table.db` |
| Application files | The build linked from `/opt/kitchen-table/current` |

Use `sudo systemctl edit kitchen-table` for local service overrides. For example, choose a different IANA time zone with a drop-in as shown below, then run `sudo systemctl restart kitchen-table`. Stored appointment times are household wall times.

```ini
[Service]
Environment=KitchenTable__TimeZone=Europe/Paris
```

```sh
systemctl status kitchen-table
journalctl -u kitchen-table -n 60 --no-pager
curl http://127.0.0.1:5080/api/health
```

If the Pi screen works but a phone cannot connect, check the LAN address and that both devices are on a network which allows peer connections. Guest Wi-Fi can isolate devices. The service starts independently of Chromium.

## Back up and restore

Install the SQLite CLI with `sudo apt install sqlite3` if needed. The following creates a consistent online backup of the running database. Choose a fresh destination each time and keep a copy on another device. [SQLite backup API](https://www.sqlite.org/backup.html)

```sh
backup="$PWD/kitchen-table-$(date +%Y%m%d-%H%M%S).db"
sudo sqlite3 /var/lib/kitchen-table/kitchen-table.db ".backup '$backup'"
sudo sqlite3 "$backup" 'PRAGMA integrity_check;'
```

A healthy backup returns `ok`. To restore a backup, point the variable below to its absolute path. This checks the backup, stops the service, saves a second copy of the pre-restore household and uses SQLite to restore into the existing database. Use a path without a single quote for the CLI example.

```sh
# Set this to an existing backup before running the block.
backup=/absolute/path/to/kitchen-table-backup.db
(
  set -eu
  test -f "$backup"
  test "$(sudo sqlite3 -readonly "$backup" 'PRAGMA integrity_check;')" = ok
  test "$(sudo sqlite3 -readonly "$backup" "SELECT count(*) FROM schema_versions;")" -ge 1
  live=/var/lib/kitchen-table/kitchen-table.db
  rescue=$(sudo mktemp -d /var/lib/kitchen-table/before-restore-XXXXXXXX)
  sudo systemctl stop kitchen-table
  trap 'sudo systemctl start kitchen-table' EXIT
  sudo sqlite3 "$live" ".backup '$rescue/previous.db'"
  sudo sqlite3 "$live" ".restore '$backup'"
)
```

## Update

Make a database backup. Extract the new release in a fresh directory and run its `install.sh`. Each installation creates a separate build under `/opt/kitchen-table/releases` and switches the `current` link after copying the build. The service opens the existing SQLite file and applies pending migrations. Keep the matching application release with backups when changing schema versions.
