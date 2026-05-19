#!/usr/bin/env python3
"""Reset Codex ~/.codex/config.toml to use the built-in OpenAI provider."""

from __future__ import annotations

import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

NON_OPENAI_PROVIDERS = (
    "ollama",
    "lmstudio",
    "amazon-bedrock",
    "azure",
    "openaidr",
    "proxy",
    "local_ollama",
)

OSS_MODEL_HINTS = re.compile(
    r"llama|ollama|mistral|qwen|deepseek|gemma|phi-|codellama",
    re.I,
)


def resolve_config_path() -> Path:
    if len(sys.argv) > 1:
        return Path(sys.argv[1]).expanduser()
    codex_home = os.environ.get("CODEX_HOME")
    if codex_home:
        return Path(codex_home).expanduser() / "config.toml"
    return Path.home() / ".codex" / "config.toml"


def upsert_line(text: str, key: str, value: str) -> str:
    pattern = re.compile(rf"^{re.escape(key)}\s*=.*$", re.M)
    line = f'{key} = "{value}"' if not value.startswith('"') else f"{key} = {value}"
    if pattern.search(text):
        return pattern.sub(line, text, count=1)
    return f"{line}\n{text}"


def comment_line(text: str, key: str, note: str) -> str:
    pattern = re.compile(rf"^({re.escape(key)}\s*=.*)$", re.M)

    def repl(match: re.Match[str]) -> str:
        original = match.group(1)
        if original.strip().startswith("#"):
            return original
        return f"# {original}  # {note}"

    return pattern.sub(repl, text)


def fix_model_provider_lines(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        value = match.group(1).strip().strip('"').strip("'")
        if value == "openai":
            return match.group(0)
        return 'model_provider = "openai"'

    return re.sub(
        r'^model_provider\s*=\s*["\']?([^"\']+)["\']?\s*$',
        repl,
        text,
        flags=re.M,
    )


def fix_model_if_oss(text: str) -> str:
    """Reset any OSS-style model= lines (root and [profiles.*]) to gpt-5.5."""

    def repl_model(match: re.Match[str]) -> str:
        value = match.group(1)
        if OSS_MODEL_HINTS.search(value):
            return 'model = "gpt-5.5"'
        return match.group(0)

    if not re.search(r'^model\s*=', text, re.M):
        return upsert_line(text, "model", "gpt-5.5")
    return re.sub(r'^model\s*=\s*"([^"]+)"', repl_model, text, flags=re.M)


def default_config() -> str:
    return """# Restored to OpenAI (scripts/fix-codex-openai-config.py)
model = "gpt-5.5"
model_provider = "openai"

approval_policy = "on-request"
sandbox_mode = "read-only"
cli_auth_credentials_store = "file"
chatgpt_base_url = "https://chatgpt.com/backend-api/"
"""


def main() -> int:
    config_path = resolve_config_path()
    config_path.parent.mkdir(parents=True, exist_ok=True)

    if config_path.exists():
        backup = config_path.with_name(
            f"config.toml.bak.{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        )
        shutil.copy2(config_path, backup)
        print(f"Backup: {backup}")
        text = config_path.read_text(encoding="utf-8")
    else:
        text = ""
        print(f"No existing config at {config_path}; creating new file.")

    if not text.strip():
        text = default_config()
    else:
        text = fix_model_provider_lines(text)
        text = fix_model_if_oss(text)
        text = comment_line(text, "oss_provider", "disabled for OpenAI")
        text = comment_line(text, "profile", "cleared so root openai settings apply")

        for provider in NON_OPENAI_PROVIDERS:
            if provider == "openai":
                continue
            text = re.sub(
                rf'^(\s*model_provider\s*=\s*["\']?{re.escape(provider)}["\']?\s*)$',
                'model_provider = "openai"',
                text,
                flags=re.M,
            )

        if 'model_provider = "openai"' not in text:
            text = upsert_line(text, "model_provider", "openai")

    config_path.write_text(text, encoding="utf-8")
    print(f"Updated {config_path}")
    print('Codex is set to model_provider = "openai". Restart Codex if it is running.')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
