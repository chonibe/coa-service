/**
 * Payout Notification Service
 * Handles sending emails and creating in-app notifications for payout events
 */

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { generatePayoutProcessedEmail, type PayoutProcessedEmailData } from '@/lib/email/templates/payout-processed'
import { generatePayoutFailedEmail, type PayoutFailedEmailData } from '@/lib/email/templates/payout-failed'
import { generatePayoutPendingReminderEmail, type PayoutPendingReminderData } from '@/lib/email/templates/payout-pending-reminder'
import { generateRefundDeductionEmail, type RefundDeductionEmailData } from '@/lib/email/templates/refund-deduction'

/**
 * Check if vendor has email notifications enabled for a specific type
 */
async function shouldSendEmail(vendorName: string, notificationType: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data: preferences } = await supabase
    .from('vendor_notification_preferences')
    .select('email_enabled, payout_processed')
    .eq('vendor_name', vendorName)
    .single()

  if (!preferences) {
    // Default: send emails if preferences don't exist
    return true
  }

  if (!preferences.email_enabled) {
    return false
  }

  // Check specific preference for payout notifications
  return preferences.payout_processed !== false
}

/**
 * Create in-app notification for vendor
 */
async function createInAppNotification(
  vendorName: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createClient()
  
  await supabase
    .from('vendor_notifications')
    .insert({
      vendor_name: vendorName,
      type,
      title,
      message,
      link,
      metadata: metadata || {},
      is_read: false,
    })
}

/**
 * Send payout processed notification
 */
export async function notifyPayoutProcessed(
  vendorName: string,
  data: PayoutProcessedEmailData
): Promise<void> {
  const supabase = createClient()
  
  // Get vendor email
  const { data: vendor } = await supabase
    .from('vendors')
    .select('paypal_email, contact_email')
    .eq('vendor_name', vendorName)
    .single()

  const vendorEmail = vendor?.contact_email || vendor?.paypal_email

  // Create in-app notification
  await createInAppNotification(
    vendorName,
    'payout_processed',
    'Payout Processed',
    `Your payout of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' }).format(data.amount)} has been processed.`,
    `/vendor/dashboard/payouts`,
    {
      payoutAmount: data.amount,
      reference: data.reference,
      invoiceNumber: data.invoiceNumber,
    }
  )

  // Send email if enabled
  if (vendorEmail && (await shouldSendEmail(vendorName, 'payout_processed'))) {
    const html = generatePayoutProcessedEmail(data)
    await sendEmail({
      to: vendorEmail,
      subject: `Payout Processed - ${data.reference}`,
      html,
    })
  }
}

/**
 * Send payout failed notification
 */
export async function notifyPayoutFailed(
  vendorName: string,
  data: PayoutFailedEmailData
): Promise<void> {
  const supabase = createClient()
  
  // Get vendor email
  const { data: vendor } = await supabase
    .from('vendors')
    .select('paypal_email, contact_email')
    .eq('vendor_name', vendorName)
    .single()

  const vendorEmail = vendor?.contact_email || vendor?.paypal_email

  // Create in-app notification
  await createInAppNotification(
    vendorName,
    'payout_failed',
    'Payout Failed',
    `Your payout of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' }).format(data.amount)} failed: ${data.errorMessage}`,
    `/vendor/dashboard/payouts`,
    {
      payoutAmount: data.amount,
      reference: data.reference,
      errorMessage: data.errorMessage,
    }
  )

  // Send email if enabled
  if (vendorEmail && (await shouldSendEmail(vendorName, 'payout_failed'))) {
    const html = generatePayoutFailedEmail(data)
    await sendEmail({
      to: vendorEmail,
      subject: `Payout Failed - ${data.reference}`,
      html,
    })
  }
}

/**
 * Send payout pending reminder
 */
export async function notifyPayoutPending(
  vendorName: string,
  data: PayoutPendingReminderData
): Promise<void> {
  const supabase = createClient()
  
  // Get vendor email
  const { data: vendor } = await supabase
    .from('vendors')
    .select('paypal_email, contact_email')
    .eq('vendor_name', vendorName)
    .single()

  const vendorEmail = vendor?.contact_email || vendor?.paypal_email

  // Create in-app notification
  await createInAppNotification(
    vendorName,
    'payout_pending',
    'Pending Payout Reminder',
    `You have ${data.pendingItems} items pending payout totaling ${new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' }).format(data.pendingAmount)}.`,
    `/vendor/dashboard/payouts`,
    {
      pendingAmount: data.pendingAmount,
      pendingItems: data.pendingItems,
    }
  )

  // Send email if enabled
  if (vendorEmail && (await shouldSendEmail(vendorName, 'payout_pending'))) {
    const html = generatePayoutPendingReminderEmail(data)
    await sendEmail({
      to: vendorEmail,
      subject: `Pending Payout Reminder - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' }).format(data.pendingAmount)}`,
      html,
    })
  }
}

/**
 * Send refund deduction notification
 */
export async function notifyRefundDeduction(
  vendorName: string,
  data: RefundDeductionEmailData
): Promise<void> {
  const supabase = createClient()
  
  // Get vendor email
  const { data: vendor } = await supabase
    .from('vendors')
    .select('paypal_email, contact_email')
    .eq('vendor_name', vendorName)
    .single()

  const vendorEmail = vendor?.contact_email || vendor?.paypal_email

  // Create in-app notification
  await createInAppNotification(
    vendorName,
    'refund_deduction',
    'Refund Deduction',
    `A ${data.refundType} refund was processed for order ${data.orderName || data.orderId}. ${new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' }).format(data.deductionAmount)} has been deducted from your payout balance.`,
    `/vendor/dashboard/payouts`,
    {
      orderId: data.orderId,
      refundType: data.refundType,
      deductionAmount: data.deductionAmount,
      newBalance: data.newBalance,
    }
  )

  // Send email if enabled
  if (vendorEmail && (await shouldSendEmail(vendorName, 'refund_deduction'))) {
    const html = generateRefundDeductionEmail(data)
    await sendEmail({
      to: vendorEmail,
      subject: `Refund Deduction Notice - Order ${data.orderName || data.orderId}`,
      html,
    })
  }
}

