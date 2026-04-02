#!/usr/bin/env python3
"""
Read docs/features/street-collector/artist-research-sheet.csv and write
content/artist-research-data.json keyed by Shopify-style collection slug.

Slug keys:
- handle derived from Artist Name (same rules as getVendorCollectionHandle)
- any handle found in Sources (Links) as .../collections/HANDLE
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"
OUT_PATH = REPO / "content/artist-research-data.json"

COLLECTION_RE = re.compile(
    r"https?://(?:www\.)?thestreetcollector\.com/collections/([a-z0-9][-a-z0-9]*)",
    re.I,
)


def vendor_handle(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing {CSV_PATH}")

    by_slug: dict[str, dict[str, str]] = {}
    fieldnames = [
        "artistName",
        "location",
        "activeSince",
        "heroHook",
        "storyFullText",
        "aboutPageUrl",
        "additionalHistoryText",
        "pullQuote",
        "impactCallout",
        "exclusiveCallout",
        "processImage1Url",
        "processImage1Label",
        "processImage2Url",
        "processImage2Label",
        "processImage3Url",
        "processImage3Label",
        "processImage4Url",
        "processImage4Label",
        "exhibitionsText",
        "pressText",
        "instagramHandle",
        "instagramPostImageUrls",
        "seasonDropLabels",
        "editionCopy",
        "sourcesLinks",
        "notes",
    ]

    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("Artist Name") or "").strip()
            if not name:
                continue
            out: dict[str, str] = {"artistName": name}
            csv_to_json = [
                ("Location", "location"),
                ("Active Since", "activeSince"),
                ("Hero Hook", "heroHook"),
                ("Story (Full Text)", "storyFullText"),
                ("About Page URL (primary)", "aboutPageUrl"),
                ("Additional History & CV (text)", "additionalHistoryText"),
                ("Pull Quote", "pullQuote"),
                ("Impact Callout", "impactCallout"),
                ("Exclusive Callout", "exclusiveCallout"),
                ("Process Image 1 (URL)", "processImage1Url"),
                ("Process Image 1 Label", "processImage1Label"),
                ("Process Image 2 (URL)", "processImage2Url"),
                ("Process Image 2 Label", "processImage2Label"),
                ("Process Image 3 (URL)", "processImage3Url"),
                ("Process Image 3 Label", "processImage3Label"),
                ("Process Image 4 (URL)", "processImage4Url"),
                ("Process Image 4 Label", "processImage4Label"),
                ("Exhibitions (Text List)", "exhibitionsText"),
                ("Press (Text + Links)", "pressText"),
                ("Instagram Handle", "instagramHandle"),
                ("Instagram Images (URLs)", "instagramPostImageUrls"),
                ("Season / Drop Labels", "seasonDropLabels"),
                ("Edition Copy", "editionCopy"),
                ("Sources (Links)", "sourcesLinks"),
                ("Notes", "notes"),
            ]
            for csv_key, json_key in csv_to_json:
                out[json_key] = (row.get(csv_key) or "").strip()

            slugs: set[str] = set()
            slugs.add(vendor_handle(name))
            src = out.get("sourcesLinks") or ""
            for m in COLLECTION_RE.finditer(src):
                slugs.add(m.group(1).lower())

            for slug in slugs:
                if slug:
                    by_slug[slug] = out

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(by_slug, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(by_slug)} slug keys -> {OUT_PATH}")


if __name__ == "__main__":
    main()
