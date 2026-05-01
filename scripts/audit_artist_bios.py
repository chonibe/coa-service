#!/usr/bin/env python3
"""Audit public artist bios for editorial structure and unwanted shop/research voice."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
JSON_PATH = REPO / "content" / "artist-research-data.json"

THIN_SOURCE_SLUGS = {
    "s-a-r-g-o-n",
    "igor-mikutski",
    "jake-ac-art",
    "ollie-smither",
    "vivaladybug",
}

SALES_RE = re.compile(
    r"\b(Street Collector|Street Lamp|Works tab|collectors?|collect|editions?|prints?|shop|limited)\b",
    re.I,
)
RESEARCH_RE = re.compile(
    r"\b(verify|source|sources|according|profile lists|site lists|search result|indexed search|Behance Sign In|auto-extracted|as fetched|returned HTTP|primary CV|artist listing)\b",
    re.I,
)
FILLER_RE = re.compile(
    r"(with .* close to the work|without turning the place into a postcard|The current stays interesting|"
    r"The appeal is in the consistency|What makes the work hold|The strongest pieces hold both distances)",
    re.I,
)


def word_count(text: str) -> int:
    return len(re.findall(r"\S+", text or ""))


def main() -> None:
    data: dict[str, dict[str, str]] = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    failures: list[str] = []

    for slug, row in data.items():
        story = (row.get("storyFullText") or "").strip()
        paras = [p.strip() for p in re.split(r"\n{2,}", story) if p.strip()]
        wc = word_count(story)
        artist = row.get("artistName") or slug

        if not story:
            failures.append(f"{slug}: missing storyFullText")
            continue
        if len(paras) < 3:
            failures.append(f"{slug}: expected at least 3 paragraphs, found {len(paras)}")
        if slug not in THIN_SOURCE_SLUGS and wc < 120:
            failures.append(f"{slug}: expected at least 120 words, found {wc}")
        if SALES_RE.search(story):
            failures.append(f"{slug}: contains sales/shop language")
        if RESEARCH_RE.search(story):
            failures.append(f"{slug}: contains research-note language")
        if FILLER_RE.search(story):
            failures.append(f"{slug}: contains generic filler phrasing")
        if word_count(row.get("heroHook") or "") < 8:
            failures.append(f"{slug}: heroHook too short for {artist}")

    if failures:
        print("Artist bio audit failed:")
        for item in failures:
            print(f" - {item}")
        sys.exit(1)

    print(f"Artist bio audit passed for {len(data)} artists.")


if __name__ == "__main__":
    main()
