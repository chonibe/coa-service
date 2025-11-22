# Payout System Automation & Notifications Plan

## Overview

Transform the payout system from manual to fully automated with scheduled payouts, email notifications, PayPal webhook integration, and automated invoice delivery.

## 1. Email Service Integration

- [x] **Install Email Library**: Add Resend (recommended for Next.js) or SendGrid
- [x] **Create Email Service**: `lib/email/client.ts` for email sending
- [x] **Create Email Templates**: HTML templates for payout notifications
- [x] **Environment Variables**: Add email API key to `.env` (documented, needs to be set)

## 2. Automated Payout Scheduling

- [x] **Database Schema**: Create `payout_schedules` table
  - Fields: `id`, `vendor_name`, `schedule_type` (weekly/monthly), `day_of_week`/`day_of_month`, `enabled`, `minimum_amount`, `last_run`, `next_run`
- [x] **Cron Job**: Create `/api/cron/process-scheduled-payouts/route.ts`
- [x] **Scheduling Logic**: Check for vendors with pending payouts meeting schedule criteria
- [x] **Admin UI**: Add schedule management to payout settings page
- [x] **Vercel Cron Config**: Add to `vercel.json` for scheduled execution

## 3. Email Notifications

- [x] **Notification Service**: Create `lib/notifications/payout-notifications.ts`
- [x] **Email Templates**:
  - Payout processed (with invoice attachment)
  - Payout pending (reminder)
  - Payout failed (with error details)
  - Refund deduction notification
- [x] **Integration Points**:
  - After payout processing (success/failure)
  - When PayPal status updates
  - When refunds are processed
  - Scheduled reminders for pending payouts
- [x] **Respect Preferences**: Check `vendor_notification_preferences` table

## 4. PayPal Webhook Integration

- [x] **Webhook Endpoint**: Create `/api/webhooks/paypal/route.ts`
- [x] **Webhook Verification**: Verify PayPal webhook signatures (basic structure, full verification needs PayPal cert)
- [x] **Event Handlers**:
  - `PAYMENT.PAYOUTSBATCH.SUCCESS` - Update payout to completed
  - `PAYMENT.PAYOUTSBATCH.DENIED` - Update payout to failed
  - `PAYMENT.PAYOUTSBATCH.PROCESSING` - Update payout to processing
- [x] **Auto-Update Status**: Update `vendor_payouts` table automatically
- [x] **Trigger Notifications**: Send email when status changes
- [x] **Invoice Generation**: Auto-generate and email invoice on completion

## 5. Automated Invoice Delivery

- [x] **Invoice Email Service**: Create `lib/invoices/email-service.ts`
- [x] **PDF Attachment**: Attach generated invoice to email
- [x] **Email Template**: Professional invoice email with download link
- [x] **Auto-Send**: Trigger on payout completion (via webhook or status check)
- [ ] **Fallback**: Manual send option in admin UI (future enhancement)

## 6. Notification System Integration

- [x] **Create In-App Notifications**: Use existing `vendor_notifications` table
- [x] **Notification Service**: Create `lib/notifications/payout-notifications.ts` (includes notification creation)
- [x] **Notification Types**:
  - `payout_processed` - When payout completes
  - `payout_failed` - When payout fails
  - `payout_pending` - Reminder for pending payouts
  - `refund_deduction` - When refund affects balance
- [x] **Vendor Dashboard**: Display notifications in vendor portal

## 7. Admin UI Enhancements

- [x] **Schedule Management**: Add to `/admin/vendors/payouts/schedules` page
  - Enable/disable auto-payout per vendor
  - Set schedule (weekly/monthly)
  - Set minimum payout amount threshold
- [ ] **Notification Settings**: Add notification preferences UI (future enhancement)
- [ ] **Email Log**: View sent emails and delivery status (future enhancement)
- [ ] **Webhook Status**: Display PayPal webhook delivery status (future enhancement)

## Implementation Checklist

1. [x] Install Resend package: `npm install resend`
2. [x] Create `lib/email/client.ts` for email service
3. [x] Create email templates in `lib/email/templates/`
4. [x] Create database migration for `payout_schedules` table
5. [x] Create `/api/cron/process-scheduled-payouts/route.ts`
6. [x] Add cron job to `vercel.json`
7. [x] Create `lib/notifications/payout-notifications.ts`
8. [x] Create email templates for all notification types
9. [x] Create `/api/webhooks/paypal/route.ts`
10. [x] Implement PayPal webhook signature verification (basic structure)
11. [x] Create event handlers for PayPal webhook events
12. [x] Create `lib/invoices/email-service.ts`
13. [x] Integrate email sending into payout process
14. [x] Create notification creation service
15. [x] Update vendor dashboard to show notifications
16. [x] Add schedule management UI to admin payout page
17. [ ] Add notification preferences UI (future enhancement)
18. [ ] Test automated payout flow end-to-end
19. [ ] Test email delivery and templates
20. [ ] Test PayPal webhook integration
21. [x] Update documentation with new features

## Technical Details

### Email Service Choice
- **Resend** recommended for Next.js (simple API, good deliverability)
- Alternative: SendGrid (more features, more complex)

### Cron Scheduling
- Use Vercel Cron Jobs (serverless, reliable)
- Schedule: Daily check for scheduled payouts
- Time: 9 AM UTC (configurable)

### PayPal Webhook Setup
- Register webhook URL in PayPal Developer Dashboard
- Verify webhook secret in environment variables
- Handle retry logic for failed webhook deliveries

### Notification Preferences
- Use existing `vendor_notification_preferences` table
- Default: Email enabled for payout_processed
- Allow vendors to opt-out via settings

