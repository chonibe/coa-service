# COA Dashboard

A modern dashboard for customers to view their orders and manage their NFT certificates of authenticity.

## Features

- View order history with detailed information
- Claim NFC tags for purchased items
- View edition numbers and total editions
- Access digital certificates of authenticity
- Real-time order status updates

## Technical Implementation

### Authentication

The dashboard uses Supabase for authentication, with a custom middleware that handles Shopify customer authentication. When a customer visits the dashboard, they are automatically authenticated using their Shopify customer ID.

### Database Schema

The dashboard uses two main tables in Supabase:

1. `orders` - Stores order information
   - id (string)
   - name (string)
   - created_at (timestamp)
   - total_price (number)
   - financial_status (string)
   - customer_id (string)

2. `order_line_items` - Stores line item information
   - id (string)
   - order_id (string)
   - line_item_id (string)
   - title (string)
   - quantity (number)
   - price (string)
   - image_url (string, nullable)
   - nfc_tag_id (string, nullable)
   - nfc_claimed_at (timestamp, nullable)
   - certificate_url (string, nullable)
   - edition_number (number, nullable)
   - edition_total (number, nullable)
   - vendor_name (string, nullable)

### API Endpoints

The dashboard uses Supabase's built-in API endpoints for data access:

- `GET /orders` - Fetch customer's orders
- `PUT /order_line_items` - Update NFC tag claim status

### UI/UX Considerations

- Responsive design that works on all devices
- Clear order status indicators
- Easy-to-use NFC tag claiming process
- Accessible certificate viewing
- Loading states and error handling
- Modern, clean interface using Tailwind CSS

### Testing Requirements

- Unit tests for components
- Integration tests for API calls
- End-to-end tests for critical user flows
- Authentication flow testing
- Error handling testing

### Deployment Considerations

- Environment variables for API keys
- CORS configuration for Shopify integration
- SSL/TLS for secure connections
- CDN for static assets
- Monitoring and error tracking

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Shopify
NEXT_PUBLIC_SHOPIFY_STORE_URL=your-shopify-store-url
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-shopify-storefront-access-token

# Dashboard
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.thestreetlamp.com
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Known Limitations

- NFC tag claiming requires manual verification
- Certificate generation is handled externally
- Limited to Shopify customers only
- No bulk actions for multiple orders

## Future Improvements

- Add bulk NFC tag claiming
- Implement real-time order updates
- Add order filtering and search
- Support for multiple languages
- Enhanced certificate viewing experience
- Integration with additional e-commerce platforms
