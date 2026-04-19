---
title: "Vendor Product Creation"
type: concept
tags: [feature, vendor, products, shopify, admin-approval]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-vendor-product-creation]
---

# Vendor Product Creation

Vendors submit new artworks through a 5-step creation wizard; products go through an admin approval workflow before being published to Shopify with auto-assigned vendor collections and tags.

## Definition

The product creation wizard guides vendors through: basic info → variants & pricing → images → additional details (tags, metafields) → review & submit. Submitted products are saved with status `pending`. Admins review and approve; on approval, the product is published to Shopify with the vendor's collection and tags automatically assigned. The First Edition Reserve is triggered at the point of approval.

## Key Claims

1. 5-step wizard: basic info → variants/pricing → images → additional details → review/submit.
2. Submitted products start with status `pending` — not immediately live on Shopify.
3. Vendor collection and tags are auto-assigned (pulled from vendor profile).
4. Metafields are dynamically loaded from Shopify definitions and supported as custom inputs.
5. URL handle is auto-generated if not provided.
6. Image upload is URL-based with alt text and primary image selection.
7. On admin approval: published to Shopify + [[first-edition-reserve]] triggered automatically.
8. Vendors can track submission status via the vendor portal.

## Evidence

- [[2026-04-14-vendor-product-creation]] — full wizard steps, submission workflow, admin approval flow

## Tensions

- URL-based image upload (not direct file upload) means vendors must host images elsewhere first — a friction point.
- Metafields are dynamically loaded from Shopify definitions — a Shopify API call is required on each wizard load; if the Shopify Admin API is slow, the wizard stalls.

## Related

- [[vendor-portal]]
- [[first-edition-reserve]]
- [[shopify]]
- [[edition-numbering-system]]
