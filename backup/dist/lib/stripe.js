"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeAccount = createStripeAccount;
exports.createAccountLink = createAccountLink;
exports.retrieveAccount = retrieveAccount;
exports.createPayout = createPayout;
exports.getAccountBalance = getAccountBalance;
exports.listPayouts = listPayouts;
const stripe_1 = __importDefault(require("stripe"));
// Initialize Stripe with your secret key
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2023-10-16", // Use the latest API version
});
exports.default = stripe;
// Helper functions for common Stripe operations
async function createStripeAccount(vendorName, email, country = "US") {
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
        });
        return { success: true, accountId: account.id };
    }
    catch (error) {
        console.error("Error creating Stripe account:", error);
        return { success: false, error: error.message };
    }
}
async function createAccountLink(accountId, refreshUrl, returnUrl) {
    try {
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: "account_onboarding",
        });
        return { success: true, url: accountLink.url };
    }
    catch (error) {
        console.error("Error creating account link:", error);
        return { success: false, error: error.message };
    }
}
async function retrieveAccount(accountId) {
    try {
        const account = await stripe.accounts.retrieve(accountId);
        return { success: true, account };
    }
    catch (error) {
        console.error("Error retrieving Stripe account:", error);
        return { success: false, error: error.message };
    }
}
async function createPayout(accountId, amount, currency = "usd", metadata = {}) {
    try {
        // First create a transfer to the connected account
        const transfer = await stripe.transfers.create({
            amount: Math.round(amount * 100), // Stripe uses cents
            currency,
            destination: accountId,
            metadata,
        });
        return { success: true, transferId: transfer.id };
    }
    catch (error) {
        console.error("Error creating payout:", error);
        return { success: false, error: error.message };
    }
}
async function getAccountBalance(accountId) {
    try {
        const balance = await stripe.balance.retrieve({
            stripeAccount: accountId,
        });
        return { success: true, balance };
    }
    catch (error) {
        console.error("Error getting account balance:", error);
        return { success: false, error: error.message };
    }
}
async function listPayouts(accountId, limit = 10) {
    try {
        const payouts = await stripe.payouts.list({
            stripeAccount: accountId,
            limit,
        });
        return { success: true, payouts: payouts.data };
    }
    catch (error) {
        console.error("Error listing payouts:", error);
        return { success: false, error: error.message };
    }
}
