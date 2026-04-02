#!/usr/bin/env python3
"""
Merge docs/dev/artist-research-*.json batches into docs/features/street-collector/artist-research-sheet.csv.

Preserves existing CSV rows for Jerome Masi, Moritz Adam Schmitt, Loreta Isac (first research pass).
Later JSON files override earlier keys on name collision.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DEV = REPO / "docs/dev"
OUT_CSV = REPO / "docs/features/street-collector/artist-research-sheet.csv"

JSON_FILES = [
    DEV / "artist-research-04-21-rich.json",
    DEV / "artist-research-22-37.json",
    DEV / "artist-research-38-52.json",
    DEV / "artist-research-53-68.json",
    DEV / "artist-research-69-84.json",
]

PRESERVE_FIRST_THREE = {"Jerome Masi", "Moritz Adam Schmitt", "Loreta Isac"}

HEADERS = [
    "Artist Name",
    "Status",
    "Researcher",
    "Hero Hook",
    "Location",
    "Active Since",
    "Story (Full Text)",
    "Pull Quote",
    "Impact Callout",
    "Exclusive Callout",
    "Process Image 1 (URL)",
    "Process Image 1 Label",
    "Process Image 2 (URL)",
    "Process Image 2 Label",
    "Process Image 3 (URL)",
    "Process Image 3 Label",
    "Process Image 4 (URL)",
    "Process Image 4 Label",
    "Exhibitions (Text List)",
    "Press (Text + Links)",
    "Instagram Handle",
    "Instagram Images (URLs)",
    "Season / Drop Labels",
    "Edition Copy",
    "Sources (Links)",
    "Notes",
]


def _s(v: object) -> str:
    if v is None:
        return ""
    if isinstance(v, list):
        return "\n".join(_s(x) for x in v)
    if isinstance(v, dict):
        return json.dumps(v, ensure_ascii=False)
    return str(v)


def load_merged() -> dict[str, dict]:
    merged: dict[str, dict] = {}
    for path in JSON_FILES:
        if not path.exists():
            raise FileNotFoundError(path)
        data = json.loads(path.read_text(encoding="utf-8"))
        for name, rec in data.items():
            if not isinstance(rec, dict):
                continue
            merged[name] = {k: _s(rec.get(k, "")) for k in rec}
    return merged


def research_row(name: str, d: dict[str, str]) -> list[str]:
    return [
        name,
        "Research pass — review",
        "Cursor agent (web research batches)",
        d.get("heroHook", ""),
        d.get("location", ""),
        d.get("activeSince", ""),
        d.get("storyFullText", ""),
        d.get("pullQuote", ""),
        d.get("impactCallout", ""),
        d.get("exclusiveCallout", ""),
        d.get("processImage1Url", ""),
        d.get("processImage1Label", ""),
        d.get("processImage2Url", ""),
        d.get("processImage2Label", ""),
        d.get("processImage3Url", ""),
        d.get("processImage3Label", ""),
        d.get("processImage4Url", ""),
        d.get("processImage4Label", ""),
        d.get("exhibitionsText", ""),
        d.get("pressText", ""),
        d.get("instagramHandle", ""),
        d.get("instagramPostImageUrls", ""),
        d.get("seasonDropLabels", ""),
        d.get("editionCopy", ""),
        d.get("sourcesLinks", ""),
        d.get("notes", ""),
    ]


def main() -> None:
    merged = load_merged()
    existing: dict[str, list[str]] = {}
    order: list[str] = []

    if OUT_CSV.exists():
        with OUT_CSV.open(newline="", encoding="utf-8") as f:
            r = csv.reader(f)
            hdr = next(r)
            if hdr != HEADERS:
                raise SystemExit(f"CSV header mismatch; expected {HEADERS!r}, got {hdr!r}")
            for row in r:
                if not row:
                    continue
                order.append(row[0])
                existing[row[0]] = row

    if len(order) != 84:
        raise SystemExit(f"Expected 84 artists in CSV, got {len(order)}")

    out_rows: list[list[str]] = []
    for name in order:
        if name in PRESERVE_FIRST_THREE and name in existing:
            out_rows.append(existing[name])
            continue
        rec = merged.get(name)
        if not rec:
            raise SystemExit(f"Missing research JSON for artist: {name!r}")
        out_rows.append(research_row(name, rec))

    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(HEADERS)
        w.writerows(out_rows)

    print(f"Wrote {OUT_CSV} ({len(out_rows)} rows)")


if __name__ == "__main__":
    main()
