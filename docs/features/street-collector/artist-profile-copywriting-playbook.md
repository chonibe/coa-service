# Street Collector — Artist bios & profile copy (copywriting playbook)

**Audience:** human writers, editors, researchers, and **AI agents** drafting or merging artist content for the shop.

**Use this doc for:** voice, structure, conversion logic, and quality gates. For metafields and CSV columns, still follow [`artist-profile-content-spec.md`](./artist-profile-content-spec.md). For a writer-facing worksheet, use [`artist-profile-content-creator-brief.md`](./artist-profile-content-creator-brief.md).

**Implementation (where copy lands in the product):**

| Surface | Primary code / data |
|--------|----------------------|
| Artist profile UI | [`app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx`](../../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) |
| Profile fetch & merge | [`lib/shop/artist-profile-api.ts`](../../../lib/shop/artist-profile-api.ts), [`lib/shop/artist-research-merge.ts`](../../../lib/shop/artist-research-merge.ts) |
| Explore / list cards | [`lib/shop/artists-list.ts`](../../../lib/shop/artists-list.ts) (short bio where shown) |

**Shop UI copy (empty states, headings, CTAs—not artist-supplied bios):** [`ArtistProfilePageClient.tsx`](../../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx), [`ExploreArtistsClient.tsx`](../../../app/(store)/shop/explore-artists/components/ExploreArtistsClient.tsx), metadata in [`explore-artists/page.tsx`](../../../app/(store)/shop/explore-artists/page.tsx). Align edits with §1–§3 when you change on-page strings.

**Testing / QA:** Merge behavior (collection description + research body) is covered by [`lib/shop/artist-research-merge.test.ts`](../../../lib/shop/artist-research-merge.test.ts). Use the checklist in **§7** for copy self-review; humans should spot-check the live profile (`/shop/artists/[slug]`) and explore cards after publish.

**Version:** 1.5.0 · **Last updated:** 2026-04-02

---

## 1. Page job (conversion frame)

**Primary action we want:** a visitor moves from *curious* to *ready to collect*—opening the Works tab, viewing editions, or starting the lamp / checkout flow.

**Product truth:** Editions are experienced on the **Street Lamp** (illuminated display), not as framed “wall art.” Keep **wall / street** language for *where artists paint* (murals, alleys, practice); aim **lamp / Street Lamp** at *where collectors live with the work*.

**Reader mindset:** they are buying **limited art tied to a real practice**, not a generic print shop. Copy should reduce doubt (“Who is this?”, “Is this real?”, “Why here?”) and increase desire (“I get what they do”, “This fits my wall / story”).

**Principles (non-negotiable):**

- **Clarity over cleverness.** If a line needs explaining, cut or rewrite it.
- **Specificity over adjectives.** Places, years, materials, neighborhoods, and one vivid scene beat “passionate,” “unique,” “world-renowned.”
- **Honesty over hype.** No invented shows, quotes, charity claims, or “sold out everywhere” unless verified.
- **Benefits over label-stuffing.** Connect practice to *what the collector experiences* (presence of hand, place, story on the wall)—without sounding like a catalog of adjectives.

---

## 2. Voice & tone (Street Collector artist pages)

| Dimension | Guidance |
|-----------|----------|
| **Formality** | Confident, adult, gallery-adjacent but plain English—no academic throat-clearing. |
| **Person** | Third person for bios (“they,” “their work”). Quotes can be first person inside quotation marks. |
| **Rhythm** | Short paragraphs (2–5 sentences). One idea per paragraph. |
| **Sensory detail** | Light touch: wall texture, city light, night work, studio mess—only if true and sourced. |
| **Collectors** | Speak to intelligence. Never condescend; don’t over-explain medium basics unless the artist’s hook is educational. |

**Words and phrases to avoid (unless inside a direct quote):**

passionate, unique, world-renowned, visionary, iconic, amazing, incredible, pushing boundaries, speaks to, journey (as cliché), hustle culture, “storyteller” without a story, “vibrant” with no visual fact.

**Prefer:** named places, dates, mediums, collaborators, commissioners, and short verbs (paints, cuts, pastes, builds, returns to).

### 2.1 Editorial voice vs research-room voice

Artist bios on the shop should read like **short magazine features**—confident third person and concrete scenes—**not** like research notes or agent logs.

**Avoid:** “profiles identify…”, “search snippets reference…”, “the same page lists…”, “third-party features summarize…”, “taken together, sources emphasize…”, “indexed…”, “for spreadsheet hygiene…”, “verify before…”, “retail pages have listed…”. Those belong in internal docs or `notes`, not in `storyFullText`.

### 2.2 Street Collector speaks as the authority

**Street Collector owns the narrative** in `storyFullText` and the hero hook: write as if we are introducing an artist we stand behind, in **our** words—**story first**, not a bibliography.

- **Do not** chain attributions (“*X* reports… *Y* adds… his site states…”, “According to *Magazine*…”, “Their CV lists…”). That reads like a literature review or a press recap.
- **Do not** cite CVs, portfolio pages, magazines, blogs, or galleries **as sources** in the overview. You may use those materials **only behind the scenes** to check facts; the public bio should **not** read like a list of who wrote about whom.
- **Do** state facts directly in plain authorial voice (“Born in Carmiel, 1990…”, “Shenkar-trained…”, “Murals run from Florentin to HaSolelim”).
- **Do** use **verbatim quotes from the artist** when you have them (interview, podcast, long-form Q&A, or cleared caption)—inside quotation marks, trimmed to the sharpest lines. That is the main place **first person** belongs.

**Test:** If the bio name-checks outlets or reads like a CV pasted into sentences, rewrite into scenes, practice, and history—then add **Press** / **Exhibitions** rows for credits.

### 2.3 What the overview bio is for

The long-form story should answer: **who is this maker**, **how they got here** (history with art, place, turning points), **how they work** (process, materials, scale), and **what the work tends to do** (subjects, stance)—always grounded in verified facts.

It should **not** summarize the press ecosystem or reproduce CV bullets. **Outlet names, links, and feature dates** belong in the **Press** module only; **shows and murals** belong in **Exhibitions**.

---

## 3. Field-by-field rules

### 3.1 Hero hook (italic line under the name)

- **Length:** about **120–180 characters** (roughly one breath).
- **Job:** emotional specificity—origin, tension, or stance. Not a mission statement (“empowering communities through art”).
- **Test:** If you can swap another artist’s name in and it still works, it’s too generic.

**Weak:** “A unique voice in contemporary street art.”  
**Stronger:** “Started on walls slated for demolition—now the city’s on her canvases.”

### 3.2 Long-form story (Overview bio, 3–6 short paragraphs)

**Intent:** A readable **feature-style story** about the person and the work—plus **short quotes from the artist** when you have interview (or equivalent) text. Not a survey of websites or magazines.

Suggested arc (flex order when facts demand it):

1. **Root** — where practice comes from (place, scene, first walls or training).
2. **Practice** — what they actually do (medium, scale, studio vs street, recurring subjects).
3. **Stance** — what the work *does* in the world (community, refusal, humor, memorial) with **concrete** examples.
4. **Editions / prints** — why multiples matter to *them* (access, craft, archive)—if unknown, shorten or omit.
5. **Street Collector** — why this partnership fits **only if** you have approved facts (first print, format, exclusivity). Otherwise end on practice, not platform flattery.

**Formatting:** Plain text; separate paragraphs with a blank line (`\n\n`). No HTML in source fields unless the pipeline explicitly allows it.

**Shopify collection description:** The artist **collection** `description` / `descriptionHtml` in Shopify is a first-class source. When you draft or refine `storyFullText` in research JSON, **read that collection copy** (facts, phrasing, partnership lines) and align or extend it in Street Collector’s editorial voice—avoid contradicting approved storefront wording without an explicit update to the collection. At runtime, [`mergeShopifyCollectionBioWithResearch`](../../../lib/shop/artist-research-merge.ts) **merges** collection text with `storyFullText` (plus `additionalHistoryText` when present): if one block is clearly redundant with the other, the longer curated block wins; if they differ, the profile shows **collection first**, then the research body, separated by a blank paragraph.

### 3.3 Pull quote

- One line that can sit **large** on the page.
- Best: **verbatim** from an interview or verified press; acceptable: tight paraphrase marked internally as paraphrase (attribute in source notes).
- Must be **emotionally specific**; avoid slogans.

### 3.4 Impact & exclusivity callouts (optional)

- **Impact:** programs, workshops, verified giving—**numbers and names** when possible. If unverified, omit.
- **Exclusive:** only **approved** claims (legal/comms). Factual, short, no urgency lies (“last chance forever”).

### 3.5 Process image labels

- **3–6 words:** place and/or year, role of image (“Proof, Berlin, 2023”).
- Not a second bio.

### 3.6 Exhibitions & press (copy style)

- **Exhibitions:** factual table mindset—year, type, title, venue, city/country. No editorial fluff in the row.
- **Press quotes:** short, **exact** wording from the piece or cleared paraphrase; outlet + year + link when public.

### 3.7 Short bio (explore / list / card blurbs)

When the UI shows a **truncated** bio:

- **First sentence** should stand alone (strongest specific claim or scene).
- Target roughly **1–2 sentences** before truncation; front-load meaning.
- Same honesty rules as long bio.

---

## 4. SEO & sharing (light touch)

- **Artist name** and **location** should appear naturally in the story (not stuffed).
- Hero hook and first paragraph are the highest-read chunks—put **distinctive** language there.
- Do not keyword-stuff city names.

---

## 5. Sources & verification (trust = conversion)

**Research vs public copy:** Interviews, CVs, press, and official sites are for **fact-checking and quotes**. The **`storyFullText` field is not** where you cite those sources—write **story + artist quotes**; park credits in **Press** and **Exhibitions**.

Minimum source mix when researching (aligns with [`artist-profile-content-creator-brief.md`](./artist-profile-content-creator-brief.md)):

1. **Artist interview, Q&A, or long caption thread (verified)** — primary fuel for **voice** and **pull quotes** in the overview.  
2. CV / resume / official bio page — **facts and dates only**; do not echo CV structure or “site lists…” in the bio.  
3. Reputable press or gallery text — **fact checking** and **Press rows**; do not recap outlets in the overview.  
4. Instagram as **behavioral** context, not as a citation for controversial claims.

**Wikipedia:** lead only; verify every fact you keep.

**Agent rule:** If a fact cannot be sourced, write **TBC** in internal notes or omit from public copy—never fabricate to “complete” a profile.

---

## 6. Examples (bad → better)

**Hook**  
❌ “A multidisciplinary artist exploring identity in the modern world.”  
✅ “Tags freight yards at night—claims the lines the maps ignore.”

**Story open**  
❌ “Since childhood, they have been passionate about creativity.”  
✅ “First pieces went up in 2009 on the industrial edge of Lisbon, where the walls outlasted the factories.”

**No outlet stack in the overview**  
❌ “Colossal (2023) profiles his chaotic color worlds; Behance documents commercial tags beside personal experiments.”  
✅ “He builds chaotic color worlds on one track and client-ready flat icons on another—research stacks first, then vector lock-in.”

**Artist voice (when you have interview text)**  
✅ They described the workflow as: “Rough everything on the iPad first—I don’t commit the vectors until the mess tells me where to go.”

**Pull quote**  
❌ “Art is my life.”  
✅ “If the wall’s coming down next week, I still finish the face.”

---

## 7. Instructions for AI agents (mandatory)

When you **draft, expand, or merge** artist bios or profile fields for Street Collector, follow this order:

1. **Read** this playbook and the worksheet section of [`artist-profile-content-creator-brief.md`](./artist-profile-content-creator-brief.md) (or the template in [`artist-profile-content-spec.md`](./artist-profile-content-spec.md)).  
2. **Confirm** you have (or the user provided) source notes: interview, CV, official bio, press links, and **the Shopify artist collection description** when it exists. If missing, produce only **outline + questions**, not invented facts.  
3. **Write** using §3 field rules (including **§3.2 collection + research merge**), §2 banned list, **§2.1 editorial vs research voice**, **§2.2 authority without bibliography**, and **§2.3** (story, history, process—**§5** for what stays in Press/CV research only).  
4. **Self-check** before output:  
   - [ ] Hook is 120–180 characters and fails the “name swap” test for uniqueness.  
   - [ ] Story is 3–6 paragraphs, plain text, `\n\n` between paragraphs.  
   - [ ] Story is consistent with the **Shopify collection description** where one exists (or collection is updated to match—see §3.2).  
   - [ ] Story reads like a magazine feature, not research notes (“profiles identify…”, “search snippets…”).  
   - [ ] Story is **narrative**: work, history with art, process—**no** citing CVs, magazines, blogs, or “according to [outlet]” in the overview; credits live in **Press** / **Exhibitions**.  
   - [ ] Any **first person** in the story is a **verbatim artist quote** from an interview (or equivalent verified source), in quotation marks—not invented.  
   - [ ] No banned hype words unless inside a quote.  
   - [ ] Exhibitions/press lines are factual; no guessed years or venues.  
   - [ ] Callouts omitted or flagged if unverified.  
5. **Map** finished copy to the correct Shopify metafields / CSV columns using [`artist-profile-content-spec.md`](./artist-profile-content-spec.md)—do not invent metafield keys.  
6. **State** in your response what is **verified** vs **placeholder / TBC** so humans can review.

**Default stance:** when unsure, **shorter and truer** beats longer and smoother.

---

## Changelog

| Version | Date | Notes |
|---------|------|--------|
| 1.5.0 | 2026-04-02 | §2.2–2.3 & §5: bios = story + artist quotes; no CV/magazine citations in overview; Press/Exhibitions for credits. Agent checklist updated. |
| 1.4.1 | 2026-04-02 | §3.2: Shopify collection description as source + runtime merge with `storyFullText` (`mergeShopifyCollectionBioWithResearch`). |
| 1.4.0 | 2026-04-02 | §2.2 authority voice: our words first; outlets sparingly / in Press. |
| 1.3.0 | 2026-04-02 | §2.1 editorial vs research voice; agent checklist updated. |
| 1.2.0 | 2026-04-21 | Product truth: Street Lamp vs wall for collectors; wall/street for artist practice. |
| 1.1.0 | 2026-04-21 | Linked shop UI files where fixed copy (empty states, explore) lives. |
| 1.0.0 | 2026-04-21 | Initial playbook: conversion frame + agent checklist; links to brief & spec. |
