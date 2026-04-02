#!/usr/bin/env python3
"""
One-time / idempotent: insert About Page + Additional History columns after
"Story (Full Text)" in docs/features/street-collector/artist-research-sheet.csv.
"""
from __future__ import annotations

import csv
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"
ANCHOR = "Story (Full Text)"
NEW_COLS = [
    "About Page URL (primary)",
    "Additional History & CV (text)",
]


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing {CSV_PATH}")
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fields = list(reader.fieldnames or [])
        if NEW_COLS[0] in fields:
            print("CSV already has About / History columns; skipping.")
            return
        if ANCHOR not in fields:
            raise SystemExit(f"Anchor column {ANCHOR!r} not in CSV headers")
        i = fields.index(ANCHOR) + 1
        new_fields = fields[:i] + NEW_COLS + fields[i:]
        rows = list(reader)

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=new_fields)
        w.writeheader()
        for row in rows:
            out = {k: (row.get(k) or "").strip() if isinstance(row.get(k), str) else row.get(k) or "" for k in new_fields}
            for c in NEW_COLS:
                out.setdefault(c, "")
            w.writerow(out)

    print(f"Inserted {NEW_COLS} after {ANCHOR!r} ({len(rows)} rows)")


if __name__ == "__main__":
    main()
