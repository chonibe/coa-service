#!/usr/bin/env bash
# Installs a weekly LaunchAgent (Monday 09:00) that notifies and opens this repo in Cursor.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REMINDER="$REPO_ROOT/scripts/skill-evolution-weekly-reminder.sh"
LABEL="com.coa-service.skill-evolution-weekly"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"

if [ ! -x "$REMINDER" ]; then
  chmod +x "$REMINDER"
fi

mkdir -p "$HOME/Library/LaunchAgents"

# Unload existing job if present
launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
rm -f "$PLIST"

cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${REMINDER}</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key>
    <integer>1</integer>
    <key>Hour</key>
    <integer>9</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${TMPDIR:-/tmp}/skill-evolution-launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>${TMPDIR:-/tmp}/skill-evolution-launchd.err.log</string>
</dict>
</plist>
EOF

chmod 644 "$PLIST"
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Installed ${PLIST}"
echo "Runs every Monday at 09:00 — notification + open Cursor to: ${REPO_ROOT}"
echo "Unload: launchctl bootout gui/$(id -u)/${LABEL}"
