# Shop Footer Pages

## Overview

All footer-linked pages for the Street Collector shop, providing information, forms, and CTAs for artist submissions, wholesale, affiliate program, FAQ, careers, and contact.

## Implementation

- **Location**: Pages live under `/shop/` to inherit the shop layout (header, cart, footer)
- **Footer config**: Updated in `app/shop/layout.tsx` with RESOURCES and TERMS & CONDITIONS sections
- **Policies**: Remain at `/policies/*` (Terms, Shipping, Refund, Privacy)
- **Contact redirect**: `/contact` redirects to `/shop/contact`

## Pages

| Route | Description |
|-------|-------------|
| `/shop/artist-submissions` | Artist submission form—portfolio, Instagram, message. Submits to API. |
| `/shop/collab` | Affiliate program (Shopify Collabs). Apply now + Log in CTAs. |
| `/shop/wholesale` | Wholesale partnership info. Details checklist + mailto contact. |
| `/shop/faq` | FAQ accordion: Shipping, Artworks, Street Lamp. Uses `StreetCollectorFAQ`. |
| `/shop/careers` | Careers intro. "View Open Positions" or mailto fallback. |
| `/shop/contact` | Contact info—email, hours, DPO note. |

## API

### POST `/api/shop/artist-submissions`

**Body**: `{ name, email, message, instagram?, portfolio? }`

**Behavior**:
- Validates required fields (name, email, message)
- Sends email via `sendEmail()` to `CONTACT_EMAIL` (default: info@thestreetlamp.com)
- Reply-To set to submitter email
- Returns `{ success: true }` or `{ error: string }`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CONTACT_EMAIL` | Email for artist submissions | info@thestreetlamp.com |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact page display email | info@thestreetlamp.com |
| `NEXT_PUBLIC_COLLABS_SIGNUP_URL` | Shopify Collabs signup URL | https://collabs.shopify.com/creator |
| `NEXT_PUBLIC_COLLABS_LOGIN_URL` | Shopify Collabs login URL | https://collabs.shopify.com/creator |
| `NEXT_PUBLIC_CAREERS_URL` | Job board / careers portal URL | (optional—fallback to mailto) |

## File Structure

```
app/shop/
├── artist-submissions/
│   ├── layout.tsx
│   └── page.tsx
├── collab/page.tsx
├── wholesale/page.tsx
├── faq/page.tsx
├── careers/page.tsx
└── contact/page.tsx

app/api/shop/
└── artist-submissions/route.ts

content/
└── shop-faq.ts
```

## Related Components

- `StreetCollectorFAQ` – FAQ accordion (used by FAQ page)
- `Container`, `SectionWrapper` – layout
- `Input`, `Textarea`, `Button` – form elements (artist submissions)

## Version

- Last updated: 2026-03-01
- Version: 1.0.0
