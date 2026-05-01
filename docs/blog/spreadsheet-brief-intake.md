# Spreadsheet Brief Intake

Updated: May 1, 2026

Source files:
- [SC_200_Blog_Briefs.xlsx](C:/Users/choni/Downloads/SC_200_Blog_Briefs.xlsx)
- [SC_Blog_Articles_by_City.xlsx](C:/Users/choni/Downloads/SC_Blog_Articles_by_City.xlsx)

## What these files contain

### 1. `SC_200_Blog_Briefs.xlsx`
Primary sheet: `200 Blog Briefs`

Columns:
- `#`
- `Title`
- `Category`
- `Angle`
- `Target Keyword`
- `CTA`
- `Inspired By`
- `Status`
- `Priority`
- `Notes`

Row count: `200`

Category mix:
- `Education`: 79
- `Roundup`: 52
- `Opinion`: 22
- `Trend`: 16
- `Market`: 11
- `Brand Story`: 8
- `Artist Spotlight`: 3
- `Interview`: 3
- `Seasonal`: 2
- `Data`: 2
- `Meta`: 2

Notes:
- Every row is still marked `To Do`
- `Priority` is currently blank throughout
- This is effectively the backlog of future blog formats, topics, and search-intent targets

### 2. `SC_Blog_Articles_by_City.xlsx`
Primary sheet: `All Articles by Blog`

Columns:
- `#`
- `City`
- `Blog / Platform`
- `Article / Content Title`
- `URL`
- `Content Type`
- `SC Pitch Angle`

Row count: `66`

City mix:
- `Tel Aviv`: 14
- `Berlin`: 10
- `London`: 8
- `Paris`: 8
- `Buenos Aires`: 8
- `Global`: 8
- `Netherlands`: 5
- `Stuttgart`: 5

Content-type mix is broad, with strong representation from:
- opinion / editorial
- feature
- artist profile
- news
- mural news
- interview
- festival coverage
- exhibition
- guide
- print culture

Notes:
- This file is the strongest evidence that the blog should not use one article shape.
- It already points toward city-specific editorial structures and competitive content formats.

## How to use these in the blog rewrite

### Format mapping
The brief backlog supports multiple article structures, not a single generic template:

- `Education` -> `Checklist`, `Collector Guide`, `How It Works`
- `Roundup` -> `Roundup`, `Watchlist`, `Best Of`
- `Opinion` -> `Editorial`, `Point of View`, `Debate Piece`
- `Trend` -> `Trend Watch`, `What We’re Seeing`, `Scene Shift`
- `Market` -> `Market Note`, `Collector Brief`, `Pricing Explainer`
- `Artist Spotlight` -> `Profile`, `Studio Visit`, `Collector Reading`
- `Interview` -> `Q&A`, `Conversation`, `Field Interview`
- `Brand Story` -> `Founder Note`, `Behind the Scenes`, `Why We Made This`

### Immediate editorial implications
- The current system should stop flattening everything into “guide” behavior.
- City pages should borrow from the city map and lean into:
  - field guide
  - walkthrough
  - editorial reaction
  - scene report
  - interview
- Artist pages should split across:
  - profile
  - studio visit
  - collector walkthrough
  - graphic-language reading

### Recommended next import order
1. Use the `Education` briefs to improve collector-guide and checklist content.
2. Use the `Roundup` briefs to improve list-based and watchlist posts.
3. Use the city workbook to build city-specific article families for:
   - Tel Aviv
   - Berlin
   - London
   - Paris
   - Buenos Aires
4. Use the smaller `Interview`, `Artist Spotlight`, and `Brand Story` groups to introduce more human, voice-led article shapes.

## Suggested next implementation pass
- Add `interview` and `editorial` as explicit article formats in the content model.
- Start importing the spreadsheet backlog into a repo-native source file for structured editorial planning.
- Use the city workbook to seed a proper `City Field Guides` cluster rather than keeping Tel Aviv as the only developed lane.
