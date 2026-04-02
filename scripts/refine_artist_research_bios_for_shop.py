#!/usr/bin/env python3
"""
Refine Story (Full Text) and Hero Hook in artist research for public shop display.

- Removes internal research / ops sentences and tail paragraphs (verify, confirm, CSV notes).
- Rewrites Street Collector "lamp scale / panel" closers into Street Lamp collector copy.
- Applies slug-specific overrides for stub bios.

Updates:
  - content/artist-research-data.json
  - docs/features/street-collector/artist-research-sheet.csv (Hero Hook + Story columns)

Run from repo root: python3 scripts/refine_artist_research_bios_for_shop.py
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
JSON_PATH = REPO / "content/artist-research-data.json"
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"

COLLECTION_RE = re.compile(
    r"https?://(?:www\.)?thestreetcollector\.com/collections/([a-z0-9][-a-z0-9]*)",
    re.I,
)


def vendor_handle(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


# Full story replacements (slug -> new story)
STORY_OVERRIDES: dict[str, str] = {
    "aviv-shamir": (
        "Aviv Shamir shares work on Instagram @avivos_91. "
        "We will expand this profile when a verified portfolio or interview URL is on file."
    ),
    "refiloe-mnisi": (
        "Refiloe Mnisi posts as @urfavsweatpants. "
        "Use Instagram for the latest work while we connect primary sources for a longer bio."
    ),
    "beto-val": (
        "elbetoval.com blog posts describe surreal digital collage built from vintage scientific illustration sources.\n\n"
        "Press and institutional pages—including Colossal and Rubin Museum listings—add context around his surreal compositions.\n\n"
        "He also posts updates on Threads at @elbetoval."
    ),
    "hen-macabi": (
        "Haaretz reported in 2019 on Hen Macabi as the graphic artist behind artwork for Netta Barzilai’s single Bassa Sababa.\n\n"
        "henmacabi.com catalogs album and poster commissions for Israeli musicians across multiple years.\n\n"
        "Typography-led compositions read cleanly on a Street Lamp edition, where type carries the piece."
    ),
    "igal-talianski": (
        "Shop and print listings describe Igal Talianski as a Haifa-based artist using collage and recycled materials, public as @iigalskii.\n\n"
        "Layered textures and graphic collage read well on a Street Lamp, where small details reward a closer look."
    ),
    "max-diamond": (
        "Max Diamond shares poster and illustration work on Instagram as @maxdiamond52, including pop-culture pieces fans recognize at a glance.\n\n"
        "Bold graphic posters stay readable on a Street Lamp—strong silhouettes and contrast carry at edition scale."
    ),
    "maalavidaa": (
        "maalavidaa.com/about identifies Alycia Rainaud behind Maalavidaa, linking graphic design, digital art, and emotional-health themes, "
        "with a 2018 master’s thesis on psychology in design.\n\n"
        "Vapor95 and Behance spotlights explore her neon, psychology-informed abstract worlds alongside studio and founder work.\n\n"
        "Saturated color fields and emotional narratives stay vivid on a Street Lamp—abstraction still reads at a glance."
    ),
    "psoman": (
        "English-language summaries on Lisbon Street Art Tours (2019) and similar blogs describe Psoman as a Liège-born artist who studied graphic design "
        "and advanced fabrication before focusing on murals.\n\n"
        "Taiwan press (Liberty Times, 2024) documents a large-scale school mural residency.\n\n"
        "Creature-based surrealism and environmental themes show up across mural photos and festival write-ups."
    ),
}

HERO_OVERRIDES: dict[str, str] = {
    "aviv-shamir": "Illustrator Aviv Shamir (@avivos_91)—longer bio pending verified portfolio or interview.",
    "refiloe-mnisi": "Refiloe Mnisi (@urfavsweatpants)—public work on Instagram while we source a fuller story.",
    "beto-val": (
        "Ecuadorian collage artist Beto Val (@elbetoval): surreal pieces from vintage scientific illustration; "
        "elbetoval.com essays trace how practice accelerated in the pandemic years."
    ),
    "max-diamond": (
        "Illustrator Max Diamond (@maxdiamond52): poster work on Instagram; Linktree rounds out public profiles."
    ),
    "my-sunbeam": (
        "London illustrator My Sunbeam (@mysunbeam): playful characters and retro textures in People of Print and GoodMood Prints spotlights."
    ),
}

# Exact paragraph replacements (substring in story)
PARA_SNIPPET_FIXES: list[tuple[str, str]] = [
    (
        "Third-party seller bios (GoodMood Prints, People of Print) describe My Sunbeam as",
        "Print shops and artist directories (GoodMood Prints, People of Print) describe My Sunbeam as",
    ),
    (
        " —a motif described on Street Collector lamp copy.",
        ".",
    ),
    (
        "Representation for inquiries is noted on his about page (e.g., North America / China contacts). Street Collector collection URL should be confirmed on thestreetcollector.com for edition-specific copy.",
        "Representation for inquiries is noted on his about page (e.g., North America and China contacts).",
    ),
]

# Whole closing paragraphs → Street Lamp (exact match after prior fixes)
SC_CLOSERS: list[tuple[str, str]] = [
    (
        "Street Collector fits artists whose graphic language reads clearly at lamp scale: his flat color, strong silhouettes, and restrained palettes translate well to a small, lit surface without losing identity.",
        "On a Street Lamp, his flat color, strong silhouettes, and restrained palettes stay clear—graphic work that keeps its identity when lit.",
    ),
    (
        "Street Collector: high-contrast flat illustration tends to read instantly on a small lamp panel, aligning with the brand’s need for legible, collectible graphics.",
        "High-contrast flat illustration reads fast on a Street Lamp, so editions stay legible as something you live with—not only on a screen.",
    ),
    (
        "Street Collector: her figurative, narrative illustration style gives collectors emotionally readable scenes that still work when scaled to lamp inserts.",
        "Figurative, narrative scenes stay emotionally readable on a Street Lamp—story and detail hold up at edition scale.",
    ),
]

# Last paragraph is internal-only if short and matches
LAST_PARA_TRIG = re.compile(
    r"(?is)verify\s|cross-check|research sheet|should be confirmed|before publication|before publishing|"
    r"before printing|before campaigns|before marketing|before final catalogs|"
    r"display name follows street collector|collection url should be confirmed|"
    r"for street collector, confirm|street collector should confirm|street collector uses spelling|"
    r"leave exhibition and press|prefer future primary|not necessarily permalink|"
    r"indexed instagram search|instagram handle @\S+\s+is used in the street collector|"
    r"align with artist preference|surname matti appears|threads mirrors @|behance uses the handle|"
    r"linkedin aligns on|translate carefully|credit original musicians|confirm legal name|"
    r"confirm city and studio|cross-check scientific|verify mural geography|verify future fair|"
    r"verify hebrew|avoid unverified|use @\S+\s+per |^author databases|treat as provisional|"
    r"instagram linkage:|^exact year-first professional start is not stated|"
    r"^collaboration posts \(e\.g\.|verify guest-city|threads follower counts are self-reported|"
    r"brink representation is mentioned|awards listed include saatchi|verify isbns before|"
    r"verify each mural city|nft-era projects appear|public pages emphasize the studio brand\.$|"
    r"^third-party aggregator thisispublic|use for orientation only and confirm rights|"
    r"^do not infer identity from unrelated|"
    r"^confirm country, medium, and pronouns|^confirm any additional celebrity credits|"
    r"^verify future fair dates|"
    r"^street collector product pages reference his lamp edition context\.?$",
)

DROP_PARA_PREFIXES = (
    "the street collector artist-research",
    "third-party aggregator thisispublic",
    "internal csv ties",
    "automated web search under the exact name",
    "before publishing marketing copy, load",
    "leave exhibition and press lines empty",
    "for street collector, confirm",
    "street collector should confirm",
    "street collector uses spelling",
    "street collector product pages reference",
    "icanvas and street collector list editions",
    "do not confuse with unrelated",
    "display name follows street collector",
    "the street lamp / street collector ecosystem",
    "no single long-form biography url was confirmed",
    "instagram handle @elfassi is used in the street collector",
    "third-party profiles (colossal, rubin museum mentions in commerce copy) should be double-checked",
)

PAREN_VERIFY = re.compile(r"\s*\([^)]*(?:verify|confirm at|confirm on|verify current)[^)]*\)", re.I)

# Drop whole sentences that are ops / research-room voice (matched anywhere in sentence).
INTERNAL_SENTENCE_RES: tuple[re.Pattern[str], ...] = tuple(
    re.compile(p, re.I)
    for p in (
        r"treat lists as self-reported",
        r"verify for live campaigns",
        r"re-check .{0,80}before advertising",
        r"Client name lists on personal sites can change",
        r"useful for exhibition context verification",
        r"treat as third-party marketing copy",
        r"check live listings before naming clients",
        r"research record;\s*we will add",
        r"when a primary URL is confirmed",
        r"we will add a long-form interview",
        r"treat follower counts and self-descriptions as self-reported",
        r"No single authoritative biography URL",
        r"prefer future interviews for education and location",
        r"Confirm licensing before using entertainment IP",
        r"use for medium lists, not for uncredited quotes",
        r"use them for quotes only with attribution",
        r"confirm live roster on her site before ads",
        r"Client/logo walls on personal sites should be refreshed before ads",
        r"treat as self-reported",
        r"useful for pull-quotes only with attribution",
        r"cite dates and titles from primary links when you repeat claims",
        r"verify any brand call-outs",
        r"verify context from the foundation",
        r"suitable for asset auditing",
        r"verify title and curatorial text from museum",
        r"useful for geographic reach verification",
        r"His Instagram includes public /p/ permalinks suitable",
        r"^Use orbarel\.com for official project framing\.?$",
        r"Social video platforms host many SketchBoom shorts;\s*verify any brand",
    )
)


def strip_internal_parentheticals(text: str) -> str:
    prev = None
    while prev != text:
        prev = text
        text = PAREN_VERIFY.sub("", text)
    return text


def drop_paragraphs(paras: list[str]) -> list[str]:
    out: list[str] = []
    for p in paras:
        low = p.strip().lower()
        if any(low.startswith(pref) for pref in DROP_PARA_PREFIXES):
            continue
        out.append(p.strip())
    return out


def strip_trailing_internal_paragraphs(paras: list[str]) -> list[str]:
    while paras:
        last = paras[-1]
        if len(last) > 420:
            break
        if LAST_PARA_TRIG.search(last):
            paras = paras[:-1]
            continue
        break
    return paras


def clean_sentences_in_paragraph(p: str) -> str:
    parts = re.split(r"(?<=[.!?])\s+", p.strip())
    kept: list[str] = []
    for s in parts:
        if not s.strip():
            continue
        low = s.lower()
        if len(s) < 220 and re.search(
            r"verify claims on live shop|good for sku context|not for biography", low
        ):
            continue
        if any(rx.search(s) for rx in INTERNAL_SENTENCE_RES):
            continue
        kept.append(s.strip())
    return " ".join(kept).strip()


def refine_story(text: str) -> str:
    if not text.strip():
        return text
    for old, new in PARA_SNIPPET_FIXES:
        text = text.replace(old, new)
    for old, new in SC_CLOSERS:
        text = text.replace(old, new)
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    paras = drop_paragraphs(paras)
    paras = [strip_internal_parentheticals(clean_sentences_in_paragraph(p)) for p in paras]
    paras = [p for p in paras if p.strip()]
    paras = strip_trailing_internal_paragraphs(paras)
    return "\n\n".join(paras).strip()


def refine_hero(hero: str, slug: str) -> str:
    h = (hero or "").strip()
    low = h.lower()
    if any(
        x in low
        for x in (
            "internal research sheet",
            "search pass",
            "automated search pass",
            "research sheet lists",
            "csv lists",
        )
    ):
        return HERO_OVERRIDES.get(slug, h)
    # Trim trailing ops clauses on hero
    h = re.sub(
        r"\s*[—–-]\s*confirm on primary\.?\s*$",
        "",
        h,
        flags=re.I,
    ).strip()
    h = re.sub(
        r"\s*[—–-]\s*verify on primary[^.]*\.?\s*$",
        "",
        h,
        flags=re.I,
    ).strip()
    h = re.sub(
        r"\s*[—–-]\s*verify legal name on commission contracts\.?\s*$",
        "",
        h,
        flags=re.I,
    ).strip()
    h = re.sub(
        r"\s*[—–-]\s*verify commercial credits separately\.?\s*$",
        "",
        h,
        flags=re.I,
    ).strip()
    return h


def refine_entry(slug: str, row: dict[str, str]) -> tuple[bool, dict[str, str]]:
    changed = False
    out = dict(row)
    if slug in STORY_OVERRIDES:
        new_s = STORY_OVERRIDES[slug]
        if out.get("storyFullText") != new_s:
            out["storyFullText"] = new_s
            changed = True
    else:
        new_s = refine_story(out.get("storyFullText") or "")
        if new_s != (out.get("storyFullText") or "").strip():
            out["storyFullText"] = new_s
            changed = True

    if slug in HERO_OVERRIDES:
        new_h = HERO_OVERRIDES[slug]
        if out.get("heroHook") != new_h:
            out["heroHook"] = new_h
            changed = True
    else:
        new_h = refine_hero(out.get("heroHook") or "", slug)
        if new_h != (out.get("heroHook") or "").strip():
            out["heroHook"] = new_h
            changed = True

    if changed:
        note = out.get("notes") or ""
        tag = (
            "\n\n[Bio refined for shop display 2026-04-21: internal research lines removed or rewritten; "
            "Street Lamp product copy aligned.]"
        )
        if "Bio refined for shop display 2026-04-21" not in note:
            out["notes"] = (note + tag).strip()

    return changed, out


def load_json() -> dict[str, dict[str, str]]:
    return json.loads(JSON_PATH.read_text(encoding="utf-8"))


def save_json(data: dict[str, dict[str, str]]) -> None:
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sync_csv(data: dict[str, dict[str, str]]) -> None:
    if not CSV_PATH.exists():
        print(f"Skip CSV sync: missing {CSV_PATH}")
        return
    rows: list[dict[str, str]] = []
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise SystemExit("CSV has no header")
        for row in reader:
            name = (row.get("Artist Name") or "").strip()
            if not name:
                rows.append(row)
                continue
            slugs: set[str] = {vendor_handle(name)}
            src = (row.get("Sources (Links)") or "").strip()
            for m in COLLECTION_RE.finditer(src):
                slugs.add(m.group(1).lower())
            ref: dict[str, str] | None = None
            for s in slugs:
                if s in data:
                    ref = data[s]
                    break
            if ref:
                row["Hero Hook"] = ref.get("heroHook") or ""
                row["Story (Full Text)"] = ref.get("storyFullText") or ""
                row["Notes"] = ref.get("notes") or ""
            rows.append(row)

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        w.writerows(rows)
    print(f"Synced {len(rows)} CSV rows -> {CSV_PATH}")


def main() -> None:
    data = load_json()
    n_changed = 0
    for slug in sorted(data.keys()):
        ch, new_row = refine_entry(slug, data[slug])
        if ch:
            data[slug] = new_row
            n_changed += 1
    save_json(data)
    print(f"Wrote {JSON_PATH} ({len(data)} slugs, {n_changed} entries updated)")
    sync_csv(data)


if __name__ == "__main__":
    main()
