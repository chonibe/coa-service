import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16", // Use the latest API version
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
    const payouts = await stripe.payouts.list({
      stripeAccount: accountId,
      limit,
    })

    return { success: true, payouts: payouts.data }
  } catch (error: any) {
    console.error("Error listing payouts:", error)
    return { success: false, error: error.message }
  }
}
