---
title: "Hero artist drop playbook"
type: source
tags: [gtm, marketing, utm, email, social]
created: 2026-04-19
updated: 2026-04-19
sources: []
---

# Hero artist drop playbook

Use for **3–5 coordinated drops** in the 90-day surge. One row per campaign; keep the same UTM pattern so GA4 / PostHog stay comparable.

## Canonical links (production)

Replace `{slug}` with the artist handle used on the storefront (matches `wiki/entities/{slug}.md` when present).

| Destination | URL pattern |
|-------------|-------------|
| Artist profile (headless shop) | `https://thestreetcollector.com/shop/artists/{slug}` |
| Artist collection (Shopify native, if used in comms) | `https://thestreetcollector.com/collections/{slug}` |
| Experience / configurator | `https://thestreetcollector.com/shop/experience` |

Always use **HTTPS** and **one primary URL** per channel to avoid splitting social signals.

---

## UTM convention

| Parameter | Rule | Example |
|-----------|------|---------|
| `utm_source` | Platform | `instagram`, `email`, `newsletter`, `partner` |
| `utm_medium` | Type | `social`, `email`, `referral` |
| `utm_campaign` | Drop id | `drop_2026_04_artist-oril` |
| `utm_content` | Variant | `story_01`, `reel_02`, `header_cta` |

**Example (email):**

`https://thestreetcollector.com/shop/artists/ori-toor?utm_source=newsletter&utm_medium=email&utm_campaign=drop_2026_04_oritoor&utm_content=header_cta`

**Example (IG bio / link sticker):**

`https://thestreetcollector.com/shop/artists/ori-toor?utm_source=instagram&utm_medium=social&utm_campaign=drop_2026_04_oritoor&utm_content=link_sticker`

---

## Pre-flight checklist (per artist)

- [ ] **Slug** confirmed in storefront + wiki entity path exists or will be updated same day.
- [ ] **Hero asset:** 1:1 + 4:5 + 9:16 variants where the channel needs them.
- [ ] **Copy** aligns with [[positioning-wedge]] (limited prints + illuminated display + COA story).
- [ ] **Email:** subject line A/B optional; single primary CTA to canonical artist URL + UTMs.
- [ ] **Social:** schedule + UTMs per post; pin / highlight rules documented.
- [ ] **Artist:** brief with posting window, approved hashtags, @mentions for Street Collector.
- [ ] **Post-drop:** note in [[gsc-baseline-fill-in-template]] next monthly review (new queries / pages).

---

## Drop calendar (5 slots)

| # | Target week | Artist(s) | Primary channel | `utm_campaign` id | Owner | Status |
|---|-------------|-----------|-----------------|-------------------|-------|--------|
| 1 | | | | | | ☐ |
| 2 | | | | | | ☐ |
| 3 | | | | | | ☐ |
| 4 | | | | | | ☐ |
| 5 | | | | | | ☐ |

---

## Email snippet (starter)

**Subject:** New limited editions — [Artist] on Street Collector  

**Preview:** Prints + illuminated display + certificate of authenticity.

**Body (plain):**

> We’ve just spotlighted **[Artist]** — limited-edition prints paired with our illuminated display and a certificate of authenticity.  
> Shop the drop: **[canonical URL with UTMs]**  
> Configure yours: **https://thestreetcollector.com/shop/experience**

---

## Related

- [[gtm-battle-plan]]
- [[analytics-tracking]]
- [[seo-gsc-baseline-runbook]]
