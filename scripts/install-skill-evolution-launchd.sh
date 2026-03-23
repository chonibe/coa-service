#!/usr/bin/env bash
# Installs a weekly LaunchAgent (Monday 09:00).
# Usage:
#   ./scripts/install-skill-evolution-launchd.sh           — notify + open Cursor (manual agent step)
#   ./scripts/install-skill-evolution-launchd.sh automated — headless Anthropic run (see ~/.config/... env file)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MODE="${1:-reminder}"

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$HOME/.config/coa-service"

if [[ "$MODE" == "automated" ]]; then
  LABEL="com.coa-service.skill-evolution-automated"
  RUNNER="$REPO_ROOT/scripts/skill-evolution-launchd-automated.sh"
  chmod +x "$RUNNER"
  launchctl bootout "gui/$(id -u)/com.coa-service.skill-evolution-weekly" 2>/dev/null || true
  rm -f "$HOME/Library/LaunchAgents/com.coa-service.skill-evolution-weekly.plist"
else
  LABEL="com.coa-service.skill-evolution-weekly"
  RUNNER="$REPO_ROOT/scripts/skill-evolution-weekly-reminder.sh"
  launchctl bootout "gui/$(id -u)/com.coa-service.skill-evolution-automated" 2>/dev/null || true
  rm -f "$HOME/Library/LaunchAgents/com.coa-service.skill-evolution-automated.plist"
fi

if [[ "$MODE" != "automated" && "$MODE" != "reminder" ]]; then
  echo "Usage: $0 [reminder|automated]" >&2
  exit 1
fi

if [[ "$MODE" == "reminder" ]]; then
  if [ ! -x "$RUNNER" ]; then
    chmod +x "$RUNNER"
  fi
fi

PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
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
    <string>${RUNNER}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${REPO_ROOT}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
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
if [[ "$MODE" == "automated" ]]; then
  echo "Monday 09:00 — runs: node scripts/run-skill-evolution-automated.mjs"
  echo "Put ANTHROPIC_API_KEY=... in ${HOME}/.config/coa-service/skill-evolution.env (chmod 600)."
  echo "Default: writes changelog + proposed/ under docs/dev/skill-evolution/run-DATE/ ; live apply needs SKILL_EVOLUTION_APPLY=1 in that env file."
else
  echo "Monday 09:00 — notification + open Cursor to: ${REPO_ROOT}"
fi
echo "Unload: launchctl bootout gui/$(id -u)/${LABEL}"
