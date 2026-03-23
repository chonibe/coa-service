#!/usr/bin/env bash
# Weekly nudge: open this repo in Cursor and remind to run skill-evolver (agent cannot run unattended).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

MSG='Weekly skill evolution: start a Cursor agent chat, attach skill "skill-evolver", and say: run weekly skill evolution from transcripts.'

if command -v osascript >/dev/null 2>&1; then
  osascript -e "display notification \"$MSG\" with title \"Cursor · skill-evolver\""
fi

if [ -d "/Applications/Cursor.app" ]; then
  open -a Cursor "$REPO_ROOT"
elif [ -d "$HOME/Applications/Cursor.app" ]; then
  open -a Cursor "$REPO_ROOT"
else
  echo "Cursor.app not found in /Applications or ~/Applications; repo: $REPO_ROOT" >&2
fi
