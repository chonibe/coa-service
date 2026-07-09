# Unified Content Layer

This directory is the repo-managed source of truth for rendered site copy.

## Where new content should go
- Put new rendered storefront or collector copy in the unified registry exposed by [site-content.ts](/Users/streetcollector/Documents/Cursor%20Projects/coa-service-main/content/site-content.ts).
- Add or extend page definitions under `content/site/` when a page needs structured copy.
- Keep one public import surface for UI consumers:
  - `getStorePageContent(...)`
  - `getCollectorPageContent(...)`

## Naming rules
- Organize content as `page -> section -> field`.
- Use stable page ids like `membership`, `forBusiness`, `artistSubmissions`, `account`, `help`.
- Use stable section ids like `hero`, `faq`, `support`, `profile`, `orders`, `messages`.
- Prefer reusable field names:
  - `title`
  - `subtitle`
  - `body`
  - `cta`
  - `items`
  - `successTitle`
  - `successBody`
  - `errorFallback`

## What belongs here vs Shopify
- Put editorial copy, CTA labels, help text, FAQs, testimonials, form labels, empty states, and visible success/error copy here.
- Keep live product/catalog data in Shopify-backed code paths.
- SEO long-form content may stay in dedicated content files, but should be reachable from the unified registry when practical.

## Editing workflow
- Do not add new rendered copy directly inside page components if it belongs to the unified content layer.
- If a page already reads from the content layer, add the new string there first and wire the component to consume it.
- If a page still has hardcoded copy, migrate the page to the content layer instead of adding more inline strings.

## Future CMS/database migration
- The current schema is intentionally shaped so it can later map to a CMS or database with stable page and section ids.
- Do not couple components to file names in `content/site/`; components should depend on accessors in `lib/content/site-content.ts`.
