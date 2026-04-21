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
| `/shop/for-business` | B2B page: Gifting, Hospitality, Offices, Galleries. Submits to API. |
| `/shop/artist-submissions` | Artist submission form—portfolio, Instagram, message. Submits to API. |
| `/shop/collab` | Affiliate program (Shopify Collabs). Apply now + Log in CTAs. |
| `/shop/wholesale` | Wholesale partnership info. Details checklist + mailto contact. |
| `/shop/faq` | FAQ accordion: Shipping, Artworks, Street Lamp. Uses `StreetCollectorFAQ`. |
| `/shop/careers` | Careers intro. "View Open Positions" or mailto fallback. |
| `/shop/contact` | Contact info—email, hours, DPO note. |

## API

### POST `/api/shop/for-business`

**Body** (contact forms): `{ type: "hospitality"|"offices"|"galleries", name, companyName, desiredTiles, email, phone?, additionalInfo? }`

**Body** (gifting): multipart/form-data with type=gifting, cardValue, employeesCount, company, sendToday, sendDate, giftMessage, emails, csvFile?

**Behavior**: Validates, sends email to CONTACT_EMAIL (with CSV attachment for gifting if provided). See [For Business README](../for-business/README.md).

### POST `/api/shop/artist-submissions`

**Body**: `{ name, email, message, instagram?, portfolio? }`

**Behavior**:
- Validates required fields (name, email, message)
- Persists to Supabase `artist_applications` (same pipeline as `/api/artists/apply`), with the message stored in `bio` prefixed by the shop form path so the source is clear
- Sends a notification email via `sendEmail()` to `CONTACT_EMAIL` (default: info@thestreetlamp.com) as best-effort; a failed email does not block a saved submission
- Reply-To set to submitter email
- Returns `{ success: true }` or `{ error: string }`
- Review submissions in the admin app: **`/admin/artist-applications`** (Products → Artist applications in the sidebar).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Required to persist shop artist submissions | — |
| `ARTIST_APPLICATION_NOTIFY_EMAIL` | Team inbox for new artist applications (shop + /for-artists); comma-separated allowed | Defaults to **`choni@thestreetcollector.com`** when unset |
| `CONTACT_EMAIL` | Other shop forms (e.g. for-business); not used for artist-application email | info@thestreetlamp.com |
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
├── for-business/
│   ├── layout.tsx
│   └── page.tsx
├── wholesale/page.tsx
├── faq/page.tsx
├── careers/page.tsx
└── contact/page.tsx

app/api/shop/
├── artist-submissions/route.ts
└── for-business/route.ts

content/
└── shop-faq.ts
```

## Related Components

- `StreetCollectorFAQ` – FAQ accordion (used by FAQ page)
- `Container`, `SectionWrapper` – layout
- `Input`, `Textarea`, `Button` – form elements (artist submissions)

## Version

- Last updated: 2026-04-21
- Version: 1.0.2
