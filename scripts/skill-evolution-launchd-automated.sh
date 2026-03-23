#!/usr/bin/env bash
# LaunchAgent entry: load API key from ~/.config/coa-service/skill-evolution.env, then run headless evolver.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${HOME}/.config/coa-service/skill-evolution.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${PATH}"
cd "$REPO_ROOT"
exec node "$REPO_ROOT/scripts/run-skill-evolution-automated.mjs"
