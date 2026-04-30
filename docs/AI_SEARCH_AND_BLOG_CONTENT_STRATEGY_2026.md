# AI Search And Blog Content Strategy

Last updated: 2026-04-29

## Goal

Make Street Collector show up in Google, ChatGPT search, Perplexity, Claude, and other answer engines for art-related discovery queries. The strategy is to publish crawlable, specific, entity-rich pages that answer real collector questions and connect every answer back to artists, artworks, the lamp, editioning, and Certificates of Authenticity.

## AI Discovery Baseline

The site should explicitly allow discovery crawlers that influence AI/search visibility:

- OpenAI search: `OAI-SearchBot`
- OpenAI user actions: `ChatGPT-User`
- OpenAI training crawler: `GPTBot`
- Anthropic: `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `anthropic-ai`
- Perplexity: `PerplexityBot`, `Perplexity-User`
- Search foundations: `Googlebot`, `Bingbot`, `Applebot`
- Common Crawl: `CCBot`

`/llms.txt` and `/llms-full.txt` should summarize the entity, key topics, and the best citation URLs for answer engines.

Source docs checked on 2026-04-29:

- OpenAI crawler overview: `https://platform.openai.com/docs/bots`
- OpenAI product/search discovery guidance: `https://openai.com/chatgpt/search-product-discovery/`
- Anthropic ClaudeBot robots guidance: `https://support.claude.com/en/articles/8896518-does-claudebot-respect-robots-txt`
- Perplexity crawler guidance: `https://docs.perplexity.ai/guides/bots`
- Google robots.txt guidance: `https://developers.google.com/search/docs/crawling-indexing/robots/intro`

## Core Entity Statements

Use these consistently in articles, category pages, artist pages, and structured data:

- Street Collector is a backlit art lamp and limited edition street art print platform.
- Collectors buy the lamp once and swap limited edition artworks over time.
- Street Collector works with independent street artists, illustrators, muralists, and contemporary visual artists worldwide.
- Eligible works include Certificate of Authenticity documentation.
- The platform helps people start a physical art collection without needing a gallery budget.

## Content Pillars

### Pillar 1: The Object

Target searches:

- backlit art lamp
- illuminated art display
- interchangeable art lamp
- swappable art prints
- art lamp for home decor
- collectible lamp art

Content angle: explain the lamp as a physical art display system, not generic lighting.

Priority posts:

1. What Is a Backlit Art Lamp?
2. How Interchangeable Art Prints Change a Room
3. Backlit Art vs Framed Prints: Which Fits Your Space?
4. How to Display Art in a Small Apartment
5. Why Swappable Art Makes Collecting Easier

### Pillar 2: The Collection

Target searches:

- limited edition street art prints
- urban art prints
- street art prints online
- collectible art prints
- emerging artist prints
- artist signed limited editions

Content angle: educate collectors about editioning, artist context, scarcity, and why the print is not just decor.

Priority posts:

1. How to Start Collecting Street Art Prints
2. What Makes a Limited Edition Print Valuable?
3. Street Art Prints vs Posters: What Collectors Should Know
4. Why Edition Size Matters
5. How to Choose Your First Collectible Print

### Pillar 3: The Trust Layer

Target searches:

- certificate of authenticity for art
- what is a COA in art
- how to verify limited edition prints
- art print provenance
- numbered print authenticity

Content angle: answer trust questions plainly and connect the answer to Street Collector's certificate and edition system.

Priority posts:

1. What Is a Certificate of Authenticity for Art?
2. What Should a Print Certificate Include?
3. How Numbered Editions Work
4. How to Keep Art Provenance Records
5. Why Authentication Matters for New Collectors

### Pillar 4: Artists And Themes

Target searches:

- `[artist name] limited edition prints`
- `[artist name] street art`
- Tel Aviv street artists
- European mural artists
- women street artists
- abstract street art prints
- pop art street prints
- surreal urban art

Content angle: entity-building. Each article should strengthen artist pages, product pages, and location/theme clusters.

Priority post formats:

1. Artist profile: who they are, where they work, visual language, notable themes, available works.
2. Theme cluster: "10 artists working with color and optimism", "street art prints for small spaces".
3. Location cluster: "Tel Aviv street artists to know", "European mural artists in the Street Collector collection".
4. Medium/style guide: collage, illustration, muralism, abstract urban art, pop-surrealism.

### Pillar 5: Buyer Intent And Gifts

Target searches:

- gifts for art lovers
- gifts for street art fans
- unique housewarming gifts
- art gifts under 100
- creative gifts for designers
- wall art gifts

Content angle: commercial, seasonal, and highly useful. These pages should link to specific products, artists, and the lamp.

Priority posts:

1. Gifts for Street Art Lovers
2. Best Art Gifts Under $100
3. A Housewarming Gift for People Who Hate Generic Decor
4. Gifts for Designers and Visual People
5. How to Give Someone Their First Art Collection

## 90-Day Publishing Plan

### Executed In This Pass

Published the first six foundation guides in the static blog content feed:

- `/shop/blog/what-is-a-backlit-art-lamp`
- `/shop/blog/how-to-start-collecting-street-art-prints`
- `/shop/blog/what-is-a-certificate-of-authenticity-for-art`
- `/shop/blog/street-art-prints-vs-posters`
- `/shop/blog/how-numbered-art-editions-work`
- `/shop/blog/gifts-for-street-art-lovers`

Wired those guides into the matching category pages as visible related guides and structured `hasPart` article references.

### Month 1: Foundation

Publish:

- What Is a Backlit Art Lamp? `published`
- How to Start Collecting Street Art Prints `published`
- What Is a Certificate of Authenticity for Art? `published`
- Street Art Prints vs Posters `published`
- How Numbered Art Editions Work `published`
- Gifts for Street Art Lovers `published`

Update:

- Existing older blog articles with stronger intros, citations, current artist links, and internal links.
- Artist pages with "available works", location, visual style, and FAQ blocks where missing.

### Month 2: Artist Authority

Publish:

- 6 artist profile posts tied to artists with active product inventory.
- 2 location/theme posts, for example Tel Aviv street artists and European mural artists.
- 1 buyer-intent post for gifts or small apartments.

Update:

- Add related links from each post to artist pages, product pages, and category pages.
- Add author/reviewer byline language where possible.

### Month 3: Commercial Expansion

Publish:

- 4 gift/use-case posts.
- 2 edition/authenticity posts.
- 2 theme cluster posts.

Update:

- Build internal "content hubs" from category pages to blog posts.
- Review Search Console queries and refresh titles for pages sitting in positions 4-20.

## Article Brief Template

Each article should include:

- Primary keyword.
- Secondary keywords.
- One-sentence answer in the first 120 words.
- Street Collector entity mention in the intro.
- At least 3 internal links:
  - one category page
  - one artist page or artist directory
  - one product/shop page
- At least one visible FAQ section.
- Article JSON-LD through the blog template.
- Clear author and publish date.
- Original detail: artist names, cities, edition behavior, materials, product use, collector scenarios.

## Recommended Article Structure

1. H1: literal search intent, not clever.
2. Intro: answer the query immediately.
3. Short definition or summary block.
4. 3-5 detailed sections.
5. Street Collector-specific application.
6. FAQ section.
7. Related artists/products.

## Writing Rules For AI Visibility

- Use direct statements that can be quoted or summarized.
- Keep one idea per paragraph.
- Name entities clearly: Street Collector, artist name, city, style, product, print, certificate.
- Avoid vague phrases like "revolutionary" unless the paragraph explains why.
- Do not overstuff keywords. Use natural variations.
- Use comparisons: lamp vs frame, limited edition vs poster, street art vs urban art.
- Make every post answer a question better than a generic SEO article can.

## Internal Link Map

- `/backlit-art-lamp` should link to object/lamp articles.
- `/interchangeable-art-prints` should link to swapping, small-space, and gift articles.
- `/limited-edition-street-art-prints` should link to editioning, COA, and collecting guides.
- `/urban-art-prints` should link to artist, style, and location articles.
- Artist articles should link to `/shop/artists/[slug]` and available products.
- Product pages should link back to artist pages and relevant guides.

## First 20 Blog Titles To Produce

1. What Is a Backlit Art Lamp?
2. How to Start Collecting Street Art Prints
3. What Is a Certificate of Authenticity for Art?
4. Street Art Prints vs Posters: What Collectors Should Know
5. What Makes a Limited Edition Print Valuable?
6. How Numbered Art Editions Work
7. How to Display Art in a Small Apartment
8. Gifts for Street Art Lovers
9. Best Art Gifts Under $100
10. Why Interchangeable Art Prints Make Collecting Easier
11. Tel Aviv Street Artists To Know
12. European Mural Artists In The Street Collector Collection
13. Abstract Urban Art Prints: A Collector's Guide
14. Pop Art And Street Art: Where They Overlap
15. How To Choose Your First Collectible Print
16. How To Care For Limited Edition Prints
17. Why Artist Stories Matter In Collecting
18. A Guide To Buying Art From Independent Artists
19. How Backlighting Changes Color And Detail In Artwork
20. How To Build A Rotating Art Collection

## Measurement

Weekly:

- ChatGPT referrals with `utm_source=chatgpt.com`.
- Perplexity referrals.
- Google Search Console queries by pillar.
- Indexed URL count for category and blog pages.
- Internal search and shop conversion after blog sessions.

Monthly:

- Pages ranking in positions 4-20.
- Posts receiving impressions but low CTR.
- Artist pages with impressions but no clicks.
- AI answer tests for the target prompts:
  - "What is a backlit art lamp?"
  - "Where can I buy limited edition street art prints?"
  - "What is Street Collector?"
  - "What are good gifts for street art lovers?"
  - "How do certificates of authenticity work for art prints?"
