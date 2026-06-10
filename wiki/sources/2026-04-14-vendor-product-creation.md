---
title: "Vendor Product Creation Documentation"
type: source
tags: [vendor, products, shopify, wizard, admin-approval]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Vendor Product Creation Documentation

Feature documentation for the 5-step vendor product submission wizard and admin approval workflow.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/vendor-product-creation/README.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

Vendors submit artworks through a 5-step wizard. Step 1: basic info (title, description, type, handle). Step 2: variants and pricing. Step 3: images (URL-based, alt text, primary selection). Step 4: additional details (tags, vendor collection, Shopify metafields, custom metafields). Step 5: review and submit. Submitted products saved as `pending`. Admins approve and the product is published to Shopify with vendor collection/tags auto-assigned. First Edition Reserve is triggered at approval.

## Key Takeaways

- Products start `pending` — never immediately live.
- Vendor collection and tags auto-assigned from vendor profile.
- Metafields: dynamically loaded from Shopify Admin API definitions + custom inputs.
- URL handle: auto-generated if not provided.
- Images: URL-based upload (not direct file upload).
- Admin approval triggers: Shopify publish + first edition reserve.
- Vendors track submission status in the vendor portal.

## New Information

- Metafields are loaded dynamically from Shopify definitions on each wizard load — a live Shopify API call.
- "Custom metafields" (step 4) allow vendors to add fields beyond the Shopify-defined set.
- HTML is supported in the description field.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[shopify]]
- [[supabase]]

## Concepts Touched

- [[vendor-product-creation]]
- [[first-edition-reserve]]
- [[vendor-portal]]
- [[edition-numbering-system]]
