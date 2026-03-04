# For Business (B2B)

## Overview

The For Business page offers B2B packages for gifting, hospitality, offices, and galleries. Customers can request bulk gift cards or contact the team for custom photo tile projects.

**Implementation**: [`app/shop/for-business/`](../../../app/shop/for-business/), [`app/api/shop/for-business/`](../../../app/api/shop/for-business/)

## Features

### Four Inquiry Types

| Tab | Purpose |
|-----|---------|
| **Gifting** | B2B gift card requests with bulk discounts, CSV upload, and employee emails |
| **Hospitality** | Expert contact form for hotels, restaurants, venues |
| **Offices** | Expert contact form for office installations |
| **Galleries** | Expert contact form for gallery projects |

### Gifting Form Fields

- Bulk discount tiers: 5% off (₪5,600+), 10% off (₪11,100+), 15% off (₪36,700+)
- Card value
- Employees to be gifted
- Upload CSV (recipient list)
- Add emails (manual entry)
- Company name
- Send date: Today or schedule
- Gift message (optional)

### Contact Form Fields (Hospitality, Offices, Galleries)

- Your name *
- Company name *
- Desired amount of tiles *
- Email *
- Phone Number
- Additional information

## API

### POST `/api/shop/for-business`

**Contact forms** (JSON):
```json
{
  "type": "hospitality" | "offices" | "galleries",
  "name": "string",
  "companyName": "string",
  "desiredTiles": "string",
  "email": "string",
  "phone": "string (optional)",
  "additionalInfo": "string (optional)"
}
```

**Gifting form** (multipart/form-data):
- `type`: "gifting"
- `cardValue`, `employeesCount`, `company`, `sendToday`, `sendDate`, `giftMessage`, `emails`
- `csvFile`: optional CSV file attachment

**Behavior**:
- Validates required fields
- Sends email to `CONTACT_EMAIL` with formatted HTML
- For gifting: attaches CSV if provided
- Returns `{ success: true }` or `{ error: string }`

## Pages

| Path | Purpose |
|------|---------|
| `/shop/for-business` | Main page with tabbed interface for all four inquiry types |

## Navigation

- Main nav: "For Business" link
- Footer RESOURCES: "For Business" link

## Data Flow

- Form submissions → API validates → Email sent to CONTACT_EMAIL
- No database storage; inquiries are delivered via email for manual follow-up

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CONTACT_EMAIL` | Recipient for B2B inquiries | info@thestreetlamp.com |

## Known Limitations

- B2B gift card purchases are not automated; requests go to the team for manual processing
- CSV parsing/validation is not performed; file is forwarded as attachment

## Future Improvements

- Automated bulk gift card provisioning
- CRM integration for lead tracking
- Discount tier validation against order amounts

## Version

- Last updated: 2026-03-04
- Version: 1.0.0
