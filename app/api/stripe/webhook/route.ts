import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"
import { shopifyFetch } from "@/lib/shopify-api"
import { MEMBERSHIP_TIERS, type MembershipTierId } from "@/lib/membership/tiers"
import { getOrCreateCollectorAccount } from "@/lib/banking/account-manager"
import { CREDITS_PER_DOLLAR } from "@/lib/banking/types"
import { sendEmail } from "@/lib/email/client"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(request: NextRequest) {
  if (!endpointSecret) {
    console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const supabase = createClient()
  
  try {
    const body = await request.text()
    const sig = request.headers.get("stripe-signature") || ""

    let event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
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
        case "account.updated": {
          const account = event.data.object as Stripe.Account
          await handleAccountUpdated(supabase, account)
          break
        }
        case "transfer.created": {
          const transfer = event.data.object as Stripe.Transfer
          await handleTransferCreated(supabase, transfer)
          break
        }
        case "transfer.failed": {
          const failedTransfer = event.data.object as Stripe.Transfer
          await handleTransferFailed(supabase, failedTransfer)
          break
        }
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session
          await handleCheckoutCompleted(supabase, session)
          break
        }
        case "checkout.session.expired": {
          const expiredSession = event.data.object as Stripe.Checkout.Session
          console.log(`Checkout session expired: ${expiredSession.id}`)
          await supabase
            .from('checkout_sessions')
            .update({ status: 'expired' })
            .eq('session_id', expiredSession.id)
          break
        }
        case "invoice.payment_succeeded": {
          const paidInvoice = event.data.object as Stripe.Invoice
          await handleInvoicePaymentSucceeded(supabase, paidInvoice)
          break
        }
        case "invoice.payment_failed": {
          const failedInvoice = event.data.object as Stripe.Invoice
          await handleInvoicePaymentFailed(supabase, failedInvoice)
          break
        }
        case "customer.subscription.created": {
          const newSubscription = event.data.object as Stripe.Subscription
          await handleSubscriptionCreated(supabase, newSubscription)
          break
        }
        case "customer.subscription.updated": {
          const updatedSubscription = event.data.object as Stripe.Subscription
          await handleSubscriptionUpdated(supabase, updatedSubscription)
          break
        }
        case "customer.subscription.deleted": {
          const deletedSubscription = event.data.object as Stripe.Subscription
          await handleSubscriptionDeleted(supabase, deletedSubscription)
          break
        }
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
 * Handle checkout session completed - create Shopify draft order or provision gift card
 */
async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  try {
    const source = session.metadata?.source

    if (source === 'gift_card_purchase') {
      await handleGiftCardPurchase(supabase, session)
      return
    }

    const isHeadless = source === 'headless_storefront'
    const isExperience = source === 'experience_checkout'
    if (!isHeadless && !isExperience) {
      console.log('Ignoring non-headless/experience checkout session:', source)
      return
    }

    const shopifyVariantsRaw = session.metadata?.shopify_variant_ids
    if (!shopifyVariantsRaw) {
      console.error('No Shopify variant IDs in session metadata')
      return
    }

    // Parse compact format "variantId:qty,variantId:qty,..." (Stripe metadata max 500 chars)
    const variants = shopifyVariantsRaw.split(',').map(part => {
      const [variantId, qty] = part.split(':')
      return { variantId: variantId ?? '', quantity: parseInt(qty ?? '1', 10) }
    }).filter(v => v.variantId)

    // Get shipping details (from Stripe or metadata for experience_checkout)
    let shipping = session.shipping_details
    if (!shipping?.address && session.metadata?.shipping_address) {
      try {
        const meta = JSON.parse(session.metadata.shipping_address)
        shipping = {
          name: meta.fullName || '',
          address: {
            line1: meta.addressLine1 || '',
            line2: meta.addressLine2 || '',
            city: meta.city || '',
            state: '',
            postal_code: meta.postalCode || '',
            country: meta.country || 'US',
          },
        }
      } catch {
        console.warn('Could not parse shipping_address from metadata')
      }
    }
    const customer = session.customer_details ?? {
      email: session.metadata?.collector_email ?? session.customer_email ?? '',
      phone: '',
      address: null,
      name: '',
    }

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
        note_attributes: session.metadata?.affiliate_vendor_id
          ? [{ name: 'affiliate_vendor_id', value: String(session.metadata.affiliate_vendor_id) }]
          : undefined,
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

      // ── Persist Stripe customer ID for saved payment methods ──
      const stripeCustomerId = session.customer && typeof session.customer === 'string' ? session.customer : null
      const purchaserEmail = customer?.email?.toLowerCase()?.trim()
      if (stripeCustomerId && purchaserEmail) {
        await supabase.from('collector_profiles').update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() }).ilike('email', purchaserEmail)
        await supabase.from('collectors').update({ stripe_customer_id: stripeCustomerId }).ilike('email', purchaserEmail)
        await supabase.from('experience_quiz_signups').update({ stripe_customer_id: stripeCustomerId }).ilike('email', purchaserEmail)
      }

      // ── Post-Purchase Bridge: Create/link collector identity ──
      if (purchaserEmail) {
        try {
          await bridgePostPurchase(
            supabase,
            purchaserEmail,
            session.id,
            completedOrder.order_id?.toString() || draft_order.id.toString(),
            session.amount_total || 0,
            session.currency || 'usd',
            variants
          )
        } catch (bridgeError) {
          // Non-critical: log but don't fail the webhook
          console.error('[stripe/webhook] Post-purchase bridge error (non-critical):', bridgeError)
        }
      }
    } else {
      console.error('Failed to complete draft order')
    }
  } catch (err) {
    console.error('Error handling checkout.session.completed:', err)
  }
}

/**
 * Provision gift card after successful payment: create Stripe coupon + promotion code, store in DB, email code.
 * Idempotent: skips if gift card already exists for this session.
 */
async function handleGiftCardPurchase(supabase: any, session: Stripe.Checkout.Session) {
  const sessionId = session.id
  const amountCents = parseInt(session.metadata?.gift_card_amount_cents || '0', 10)
  const purchaserEmail = (session.customer_details?.email || session.customer_email || session.metadata?.collector_email || '').toString().toLowerCase().trim()
  const recipientEmail = (session.metadata?.recipient_email || '').toString().toLowerCase().trim() || null
  const giftCardType = (session.metadata?.gift_card_type || 'value') as string
  const giftMessage = session.metadata?.gift_message || ''
  const senderName = session.metadata?.sender_name || ''
  const sendAtRaw = session.metadata?.send_at || ''
  const sendAt = sendAtRaw ? new Date(sendAtRaw) : null
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'

  if (!amountCents || amountCents < 10) {
    console.error('[gift-card] Invalid amount:', session.metadata?.gift_card_amount_cents)
    return
  }
  if (!purchaserEmail) {
    console.error('[gift-card] No purchaser email')
    return
  }

  const { data: existing } = await supabase
    .from('gift_cards')
    .select('id, code, status')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (existing) {
    console.log('[gift-card] Already provisioned for session:', sessionId)
    return
  }

  const now = new Date()
  const isScheduled = sendAt && sendAt > now

  try {
    const coupon = await stripe.coupons.create({
      amount_off: amountCents,
      currency: 'usd',
      max_redemptions: 1,
    })
    const code = `GC-${randomAlphanumeric(8).toUpperCase()}`
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: 1,
    })

    await supabase.from('gift_cards').insert({
      code,
      stripe_coupon_id: coupon.id,
      stripe_promotion_code_id: promo.id,
      amount_cents: amountCents,
      currency: 'usd',
      purchaser_email: purchaserEmail,
      recipient_email: recipientEmail,
      status: isScheduled ? 'scheduled' : 'issued',
      stripe_session_id: sessionId,
      design: session.metadata?.gift_card_design || null,
      gift_message: giftMessage || null,
      send_at: sendAt ? sendAt.toISOString() : null,
      sender_name: senderName || null,
      gift_card_type: giftCardType || 'value',
    })

    if (!isScheduled) {
      const emailTo = recipientEmail || purchaserEmail
      const amountDollars = (amountCents / 100).toFixed(2)
      const productLabel =
        giftCardType === 'street_lamp'
          ? '1 Street Lamp'
          : giftCardType === 'season1_artwork'
            ? 'any Season 1 artwork ($40 value)'
            : `$${amountDollars}`
      const fromBlock = senderName
        ? `<p style="font-size: 14px; color: #555; font-style: italic; margin-bottom: 16px;">From: ${escapeHtml(senderName)}</p>`
        : ''
      const messageBlock = giftMessage
        ? `<p style="font-size: 16px; color: #444; line-height: 1.6; margin: 16px 0; padding: 16px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #1a1a1a;">${escapeHtml(giftMessage)}</p>`
        : ''

      await sendEmail({
        to: emailTo,
        subject: `Your Gift Card from The Street Collector${senderName ? ` — From ${senderName}` : ''}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">
              Your Gift Card
            </h1>
            ${fromBlock}
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 16px;">
              You&apos;ve received a gift card worth ${productLabel}. Use it at checkout when purchasing from The Street Collector.
            </p>
            ${messageBlock}
            <p style="font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #1a1a1a; margin: 24px 0; padding: 16px; background: #f5f5f5; border-radius: 8px; text-align: center;">
              ${code}
            </p>
            <p style="font-size: 14px; color: #777; line-height: 1.6;">
              To redeem: Add items to your cart, go to checkout, and enter this code in the &quot;Add Promo Code or Gift Card&quot; field.
            </p>
            <a href="${baseUrl}/shop" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-top: 16px;">
              Shop Now
            </a>
            <p style="font-size: 12px; color: #999; margin-top: 24px;">
              This code can only be used once. Delivered by email, this gift card never expires. Questions? <a href="${baseUrl}/shop/contact">Contact us</a>
            </p>
          </div>
        `,
      })
      console.log('[gift-card] Provisioned and emailed:', code)
    } else {
      console.log('[gift-card] Provisioned (scheduled for', sendAt?.toISOString(), '):', code)
    }
  } catch (err: any) {
    console.error('[gift-card] Provisioning failed:', err)
    await supabase.from('gift_cards').insert({
      code: `PENDING-${sessionId.slice(-12)}`,
      amount_cents: amountCents,
      currency: 'usd',
      purchaser_email: purchaserEmail,
      recipient_email: recipientEmail,
      status: 'provisioning_failed',
      stripe_session_id: sessionId,
      error_message: err?.message || 'Unknown error',
    })
    await sendEmail({
      to: purchaserEmail,
      subject: 'Gift Card – Delayed Delivery',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">
            Your gift card is being prepared
          </h1>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Thank you for your purchase. There was a slight delay in preparing your gift card. Our team has been notified and will send you the code shortly. If you don't receive it within 24 hours, please contact us.
          </p>
          <a href="${baseUrl}/shop/contact" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-top: 16px;">
            Contact Support
          </a>
        </div>
      `,
    })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function randomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Post-purchase bridge: Ensures every purchase creates or links a collector identity.
 *
 * 1. Auto-creates Supabase auth user if none exists (email-confirmed, no password)
 * 2. Creates/updates collector_profiles linked to user_id
 * 3. Ensures collector role in user_roles and collector_avatars
 * 4. Creates collector_accounts for banking
 * 5. Deposits credits
 * 6. Sends "View your order" email with magic link for one-click sign-in
 */
async function bridgePostPurchase(
  supabase: any,
  email: string,
  stripeSessionId: string,
  orderId: string,
  amountTotalCents: number,
  currency: string,
  variants: Array<{ variantId: string; variantGid: string; quantity: number; productHandle: string }>
) {
  console.log(`[post-purchase] Bridging purchase for ${email}, order: ${orderId}`)

  const normalizedEmail = email.toLowerCase().trim()

  // 1. Get or create auth user
  let userId: string | null = null
  const { data: existingProfile } = await supabase
    .from('collector_profiles')
    .select('id, user_id, email')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingProfile?.user_id) {
    userId = existingProfile.user_id
    console.log(`[post-purchase] Existing collector found: ${normalizedEmail}`)
  } else {
    // Try to create auth user (no password, email pre-confirmed)
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
    })

    if (createData?.user) {
      userId = createData.user.id
      console.log(`[post-purchase] Created auth user for ${normalizedEmail}`)
    } else if (createError) {
      // User may already exist (e.g. from OAuth) - try to find them
      const isDuplicate = /already|registered|exists/i.test(createError.message || '')
      if (isDuplicate) {
        const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
        const existingUser = listData?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === normalizedEmail)
        if (existingUser) {
          userId = existingUser.id
          console.log(`[post-purchase] Found existing auth user for ${normalizedEmail}`)
        }
      }
      if (!userId) {
        console.warn('[post-purchase] Could not create or find auth user:', createError.message)
      }
    }
  }

  // 2. Create or update collector profile with user_id (only when we have userId)
  if (userId) {
    if (!existingProfile) {
      const { error: profileError } = await supabase.from('collector_profiles').insert({
        email: normalizedEmail,
        user_id: userId,
        signup_source: 'purchase',
        onboarding_step: 0,
        onboarding_completed_at: null,
      })

      if (profileError) {
        if (!profileError.message?.includes('duplicate') && profileError.code !== '23505') {
          console.error('[post-purchase] Profile creation error:', profileError)
        } else {
          // Race: profile created elsewhere, update with user_id
          await supabase
            .from('collector_profiles')
            .update({ user_id: userId, updated_at: new Date().toISOString() })
            .eq('email', normalizedEmail)
        }
      } else {
        console.log(`[post-purchase] Created collector profile for ${normalizedEmail}`)
      }
    } else if (existingProfile.user_id === null) {
      // Link stub profile to auth user
      await supabase
        .from('collector_profiles')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq('email', normalizedEmail)
      console.log(`[post-purchase] Linked collector profile to auth user for ${normalizedEmail}`)
    }
  }

  // 3. Ensure collector role in user_roles
  if (userId) {
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'collector')
      .maybeSingle()

    if (!existingRole) {
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'collector',
        is_active: true,
        metadata: { source: 'purchase_auto_signup', email: normalizedEmail, signup_date: new Date().toISOString() },
      })
      if (roleError && !roleError.message?.includes('duplicate') && roleError.code !== '23505') {
        console.warn('[post-purchase] Role creation failed (non-critical):', roleError.message)
      } else if (!roleError) {
        console.log(`[post-purchase] Collector role created for ${normalizedEmail}`)
      }
    }

    // 4. Ensure collector_avatars (InkOGatchi) - non-critical
    const { error: avatarError } = await supabase
      .from('collector_avatars')
      .insert({ user_id: userId, equipped_items: {} })
    if (avatarError && !avatarError.message?.includes('duplicate') && avatarError.code !== '23505') {
      console.warn('[post-purchase] Avatar creation failed (non-critical):', avatarError.message)
    }
  }

  // 5. Ensure banking account exists
  try {
    await getOrCreateCollectorAccount(normalizedEmail, 'customer')
    console.log(`[post-purchase] Banking account ensured for ${normalizedEmail}`)
  } catch (accountError) {
    console.error('[post-purchase] Banking account creation error:', accountError)
  }

  // 6. Deposit credits
  const amountDollars = amountTotalCents / 100
  const creditsToDeposit = Math.round(amountDollars * CREDITS_PER_DOLLAR)

  if (creditsToDeposit > 0) {
    const { data: existingCredit } = await supabase
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', normalizedEmail)
      .eq('transaction_type', 'credit_earned')
      .eq('order_id', orderId)
      .maybeSingle()

    if (!existingCredit) {
      const { error: ledgerError } = await supabase.from('collector_ledger_entries').insert({
        collector_identifier: normalizedEmail,
        transaction_type: 'credit_earned',
        amount: creditsToDeposit,
        currency: 'CREDITS',
        order_id: orderId,
        description: `Credits earned from purchase: $${amountDollars.toFixed(2)}`,
        created_by: 'system',
        metadata: {
          stripe_session_id: stripeSessionId,
          order_id: orderId,
          price_usd: amountDollars,
          credits_per_dollar: CREDITS_PER_DOLLAR,
          source: 'checkout_completed',
        },
      })

      if (ledgerError) {
        console.error('[post-purchase] Credit deposit error:', ledgerError)
      } else {
        console.log(`[post-purchase] Deposited ${creditsToDeposit} credits for ${normalizedEmail}`)
      }
    } else {
      console.log(`[post-purchase] Credits already deposited for order ${orderId}`)
    }
  }

  // 7. Send "View your order" email with magic link (one-click sign-in)
  try {
    let signInUrl: string | null = null

    if (userId) {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'}/collector/dashboard`,
        },
      })
      // generateLink returns { user, properties: { action_link, ... } } or { action_link }
      signInUrl = linkData?.properties?.action_link || (linkData as { action_link?: string })?.action_link || null
    }

    const itemSummary = variants.map((v) => `${v.productHandle} (×${v.quantity})`).join(', ')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com'

    const ctaUrl = signInUrl || `${baseUrl}/login?email=${encodeURIComponent(normalizedEmail)}&redirect=/collector/dashboard`
    const ctaText = signInUrl ? 'View Your Order & Track Shipping' : 'Log In to View Your Order'

    await sendEmail({
      to: normalizedEmail,
      subject: 'Your artwork is on its way!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">
            Your artwork is on its way!
          </h1>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 12px;">
            Thank you for your purchase. You earned <strong>${creditsToDeposit} credits</strong> with this order.
          </p>
          <p style="font-size: 14px; color: #777; margin-bottom: 24px;">
            Items: ${itemSummary}
          </p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 24px;">
            ${signInUrl ? 'Click below to sign in and track your order, view your collection, and manage your account.' : 'Log in with your email to view your order and track shipping.'}
          </p>
          <a href="${ctaUrl}" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${ctaText}
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 24px;">
            ${signInUrl ? 'This link expires in 1 hour. You can also log in anytime at ' + baseUrl + '/login with your email.' : 'Go to ' + baseUrl + '/login and enter your email to receive a sign-in link.'}
          </p>
        </div>
      `,
    })
    console.log(`[post-purchase] Order confirmation email sent to ${normalizedEmail}`)
  } catch (emailError) {
    console.error('[post-purchase] Order confirmation email error (non-critical):', emailError)
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
