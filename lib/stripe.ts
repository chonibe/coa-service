import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-05-28.basil", // Use the latest API version
})

export default stripe

// Helper functions for common Stripe operations
export async function createStripeAccount(vendorName: string, email: string, country = "US") {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      country,
      email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: "individual",
      business_profile: {
        name: vendorName,
      },
      metadata: {
        vendor_name: vendorName,
      },
    })

    return { success: true, accountId: account.id }
  } catch (error: any) {
    console.error("Error creating Stripe account:", error)
    return { success: false, error: error.message }
  }
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    })

    return { success: true, url: accountLink.url }
  } catch (error: any) {
    console.error("Error creating account link:", error)
    return { success: false, error: error.message }
  }
}

export async function retrieveAccount(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId)
    return { success: true, account }
  } catch (error: any) {
    console.error("Error retrieving Stripe account:", error)
    return { success: false, error: error.message }
  }
}

export async function createPayout(accountId: string, amount: number, currency = "usd", metadata: any = {}) {
  try {
    // First create a transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      destination: accountId,
      metadata,
    })

    return { success: true, transferId: transfer.id }
  } catch (error: any) {
    console.error("Error creating payout:", error)
    return { success: false, error: error.message }
  }
}

export async function getAccountBalance(accountId: string) {
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    })

    return { success: true, balance }
  } catch (error: any) {
    console.error("Error getting account balance:", error)
    return { success: false, error: error.message }
  }
}

export async function listPayouts(accountId: string, limit = 10) {
  try {
    const payouts = await stripe.payouts.list(
      {
        limit,
      },
      {
        stripeAccount: accountId,
      }
    )

    return { success: true, payouts: payouts.data }
  } catch (error: any) {
    console.error("Error listing payouts:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Process multiple Stripe payouts (batch processing)
 * Note: Stripe doesn't support true batch transfers, so this processes them sequentially
 * but returns a unified result with all transfer IDs
 */
export async function createBatchPayout(
  payouts: Array<{
    accountId: string
    amount: number
    currency?: string
    metadata?: any
  }>
): Promise<{
  success: boolean
  results: Array<{
    accountId: string
    success: boolean
    transferId?: string
    error?: string
  }>
  errors?: string
}> {
  const results: Array<{
    accountId: string
    success: boolean
    transferId?: string
    error?: string
  }> = []

  let hasErrors = false
  const errors: string[] = []

  // Process each payout sequentially
  for (const payout of payouts) {
    try {
      const result = await createPayout(
        payout.accountId,
        payout.amount,
        payout.currency || "usd",
        payout.metadata
      )

      if (result.success) {
        results.push({
          accountId: payout.accountId,
          success: true,
          transferId: result.transferId,
        })
      } else {
        hasErrors = true
        errors.push(`Account ${payout.accountId}: ${result.error}`)
        results.push({
          accountId: payout.accountId,
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      hasErrors = true
      const errorMsg = error.message || "Unknown error"
      errors.push(`Account ${payout.accountId}: ${errorMsg}`)
      results.push({
        accountId: payout.accountId,
        success: false,
        error: errorMsg,
      })
    }
  }

  return {
    success: !hasErrors,
    results,
    errors: hasErrors ? errors.join("; ") : undefined,
  }
}