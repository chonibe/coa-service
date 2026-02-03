# Shipping Notifications System

**Date:** 2026-02-03  
**Feature:** Automatic tracking link emails and stage-based shipping notifications

## Summary

Implemented a comprehensive shipping notifications system that:
1. Sends tracking link immediately when a new order is placed
2. Sends periodic notifications at meaningful shipping stages
3. Displays status history in admin order notes

## Implementation Checklist

- [x] [Create `order_status_notes` table migration](../../../supabase/migrations/20260203000000_order_status_notes.sql)
- [x] [Create order confirmation email template](../../../lib/notifications/order-confirmation.ts)
- [x] [Modify Shopify order webhook to create tracking link and send confirmation](../../../app/api/webhooks/shopify/orders/route.ts)
- [x] [Update auto-fulfill with stage detection and stage-specific emails](../../../app/api/warehouse/orders/auto-fulfill/route.ts)
- [x] [Add stage constants and messaging to tracking-link module](../../../lib/notifications/tracking-link.ts)
- [x] [Create API endpoint for fetching order status notes](../../../app/api/admin/orders/[orderId]/notes/route.ts)
- [x] [Create OrderStatusHistory component](../../../app/admin/orders/[orderId]/OrderStatusHistory.tsx)
- [x] [Add status history to OrderDetails page](../../../app/admin/orders/[orderId]/OrderDetails.tsx)

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20260203000000_order_status_notes.sql` | Database table for storing shipping status notes |
| `lib/notifications/order-confirmation.ts` | Order confirmation email template with tracking link |
| `app/api/admin/orders/[orderId]/notes/route.ts` | API for fetching and adding order status notes |
| `app/admin/orders/[orderId]/OrderStatusHistory.tsx` | Timeline component showing shipping status history |

## Files Modified

| File | Changes |
|------|---------|
| `lib/notifications/tracking-link.ts` | Added stage constants, stage-specific messaging, exported helper functions |
| `app/api/webhooks/shopify/orders/route.ts` | Creates tracking link and sends confirmation email on new paid orders |
| `app/api/warehouse/orders/auto-fulfill/route.ts` | Stage-based notification detection, only sends emails on meaningful status changes |
| `app/admin/orders/[orderId]/OrderDetails.tsx` | Added OrderStatusHistory component |

## Notification Stages

| Stage | Trigger | Email Subject |
|-------|---------|---------------|
| Order Placed | Shopify webhook (paid order) | "Order Confirmed - #1234" |
| Shipped | warehouse status=3 | "Your order has shipped" |
| In Transit | track_status=101 | "Your package is in transit" |
| Out for Delivery | track_status=112 | "Out for delivery today" |
| Delivered | track_status=121 | "Your package has been delivered" |
| Alert | track_status=131 | "Delivery alert - action may be required" |

## Database Schema

```sql
CREATE TABLE order_status_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  order_name TEXT,
  status_code INTEGER,
  status_name TEXT,
  track_status_code INTEGER,
  track_status_name TEXT,
  tracking_number TEXT,
  note TEXT,
  source TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Key Features

1. **Duplicate Prevention**: Uses `last_notified_status` to prevent sending duplicate emails for the same stage
2. **Stage-Specific Messaging**: Each shipping stage has custom emoji, headline, and description
3. **Admin Visibility**: Status history timeline in admin order detail view with manual note capability
4. **Automatic Tracking Links**: Created on order placement (Shopify webhook) and on shipment (auto-fulfill)

## Testing

To test the system:
1. Place a test order through Shopify - should receive confirmation email with tracking link
2. Run auto-fulfill cron job with a test order - should receive stage-specific email
3. Check admin order detail page for status history timeline
4. Add manual notes through the admin UI

## Related Documentation

- [China Division API Client](../../../lib/chinadivision/client.ts)
- [Tracking Page](../../../app/track/[token]/page.tsx)
- [Auto-Fulfill Endpoint](../../../app/api/warehouse/orders/auto-fulfill/route.ts)
