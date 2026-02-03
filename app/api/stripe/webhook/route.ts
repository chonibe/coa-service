import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"
import { shopifyFetch } from "@/lib/shopify-api"
import { getTierByPriceId, MEMBERSHIP_TIERS, type MembershipTierId } from "@/lib/membership/tiers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.text()
    const sig = request.headers.get("stripe-signature") || ""

    let event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret || "")
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    // Check for idempotency - skip if already processed
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, processed')
      .eq('event_id', event.id)
      .maybeSingle()

    if (existingEvent?.processed) {
      console.log(`[webhook] Event ${event.id} already processed, skipping`)
      return NextResponse.json({ received: true, skipped: true })
    }

    // Record event for idempotency
    if (!existingEvent) {
      await supabase.from('webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
        payload: event.data.object,
        processed: false,
      })
    }

    // Handle the event
    try {
      switch (event.type) {
        case "account.updated":
          const account = event.data.object as Stripe.Account
          await handleAccountUpdated(supabase, account)
          break
        case "transfer.created":
          const transfer = event.data.object as Stripe.Transfer
          await handleTransferCreated(supabase, transfer)
          break
        case "transfer.failed":
          const failedTransfer = event.data.object as Stripe.Transfer
          await handleTransferFailed(supabase, failedTransfer)
          break
        // Handle checkout session completed for product purchases
        case "checkout.session.completed":
          const session = event.data.object as Stripe.Checkout.Session
          await handleCheckoutCompleted(supabase, session)
          break
        case "checkout.session.expired":
          const expiredSession = event.data.object as Stripe.Checkout.Session
          console.log(`Checkout session expired: ${expiredSession.id}`)
          // Update checkout_sessions table
          await supabase
            .from('checkout_sessions')
            .update({ status: 'expired' })
            .eq('session_id', expiredSession.id)
          break
          
        // ============================================
        // SUBSCRIPTION EVENTS (Membership)
        // ============================================
        case "invoice.payment_succeeded":
          const paidInvoice = event.data.object as Stripe.Invoice
          await handleInvoicePaymentSucceeded(supabase, paidInvoice)
          break
        case "invoice.payment_failed":
          const failedInvoice = event.data.object as Stripe.Invoice
          await handleInvoicePaymentFailed(supabase, failedInvoice)
          break
        case "customer.subscription.created":
          const newSubscription = event.data.object as Stripe.Subscription
          await handleSubscriptionCreated(supabase, newSubscription)
          break
        case "customer.subscription.updated":
          const updatedSubscription = event.data.object as Stripe.Subscription
          await handleSubscriptionUpdated(supabase, updatedSubscription)
          break
        case "customer.subscription.deleted":
          const deletedSubscription = event.data.object as Stripe.Subscription
          await handleSubscriptionDeleted(supabase, deletedSubscription)
          break
          
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      // Mark event as processed
      await supabase
        .from('webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('event_id', event.id)
    } catch (handlerError: any) {
      // Record error but don't fail the webhook
      console.error(`[webhook] Handler error for ${event.type}:`, handlerError)
      await supabase
        .from('webhook_events')
        .update({ error: handlerError.message || 'Unknown error' })
        .eq('event_id', event.id)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Error in Stripe webhook handler:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

/**
 * Handle checkout session completed - create Shopify draft order
 */
async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  try {
    // Only process headless storefront purchases
    if (session.metadata?.source !== 'headless_storefront') {
      console.log('Ignoring non-headless checkout session')
      return
    }

    const shopifyVariants = session.metadata?.shopify_variant_ids
    if (!shopifyVariants) {
      console.error('No Shopify variant IDs in session metadata')
      return
    }

    const variants = JSON.parse(shopifyVariants) as Array<{
      variantId: string
      variantGid: string
      quantity: number
      productHandle: string
    }>

    // Get shipping details
    const shipping = session.shipping_details
    const customer = session.customer_details

    // Create Shopify draft order via Admin API
    const draftOrderData = {
      draft_order: {
        line_items: variants.map(v => ({
          variant_id: parseInt(v.variantId),
          quantity: v.quantity,
        })),
        customer: customer?.email ? {
          email: customer.email,
        } : undefined,
        shipping_address: shipping?.address ? {
          first_name: shipping.name?.split(' ')[0] || '',
          last_name: shipping.name?.split(' ').slice(1).join(' ') || '',
          address1: shipping.address.line1 || '',
          address2: shipping.address.line2 || '',
          city: shipping.address.city || '',
          province: shipping.address.state || '',
          country: shipping.address.country || '',
          zip: shipping.address.postal_code || '',
          phone: customer?.phone || '',
        } : undefined,
        billing_address: session.customer_details?.address ? {
          first_name: customer?.name?.split(' ')[0] || '',
          last_name: customer?.name?.split(' ').slice(1).join(' ') || '',
          address1: session.customer_details.address.line1 || '',
          address2: session.customer_details.address.line2 || '',
          city: session.customer_details.address.city || '',
          province: session.customer_details.address.state || '',
          country: session.customer_details.address.country || '',
          zip: session.customer_details.address.postal_code || '',
        } : undefined,
        email: customer?.email || '',
        note: `Stripe Payment ID: ${session.payment_intent}\nStripe Session ID: ${session.id}\nSource: Headless Storefront`,
        tags: 'headless,stripe-checkout',
        use_customer_default_address: false,
      },
    }

    // Create the draft order in Shopify
    const response = await shopifyFetch('draft_orders.json', {
      method: 'POST',
      body: JSON.stringify(draftOrderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to create Shopify draft order:', errorText)
      return
    }

    const { draft_order } = await response.json()
    console.log(`Created Shopify draft order: ${draft_order.id}`)

    // Complete the draft order (mark as paid)
    const completeResponse = await shopifyFetch(`draft_orders/${draft_order.id}/complete.json`, {
      method: 'PUT',
      body: JSON.stringify({
        payment_pending: false,
      }),
    })

    if (completeResponse.ok) {
      const { draft_order: completedOrder } = await completeResponse.json()
      console.log(`Completed draft order, created order: ${completedOrder.order_id}`)

      // Record the purchase in Supabase
      await supabase.from('stripe_purchases').insert({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        shopify_draft_order_id: draft_order.id.toString(),
        shopify_order_id: completedOrder.order_id?.toString() || null,
        customer_email: customer?.email || null,
        amount_total: session.amount_total,
        currency: session.currency,
        status: 'completed',
        metadata: session.metadata,
        created_at: new Date().toISOString(),
      })
    } else {
      console.error('Failed to complete draft order')
    }
  } catch (err) {
    console.error('Error handling checkout.session.completed:', err)
  }
}

async function handleAccountUpdated(supabase: any, account: Stripe.Account) {
  try {
    // Find the vendor with this Stripe account ID
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("vendor_name")
      .eq("stripe_account_id", account.id)
      .single()

    if (error || !vendor) {
      console.error("Error finding vendor for Stripe account:", error)
      return
    }

    // Update vendor record with latest Stripe account status
    const isOnboardingComplete =
      account.details_submitted && account.payouts_enabled && !account.requirements?.currently_due?.length

    await supabase
      .from("vendors")
      .update({
        stripe_onboarding_complete: isOnboardingComplete,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_last_updated_at: new Date().toISOString(),
      })
      .eq("vendor_name", vendor.vendor_name)

    console.log(
      `Updated vendor ${vendor.vendor_name} with Stripe account status: ${isOnboardingComplete ? "Complete" : "Incomplete"}`,
    )
  } catch (err) {
    console.error("Error handling account.updated webhook:", err)
  }
}

async function handleTransferCreated(supabase: any, transfer: Stripe.Transfer) {
  try {
    // Check if this transfer is related to a vendor payout
    if (!transfer.metadata?.payout_id) {
      return
    }

    const payoutId = transfer.metadata.payout_id

    // Update the payout record with the transfer ID
    await supabase
      .from("vendor_payouts")
      .update({
        stripe_transfer_id: transfer.id,
        status: "completed",
        payout_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId)

    console.log(`Updated payout ${payoutId} with Stripe transfer ID: ${transfer.id}`)
  } catch (err) {
    console.error("Error handling transfer.created webhook:", err)
  }
}

async function handleTransferFailed(supabase: any, transfer: Stripe.Transfer) {
  try {
    // Check if this transfer is related to a vendor payout
    if (!transfer.metadata?.payout_id) {
      return
    }

    const payoutId = transfer.metadata.payout_id

    // Update the payout record with the failed status
    await supabase
      .from("vendor_payouts")
      .update({
        stripe_transfer_id: transfer.id,
        status: "failed",
        notes: `Stripe transfer failed: ${transfer.failure_message || "Unknown reason"}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId)

    console.log(`Updated payout ${payoutId} with failed Stripe transfer: ${transfer.id}`)
  } catch (err) {
    console.error("Error handling transfer.failed webhook:", err)
  }
}

// ============================================
// SUBSCRIPTION HANDLERS (Membership)
// ============================================

/**
 * Handle successful invoice payment - deposit credits for subscription renewal
 */
async function handleInvoicePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  try {
    // Only process subscription invoices
    if (!invoice.subscription) {
      console.log('[webhook] Non-subscription invoice, skipping')
      return
    }

    // Get subscription to find tier info from metadata
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const tierId = subscription.metadata?.tier_id as MembershipTierId | undefined
    const collectorIdentifier = subscription.metadata?.collector_identifier

    if (!collectorIdentifier) {
      console.error('[webhook] No collector_identifier in subscription metadata')
      return
    }

    // Get tier configuration
    const tier = tierId ? MEMBERSHIP_TIERS[tierId] : null
    const creditsToDeposit = tier?.monthlyCredits || parseInt(subscription.metadata?.monthly_credits || '0')

    if (!creditsToDeposit) {
      console.log('[webhook] No credits to deposit for this subscription')
      return
    }

    // Get collector record
    const { data: collector } = await supabase
      .from('collectors')
      .select('id')
      .eq('email', collectorIdentifier)
      .maybeSingle()

    if (!collector) {
      console.error(`[webhook] Collector not found: ${collectorIdentifier}`)
      return
    }

    // Check if this is the first invoice (subscription creation)
    const isFirstInvoice = invoice.billing_reason === 'subscription_create'

    // Add credits to ledger
    await supabase.from('collector_ledger_entries').insert({
      collector_identifier: collectorIdentifier,
      transaction_type: 'deposit',
      credits_amount: creditsToDeposit,
      usd_amount: creditsToDeposit * 0.10, // $0.10 per credit base value
      description: isFirstInvoice 
        ? `Welcome credits - ${tier?.name || 'Membership'} tier`
        : `Monthly credits - ${tier?.name || 'Membership'} tier`,
      credit_source: 'subscription',
      reference_type: 'invoice',
      reference_id: invoice.id,
    })

    // Update or create collector account balance
    const { data: account } = await supabase
      .from('collector_accounts')
      .select('id, credits_balance')
      .eq('collector_id', collector.id)
      .maybeSingle()

    if (account) {
      await supabase
        .from('collector_accounts')
        .update({ 
          credits_balance: account.credits_balance + creditsToDeposit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id)
    } else {
      await supabase.from('collector_accounts').insert({
        collector_id: collector.id,
        credits_balance: creditsToDeposit,
        usd_balance: 0,
      })
    }

    // Update subscription record with latest period info
    await supabase
      .from('collector_credit_subscriptions')
      .update({
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        status: 'active',
      })
      .eq('stripe_subscription_id', subscription.id)

    console.log(`[webhook] Deposited ${creditsToDeposit} credits for ${collectorIdentifier}`)
  } catch (err) {
    console.error('[webhook] Error handling invoice.payment_succeeded:', err)
    throw err
  }
}

/**
 * Handle failed invoice payment - mark subscription as past_due
 */
async function handleInvoicePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const collectorIdentifier = subscription.metadata?.collector_identifier

    if (!collectorIdentifier) return

    // Update subscription status
    await supabase
      .from('collector_credit_subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscription.id)

    console.log(`[webhook] Marked subscription as past_due for ${collectorIdentifier}`)

    // TODO: Send payment failed email notification
  } catch (err) {
    console.error('[webhook] Error handling invoice.payment_failed:', err)
    throw err
  }
}

/**
 * Handle new subscription created
 */
async function handleSubscriptionCreated(supabase: any, subscription: Stripe.Subscription) {
  try {
    const tierId = subscription.metadata?.tier_id as MembershipTierId | undefined
    const collectorIdentifier = subscription.metadata?.collector_identifier
    const userId = subscription.metadata?.user_id

    if (!collectorIdentifier) {
      console.error('[webhook] No collector_identifier in subscription metadata')
      return
    }

    const tier = tierId ? MEMBERSHIP_TIERS[tierId] : null
    const priceId = subscription.items.data[0]?.price?.id

    // Get collector
    const { data: collector } = await supabase
      .from('collectors')
      .select('id')
      .eq('email', collectorIdentifier)
      .maybeSingle()

    if (!collector) {
      console.error(`[webhook] Collector not found: ${collectorIdentifier}`)
      return
    }

    // Check for existing subscription record
    const { data: existingSub } = await supabase
      .from('collector_credit_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (existingSub) {
      // Update existing record
      await supabase
        .from('collector_credit_subscriptions')
        .update({
          tier: tierId,
          status: subscription.status,
          monthly_credit_amount: tier?.monthlyCredits || 0,
          stripe_customer_id: subscription.customer as string,
          stripe_price_id: priceId,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('id', existingSub.id)
    } else {
      // Create new subscription record
      await supabase.from('collector_credit_subscriptions').insert({
        collector_id: collector.id,
        tier: tierId,
        status: subscription.status,
        monthly_credit_amount: tier?.monthlyCredits || 0,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: priceId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
    }

    // Update collector with Stripe customer ID
    await supabase
      .from('collectors')
      .update({ stripe_customer_id: subscription.customer as string })
      .eq('id', collector.id)

    console.log(`[webhook] Created/updated subscription for ${collectorIdentifier}, tier: ${tierId}`)
  } catch (err) {
    console.error('[webhook] Error handling customer.subscription.created:', err)
    throw err
  }
}

/**
 * Handle subscription updates (tier change, cancellation scheduled)
 */
async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  try {
    const { data: existingSub } = await supabase
      .from('collector_credit_subscriptions')
      .select('id, tier')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (!existingSub) {
      console.log('[webhook] Subscription not found locally, creating...')
      return handleSubscriptionCreated(supabase, subscription)
    }

    const tierId = subscription.metadata?.tier_id as MembershipTierId | undefined
    const tier = tierId ? MEMBERSHIP_TIERS[tierId] : null
    const priceId = subscription.items.data[0]?.price?.id

    await supabase
      .from('collector_credit_subscriptions')
      .update({
        tier: tierId,
        status: subscription.status,
        monthly_credit_amount: tier?.monthlyCredits || 0,
        stripe_price_id: priceId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancelled_at: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000).toISOString() 
          : null,
      })
      .eq('id', existingSub.id)

    console.log(`[webhook] Updated subscription ${subscription.id}`)
  } catch (err) {
    console.error('[webhook] Error handling customer.subscription.updated:', err)
    throw err
  }
}

/**
 * Handle subscription deleted (cancelled)
 */
async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  try {
    await supabase
      .from('collector_credit_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)

    console.log(`[webhook] Cancelled subscription ${subscription.id}`)

    // TODO: Send cancellation email notification
  } catch (err) {
    console.error('[webhook] Error handling customer.subscription.deleted:', err)
    throw err
  }
}
