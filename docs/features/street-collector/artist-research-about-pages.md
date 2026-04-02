# Artist research — about pages, CV, exhibitions & press

**Purpose:** Gather **as much verifiable history as possible** for each Street Collector artist, with **official sites (About / Bio / CV / Press)** as the first stop. This complements the column guide in [`artist-profile-content-spec.md`](./artist-profile-content-spec.md) and the sheet [`artist-research-sheet.csv`](./artist-research-sheet.csv).

**Version:** 1.0.0 · **Last updated:** 2026-04-02

---

## Where to look (in order)

1. **Artist’s own site** — `/about`, `/bio`, `/cv`, `/info`, footer “About”, sometimes localized duplicates (`/en/about`).
2. **Representation** — gallery “Artists” page often repeats CV lines and correct spellings for show titles.
3. **Press / News / Media** pages on the same domain — links to articles (use for **Press** rows).
4. **Behance / Dribbble “About”** — employment timeline, tools, sometimes exhibition blurbs (verify dates on a primary source when possible).
5. **Instagram bio + pinned highlights** — leads only; capture permalinks in **Sources**, not as facts without corroboration.
6. **Third-party interviews** — use for quotes and dates; still log URLs under **Sources (Links)**.

Always prefer **primary** (artist or gallery) over aggregators; when only an aggregator exists, label uncertainty in **Notes**.

---

## Sheet columns (what goes where)

| Column | Use |
|--------|-----|
| **About Page URL (primary)** | One canonical URL you used first (usually the main About or Bio page). Helps the next researcher reopen the same source. |
| **Story (Full Text)** | Narrative bio for collectors: place, practice, voice, why they fit Street Collector. Written prose—not a raw CV dump. |
| **Additional History & CV (text)** | **Dense factual capture** from About/CV: education, studio founded, representation changes, residencies, awards, long employment arcs, “selected” lists that you have not yet turned into dated exhibition lines. Plain text or short bullets; separate blocks with blank lines. This block is **appended to the shop bio** when Shopify/Supabase bio is empty (after Story). |
| **Exhibitions (Text List)** | One line per item, **newest first** if you can, parser-friendly: `YYYY — Type, Title, Venue, City` (see spec). Pull every dated show, fair booth, mural commission, residency exhibition you can verify from CV/About. |
| **Press (Text + Links)** | One line per item: `Outlet — YYYY — Short quote or label — URL` (see merge rules in repo). |
| **Sources (Links)** | Every URL you relied on (About, CV PDF, gallery page, articles). Include `https://www.thestreetcollector.com/collections/{handle}` when known. |

---

## Mining an About page (checklist)

Copy notes into **Additional History** or straight into **Story** / **Exhibitions** / **Press** as appropriate.

- [ ] **Name / spelling / city** as they publish it  
- [ ] **Education** (school, city, degree year)  
- [ ] **Year or phrase for “active since”** (first degree show, first studio, first mural, etc.)  
- [ ] **Representation** (gallery, agent, territories)  
- [ ] **Solo / group / fair / mural / residency** lines with **year + title + venue + city/country**  
- [ ] **Awards, grants, residencies** (with year)  
- [ ] **Press logos or “As seen in”** → follow links; add to **Press** with real quotes or accurate paraphrase + URL  
- [ ] **Client lists** — optional for Story; mark “self-reported” in Notes if used in marketing copy  

---

## Formats that merge cleanly into the shop UI

**Exhibitions (Text List)** — examples:

```text
2024 — Solo, The Wall Was There First, Galerie Eigenheim, Berlin, Berlin, DE
2023 — Group, Street + Screen, Somerset House, London, UK
2022 — Mural, District commission, Lichtenberg Council, Berlin, DE
```

Simpler research lines still work:

```text
2022 — Group exhibition, Taiwan (confirmed Mar 2022 interview)
```

**Press (Text + Links)** — examples:

```text
LM magazine — 2022 — Interview on Annecy practice and upcoming Asia shows — https://example.com/article
```

---

## Implementation references

| Piece | Path |
|--------|------|
| CSV → JSON | `scripts/csv_to_artist_research_json.py` |
| JSON merge into CSV batches | `scripts/merge_artist_research_to_csv.py` |
| Bio + profile merge (incl. `additionalHistoryText`) | `lib/shop/artist-research-merge.ts` |
| Regenerate `content/artist-research-data.json` | `npm run research:json` |

---

## Testing

- [ ] After editing the CSV, run `npm run research:json` and confirm the artist’s slug in `content/artist-research-data.json` includes `aboutPageUrl`, `additionalHistoryText`, `exhibitionsText`, `pressText` as expected.  
- [ ] Spot-check `/shop/artists/{slug}`: Overview story length, Exhibitions & Press tab, Sources in internal docs only.  

---

## Known limitations

- Instagram post URLs are handled as **embeds** or links in the profile UI, not as raw `<img src>` without oEmbed.  
- Very long **Additional History** blocks make the Overview long; prefer moving dated lines into **Exhibitions** and keeping History for non-show facts.  

---

## Future improvements

- Optional structured JSON column for exhibitions/press (less parsing ambiguity).  
- Automated “diff” when About URL changes (scheduled check).  
