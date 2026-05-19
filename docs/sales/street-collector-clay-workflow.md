# Street Collector Investor Gift Outreach: Clay Workflow

## Objective

Build country-based prospect lists for personal outreach to 150+ employee creator, design, media, and creative-tech companies. The offer is not a paid campaign. It is a premium, local-artist investor gift program modeled on the Simply success: company-specific creative concept, artist curation, premium package, and end-to-end delivery.

The starting CSV is:

`docs/sales/street-collector-clay-prospect-list.csv`

## Clay Table 1: Company List

Import the CSV as the source table.

Required Clay columns to add:

| Column | Type | Purpose |
| --- | --- | --- |
| `verified_employee_count` | Enrichment | Replace the estimate band with current data. |
| `linkedin_company_url` | Enrichment | Needed for people search and validation. |
| `hq_city_verified` | Enrichment | Confirm local artist market. |
| `funding_stage` | Enrichment | Prioritize active investor relationships. |
| `last_funding_date` | Enrichment | Best signal for current investor gifting need. |
| `investors` | Enrichment | Use for personalization and investor-count estimate. |
| `recent_company_signal` | AI/web research | Product launch, funding, acquisition, conference, brand campaign, or expansion. |
| `artist_market_note` | AI generated | One sentence tying company country/city to local artist curation. |
| `fit_score` | Formula/AI | 1-5 based on creative fit, size, funding, and local artist angle. |
| `priority_status` | Manual/formula | `A`, `B`, `C`, or `Hold`. |

Fit scoring:

| Score | Meaning |
| --- | --- |
| 5 | Creator/design company, 150+ employees, clear funding/investor signal, local artist angle obvious. |
| 4 | Strong creative fit, but either larger than ideal or funding signal needs work. |
| 3 | Design-adjacent company with good local artist story but less obvious investor gift need. |
| 2 | Interesting but weak creative fit or unclear buying trigger. |
| 1 | Remove from first campaign. |

Recommended first filters:

- `verified_employee_count >= 150`
- `fit_score >= 4`
- `country in Israel, United States, Netherlands, United Kingdom, Germany, Australia`
- Keep Japan as a strategic test list because the Pixiv/local artist angle is strong, but expect slower outreach.

## Clay Table 2: People Search

For each company with `fit_score >= 4`, find 2-4 people.

Search titles in this order:

1. Founder, Co-Founder, CEO
2. Chief of Staff, Head of CEO Office, Business Operations
3. COO, VP Operations, Head of Operations
4. VP Investor Relations, Head of Investor Relations, Corporate Development
5. VP Brand, Head of Brand, VP Partnerships
6. VP People, Head of People, People Operations
7. Executive Assistant to CEO, Founder Associate

Country adjustments:

| Country | Primary target | Notes |
| --- | --- | --- |
| Israel | Founder/CEO, Chief of Staff, VP Brand, VP Operations | Founder-led and relationship-driven; use Israeli artist/local pride angle. |
| United States | Chief of Staff, VP Operations, VP Brand, Founder/CEO | Strong fit for founder gift and premium design positioning. |
| Netherlands | Chief of Staff, VP Brand, VP Operations, CEO | Use Dutch design heritage and Amsterdam artist curation. |
| United Kingdom | COO, Chief of Staff, VP Brand, Finance/IR | More formal; emphasize premium craftsmanship and investor credibility. |
| Germany | COO, VP Operations, VP Brand, CEO | Emphasize structured program, quality, and long-term relationship value. |
| Denmark | CEO, VP Ops, VP People, VP Brand | Use design heritage, sustainability, and artist support. |
| Australia | Founder/CEO, COO, VP Brand, VP Partnerships | Strong creator/community angle for Canva, Envato, Linktree. |
| Japan | CEO office, Corporate Strategy, COO, Partnerships | Use Pixiv/local artist sourcing and seasonal gift culture. |

People columns to add:

| Column | Purpose |
| --- | --- |
| `person_name` | Contact name. |
| `person_title` | Current title. |
| `person_linkedin_url` | Validation and personalization. |
| `email` | Work email. |
| `email_confidence` | Only use high or medium-high confidence. |
| `persona` | CEO, CoS/Ops, IR/Corp Dev, Brand/Partnerships, People. |
| `buying_role` | Decision maker, influencer, gatekeeper, or referral path. |
| `personalization_signal` | Recent post, company milestone, product launch, artist/design clue. |
| `outreach_angle` | One-sentence angle for this person. |
| `sequence_status` | Not started, emailed, follow-up 1, follow-up 2, replied, booked, not fit. |

## Clay AI Prompt: Company Research

Use this in Clay after enrichment:

```text
Research this company as a potential buyer for Street Collector's premium artist-led street lamp investor gifts.

Company: {{company}}
Website: {{website}}
Country: {{country}}
Creative fit: {{creative_fit}}

Return:
1. One recent company signal that can justify personal outreach.
2. Why this company would value an artist-driven investor gift.
3. Which local artist market should be referenced.
4. The best buyer persona to contact first.
5. A one-sentence outreach hook.

Keep it specific, factual, and concise. Do not invent funding or headcount data.
```

## Clay AI Prompt: Contact Personalization

```text
Write a concise personalization note for a personal outreach email.

Company: {{company}}
Contact: {{person_name}}
Title: {{person_title}}
Country/city: {{country}}, {{region}}
Company signal: {{recent_company_signal}}
Local artist angle: {{artist_market_note}}
Street Collector context: We created a custom investor gift program for Simply using company-specific artwork, a premium physical Street Lamp product, certificate/authenticity story, packaging, and delivery.

Return:
1. A 12-word or shorter subject line.
2. A 2-sentence opener.
3. One suggested CTA for a discovery call.

Tone: personal, founder-to-founder/creative business, not mass marketing.
```

## First Wave Recommendation

Start with Israel and the highest-fit creator companies first. The local artist strategy will be easiest to execute and the Simply proof point will feel culturally close.

First 12 to enrich:

1. Wix
2. Artlist
3. Lightricks
4. Fiverr
5. Elementor
6. Riverside
7. Webflow
8. Runway
9. Descript
10. Patreon
11. Framer
12. WeTransfer

Second 12:

1. Figma
2. Notion
3. Miro
4. Synthesia
5. VEED
6. SoundCloud
7. Ableton
8. Envato
9. Linktree
10. Canva
11. pixiv
12. Domestika

## First Outreach Template

Subject: `Local artist investor gifts for {{company}}`

```text
Hi {{first_name}},

I am reaching out because {{company}} sits right in the world where Street Collector tends to work best: creative tools, strong brand taste, and investors who would understand a gift with a real artist story behind it.

We recently built a custom investor gift program for Simply: a Street Lamp package with company-specific artwork, premium packaging, certificate/story layer, and full delivery handling. For {{company}}, I think the stronger angle would be {{local_artist_angle}} rather than a generic branded object.

Would it be worth a short call to explore what a 25-50 piece investor gift pilot could look like for {{company}}?

Best,
{{sender_name}}
```

## Follow-Up 1

```text
Hi {{first_name}},

Quick follow-up because I think this is especially relevant for {{company}}.

The idea is not merch. It is a small curated investor-gift edition: local artist direction, physical Street Lamp, packaging, story card/certificate, and delivery handled end to end.

If useful, I can send a 1-page concept using {{company}}'s brand world and local artist scene as the starting point.
```

## Follow-Up 2

```text
Hi {{first_name}},

Last note from me for now.

If investor gifts, board gifts, or founder relationship moments are handled by someone else at {{company}}, who would be the right person to speak with?
```

## Discovery Call Questions

Use these to qualify without sounding like a vendor form:

1. Are investor or board gifts something you already do, even informally?
2. How many people would a meaningful first edition need to cover?
3. Is the gift more for investors, board members, strategic partners, or internal champions?
4. Would you want the art direction to feel close to the company brand, the local artist scene, or both?
5. What matters more for this gift: personalization, premium feel, speed, or ease of logistics?

## Proposal Structure

For any qualified reply, build a short proposal with:

1. Company-specific concept name.
2. Local artist curation rationale.
3. 2-3 artist direction options.
4. Package contents.
5. Quantity range: 25, 50, or 100.
6. Pricing range.
7. Timeline.
8. Delivery/logistics scope.
9. Reference to Simply as proof of concept.

