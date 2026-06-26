# Product Marketing Context

*Last updated: 2026-06-25 — V1 auto-drafted from repo; review and correct with team.*

## Product Overview

**One-liner:** A living art collection — not just a lamp.

**What it does:** Street Collector sells the Street Lamp, a premium backlit display that lets collectors swap original artist artworks in seconds. Customers browse hundreds of artists, configure lamp + art bundles in an interactive experience, and build a rotating home art collection without screens or AI-generated prints.

**Product category:** Collectible home art / designer lighting / art marketplace

**Product type:** DTC e-commerce marketplace (Shopify storefront + custom experience)

**Business model:** Hardware (lamp from ~$99) + recurring artwork purchases (from ~$40 per piece); artist revenue share via vendor portal

## Target Audience

**Target companies:** N/A (B2C)

**Decision-makers:** Homeowners, design-conscious millennials/Gen X, art lovers, gift buyers (25–54 primary)

**Primary use case:** Display rotating original art at home with minimal friction — swap pieces in seconds

**Jobs to be done:**
- Curate a personal art collection without committing to one permanent piece
- Support independent artists directly
- Elevate living spaces with functional, beautiful light + art

**Use cases:**
- Primary residence statement piece
- Gift for design-minded friends/family
- Collecting emerging street/contemporary artists

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| The Collector | Original art, artist story, exclusivity | Mass-produced decor feels generic | Curated artists, swap anytime, real originals |
| The Design Lover | Aesthetics, ease, premium feel | Art feels permanent/intimidating | One lamp, endless looks — swap in seconds |
| The Gift Giver | Wow factor, shipping, returns | Finding unique meaningful gifts | Starting at $99, free shipping, 30-day returns |

## Problems & Pain Points

**Core problem:** Most people want original art at home but find traditional collecting expensive, permanent, and hard to discover.

**Why alternatives fall short:**
- Prints/posters — not original, low emotional value
- Digital frames — screen fatigue, not "real" art
- Single canvas purchase — no variety, high commitment
- Gallery buying — intimidating, high ticket, no swap path

**What it costs them:** Stale decor, regret over permanent purchases, supporting mass market over artists

**Emotional tension:** "I want my home to reflect me" vs. fear of buying the wrong expensive piece

## Competitive Landscape

**Direct:** Digital art frames, premium print subscriptions — lack physical original art + artist connection

**Secondary:** Traditional art prints, Etsy decor — not interchangeable, not backlit collection system

**Indirect:** Smart lighting, gallery purchases — different purchase motion and price curve

## Differentiation

**Key differentiators:**
- Physical original art (no AI, no screens)
- Swap artworks in seconds on one lamp
- Hundreds of independent artists on one platform
- Backlit display engineered for art

**How we do it differently:** Hardware + marketplace + experience configurator (`/experience`)

**Why that's better:** Lower commitment than gallery, more soul than prints, more flexibility than one canvas

**Why customers choose us:** "Not just a lamp. A living art collection." + artist support story

## Objections

| Objection | Response |
|-----------|----------|
| "Is it just a lamp?" | It's a display system for a rotating art collection — the lamp is the canvas |
| "$99+ is a lot" | Starting at $99 with artworks from $40; compare to single gallery piece or digital frame |
| "Will I like the art?" | Hundreds of artists, 30-day returns, swap anytime |
| "Shipping/returns?" | Free worldwide shipping, 12-month guarantee, 30-day returns |

**Anti-persona:** Buyers seeking cheapest mass-market decor or fully custom commissioned one-offs only

## Switching Dynamics

**Push:** Bored of static walls, guilt about generic Amazon art, want to support creators

**Pull:** Swap flexibility, video-rich experience, social proof (3000+ collectors)

**Habit:** Already bought prints or one-off pieces; used to "set and forget" decor

**Anxiety:** Will it look good in my space? Is the hardware quality worth it?

## Customer Language

**How they describe the problem:**
- "I want art that can change with my mood"
- "I don't want another poster"
- "I want to support real artists"

**How they describe us:**
- "A living art collection"
- "Swap art in seconds"
- "Not just a lamp"

**Words to use:** collection, original art, swap, artists, living, lamp, light, curated

**Words to avoid:** screen, digital frame, AI art, poster (unless contrasting)

**Glossary:**

| Term | Meaning |
|------|---------|
| Street Lamp | The backlit hardware product |
| Experience | Interactive configurator at `/experience` |
| Artwork / edition | Individual artist piece for the lamp |

## Brand Voice

**Tone:** Premium but approachable, art-forward, warm

**Style:** Short punchy lines + sensory detail; video-first storytelling

**Personality:** Curatorial, modern, collector-minded, artist-supportive

## Proof Points

**Metrics:** 3000+ collectors (site testimonial section)

**Customers:** Featured artist carousel on landing

**Testimonials:** See `content/street-collector.ts` testimonials section

**Value themes:**

| Theme | Proof |
|-------|-------|
| Trust | Free worldwide shipping, 12-month guarantee, 30-day returns |
| Originality | "No AI. No screens. Just original art." |
| Flexibility | "Swap in seconds" / "One lamp. Endless art." |

## Goals

**Business goal:** Grow lamp + artwork sales through paid and organic channels

**Conversion action:** Complete purchase via `/experience` → checkout (Purchase event)

**Current metrics:** Track via PostHog + Meta CAPI (see `docs/features/analytics/README.md`)

## Meta Ads specifics

**Primary landing URLs:** `https://thestreetcollector.com/experience` (configurator), `https://thestreetcollector.com/shop/street-collector` (brand)

**Conversion events (priority):** Purchase → InitiateCheckout → AddToCart → ViewContent → Lead

**Pixel/CAPI:** Implemented — Business `Street Collector` (`114285802744042`), dataset `Website Events` (`1315234756106483`)

**Custom audiences:** Buyer sync via `lib/meta-custom-audiences-server.ts` (requires `META_CUSTOM_AUDIENCE_ID`)

**Suggested campaign angles:**
1. Collector / lifestyle — rotating art at home
2. Gift — unique design gift, guaranteed returns
3. Artist story — support independent creators
4. Product demo — video of swap + light levels (use existing Shopify CDN clips)
