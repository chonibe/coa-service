# Customer Preview Feature

## Overview
The Customer Preview feature provides a standalone interface for customers to view their orders and certificates of authenticity. This feature is designed to be accessible without requiring admin portal access, making it more user-friendly for regular customers.

## Implementation Checklist

### Completed Items
1. ✅ Created main customer preview page (`page.tsx`)
   - Implemented order list display
   - Added search functionality
   - Integrated order details and line items
   - Added responsive design

2. ✅ Implemented certificate modal (`certificate-modal.tsx`)
   - Created 3D card flip animation
   - Added artwork display
   - Implemented certificate details view
   - Added responsive design

3. ✅ Set up API endpoint (`/api/customer/orders/route.ts`)
   - Implemented authentication check
   - Added order fetching logic
   - Integrated with Supabase
   - Added error handling

4. ✅ Added UI components
   - Implemented floating card design
   - Added shimmer effects
   - Created status indicators
   - Integrated loading states

### Pending Items
1. 🔄 Add offline support
   - Implement service worker
   - Add local storage caching
   - Handle offline state UI
   - Sync data when online

2. 🔄 Implement real-time updates
   - Add Supabase real-time subscriptions
   - Update UI on data changes
   - Handle connection states
   - Add reconnection logic

3. 🔄 Add order filtering options
   - Implement date range filter
   - Add status filter
   - Create vendor filter
   - Add price range filter

4. 🔄 Enhance certificate sharing
   - Add social media sharing
   - Implement email sharing
   - Create shareable links
   - Add QR code generation

5. 🔄 Add print functionality
   - Create print layout
   - Add print button
   - Handle print styles
   - Support multiple formats

6. 🔄 Implement order tracking
   - Add tracking status display
   - Create tracking timeline
   - Implement delivery updates
   - Add shipping notifications

## Technical Implementation

### Components
1. `page.tsx` - Main customer preview page
   - Displays list of customer orders
   - Provides search functionality
   - Shows order details and line items
   - Integrates with certificate modal

2. `certificate-modal.tsx` - Certificate of Authenticity viewer
   - Interactive 3D card flip animation
   - Displays artwork and certificate details
   - Responsive design for all screen sizes

### API Endpoints
- `GET /api/customer/orders`
  - Fetches orders for the authenticated customer
  - Returns order details with line items
  - Requires authentication
  - Uses Supabase for data storage

### Data Structure
```typescript
interface Order {
  id: string
  name: string
  created_at: string
  line_items: LineItem[]
}

interface LineItem {
  id: string
  order_id: string
  name: string
  description: string | null
  price: number
  quantity: number
  vendor_name: string | null
  status: string
  created_at: string
  img_url: string | null
  edition_number: number | null
  edition_total: number | null
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
}
```

### UI/UX Considerations
- Modern, dark theme design
- Responsive layout for all screen sizes
- Interactive 3D animations for better engagement
- Clear status indicators for order items
- Easy-to-use search functionality
- Smooth transitions and loading states

### Authentication
- Uses Supabase authentication
- Requires valid user session
- Secure API endpoints

### Dependencies
- Next.js
- Supabase
- Framer Motion
- Tailwind CSS
- Shadcn UI components

## Testing Requirements
1. Authentication flow
2. Order data fetching
3. Search functionality
4. Certificate modal interactions
5. Responsive design
6. Error handling

## Deployment Considerations
- Ensure proper environment variables are set
- Configure Supabase authentication
- Set up proper CORS policies
- Enable proper caching strategies

## Known Limitations
- Requires active internet connection
- Image loading depends on external URLs
- Certificate dates are client-side generated

## Future Improvements
1. Add offline support
2. Implement real-time updates
3. Add order filtering options
4. Enhance certificate sharing capabilities
5. Add print functionality for certificates
6. Implement order tracking features 