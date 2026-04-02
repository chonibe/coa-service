#!/usr/bin/env python3
"""
Merge editorial shop bios (heroHook + storyFullText) into content/artist-research-data.json.

Run from repo root: python3 scripts/merge_blog_style_artist_bios.py
Then run: python3 scripts/refine_artist_research_bios_for_shop.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = Path(__file__).resolve().parent
JSON_PATH = REPO / "content" / "artist-research-data.json"

if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))


def main() -> None:
    from editorial_shop_bios_data import SHOP_BIOS_PART1
    from editorial_shop_bios_data_2 import SHOP_BIOS_PART2

    merged = {**SHOP_BIOS_PART1, **SHOP_BIOS_PART2}
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    n = 0
    for slug, fields in merged.items():
        if slug not in data:
            print(f"skip unknown slug: {slug}")
            continue
        row = data[slug]
        for key in ("heroHook", "storyFullText", "activeSince"):
            if key not in fields:
                continue
            val = fields[key]
            if row.get(key) != val:
                row[key] = val
                n += 1
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {JSON_PATH} ({len(merged)} slugs, {n} field writes)")


if __name__ == "__main__":
    main()
