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

**Testing / QA:** No automated copy tests. Use the checklist in **§7** for self-review; humans should spot-check the live profile (`/shop/artists/[slug]`) and explore cards after publish.

**Version:** 1.2.0 · **Last updated:** 2026-04-21

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

---

## 3. Field-by-field rules

### 3.1 Hero hook (italic line under the name)

- **Length:** about **120–180 characters** (roughly one breath).
- **Job:** emotional specificity—origin, tension, or stance. Not a mission statement (“empowering communities through art”).
- **Test:** If you can swap another artist’s name in and it still works, it’s too generic.

**Weak:** “A unique voice in contemporary street art.”  
**Stronger:** “Started on walls slated for demolition—now the city’s on her canvases.”

### 3.2 Long-form story (Overview bio, 3–6 short paragraphs)

Suggested arc (flex order when facts demand it):

1. **Root** — where practice comes from (place, scene, first walls or training).
2. **Practice** — what they actually do (medium, scale, studio vs street, recurring subjects).
3. **Stance** — what the work *does* in the world (community, refusal, humor, memorial) with **concrete** examples.
4. **Editions / prints** — why multiples matter to *them* (access, craft, archive)—if unknown, shorten or omit.
5. **Street Collector** — why this partnership fits **only if** you have approved facts (first print, format, exclusivity). Otherwise end on practice, not platform flattery.

**Formatting:** Plain text; separate paragraphs with a blank line (`\n\n`). No HTML in source fields unless the pipeline explicitly allows it.

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

Minimum source mix when researching (aligns with [`artist-profile-content-creator-brief.md`](./artist-profile-content-creator-brief.md)):

1. Artist interview, Q&A, or long caption thread (verified).  
2. CV / resume / official bio page.  
3. Reputable press or gallery text.  
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

**Pull quote**  
❌ “Art is my life.”  
✅ “If the wall’s coming down next week, I still finish the face.”

---

## 7. Instructions for AI agents (mandatory)

When you **draft, expand, or merge** artist bios or profile fields for Street Collector, follow this order:

1. **Read** this playbook and the worksheet section of [`artist-profile-content-creator-brief.md`](./artist-profile-content-creator-brief.md) (or the template in [`artist-profile-content-spec.md`](./artist-profile-content-spec.md)).  
2. **Confirm** you have (or the user provided) source notes: interview, CV, official bio, or press links. If missing, produce only **outline + questions**, not invented facts.  
3. **Write** using §3 field rules and §2 banned list.  
4. **Self-check** before output:  
   - [ ] Hook is 120–180 characters and fails the “name swap” test for uniqueness.  
   - [ ] Story is 3–6 paragraphs, plain text, `\n\n` between paragraphs.  
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
| 1.2.0 | 2026-04-21 | Product truth: Street Lamp vs wall for collectors; wall/street for artist practice. |
| 1.1.0 | 2026-04-21 | Linked shop UI files where fixed copy (empty states, explore) lives. |
| 1.0.0 | 2026-04-21 | Initial playbook: conversion frame + agent checklist; links to brief & spec. |
