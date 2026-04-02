#!/usr/bin/env python3
"""
Merge docs/dev/artist-web-enrichment-*.json into artist-research-sheet.csv by Artist Name.

Rules:
- Fills empty About / Additional History / Exhibitions / Press, or appends with blank lines if
  field already has content and new content is non-empty (exhibitions/press/history only).
- Never removes existing non-empty cells.
- Optional image keys (fill only empty CSV cells): `processImageUrls` (array), `processImage1Url`…`processImage4Url`,
  matching labels, `instagramPostImageUrls` (string or array of direct URLs).

Usage:
  python3 scripts/apply_artist_enrichment_json_to_csv.py docs/dev/artist-web-enrichment-2026-04-02.json
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"

MAP = {
    "aboutPageUrl": "About Page URL (primary)",
    "additionalHistoryText": "Additional History & CV (text)",
    "exhibitionsText": "Exhibitions (Text List)",
    "pressText": "Press (Text + Links)",
}

PROCESS_URL_KEYS = [
    ("processImage1Url", "Process Image 1 (URL)"),
    ("processImage2Url", "Process Image 2 (URL)"),
    ("processImage3Url", "Process Image 3 (URL)"),
    ("processImage4Url", "Process Image 4 (URL)"),
]
PROCESS_LABEL_KEYS = [
    ("processImage1Label", "Process Image 1 Label"),
    ("processImage2Label", "Process Image 2 Label"),
    ("processImage3Label", "Process Image 3 Label"),
    ("processImage4Label", "Process Image 4 Label"),
]


def merge_cell(old: str, new: str, append: bool) -> str:
    o = (old or "").strip()
    n = (new or "").strip()
    if not n:
        return o
    if not o:
        return n
    if n.lower() in o.lower():
        return o
    if append:
        return f"{o}\n\n{n}".strip()
    return o


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: apply_artist_enrichment_json_to_csv.py <enrichment.json>")
    path = Path(sys.argv[1])
    if not path.is_absolute():
        path = REPO / path
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise SystemExit("JSON root must be object keyed by artist name")

    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    stamp = f"Manual web enrichment applied from {path.name} (verify facts)."
    touched = 0
    for row in rows:
        name = (row.get("Artist Name") or "").strip()
        patch = data.get(name)
        if not isinstance(patch, dict):
            continue
        changed = False
        for json_key, csv_col in MAP.items():
            if json_key not in patch:
                continue
            val = patch[json_key]
            if val is None or (isinstance(val, str) and not val.strip()):
                continue
            if not isinstance(val, str):
                val = str(val)
            append = json_key in ("exhibitionsText", "pressText", "additionalHistoryText")
            if json_key == "aboutPageUrl":
                if not (row.get(csv_col) or "").strip():
                    row[csv_col] = val.strip()
                    changed = True
            else:
                new_v = merge_cell(row.get(csv_col) or "", val, append=append)
                if new_v != (row.get(csv_col) or "").strip():
                    row[csv_col] = new_v
                    changed = True

        # Optional: processImageUrls: ["https://...", ...] fills empty Process Image 1–4
        purls = patch.get("processImageUrls")
        if isinstance(purls, list):
            for i, (_, csv_u) in enumerate(PROCESS_URL_KEYS):
                if i >= len(purls):
                    break
                u = str(purls[i]).strip()
                if not u:
                    continue
                if not (row.get(csv_u) or "").strip():
                    row[csv_u] = u
                    changed = True
        for json_key, csv_col in PROCESS_URL_KEYS:
            if json_key not in patch:
                continue
            u = (patch[json_key] or "").strip() if isinstance(patch[json_key], str) else str(patch[json_key]).strip()
            if not u:
                continue
            if not (row.get(csv_col) or "").strip():
                row[csv_col] = u
                changed = True
        for json_key, csv_col in PROCESS_LABEL_KEYS:
            if json_key not in patch:
                continue
            lab = (patch[json_key] or "").strip() if isinstance(patch[json_key], str) else str(patch[json_key]).strip()
            if not lab:
                continue
            if not (row.get(csv_col) or "").strip():
                row[csv_col] = lab
                changed = True

        if "instagramPostImageUrls" in patch:
            raw_ig = patch["instagramPostImageUrls"]
            if isinstance(raw_ig, list):
                ig_val = "\n".join(str(x).strip() for x in raw_ig if str(x).strip())
            elif isinstance(raw_ig, str):
                ig_val = raw_ig.strip()
            else:
                ig_val = str(raw_ig).strip()
            if ig_val and not (row.get("Instagram Images (URLs)") or "").strip():
                row["Instagram Images (URLs)"] = ig_val
                changed = True
        if changed:
            n = (row.get("Notes") or "").strip()
            row["Notes"] = f"{n}\n{stamp}".strip() if n else stamp
            touched += 1

    print(f"Patched {touched} artists from {path}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    main()
