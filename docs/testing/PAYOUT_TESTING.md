# PayPal Payout Testing Guide

This guide explains how to test the end-to-end PayPal payout flow using the Sandbox environment.

## 1. Prerequisites

Ensure your `.env` file has the following variables set from your PayPal Developer Dashboard (REST API App):

```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_WEBHOOK_ID=your_webhook_id
```

## 2. Testing API Connectivity

Run the following script to verify that your credentials are correct and can talk to PayPal:

```bash
npx ts-node scripts/test-paypal-rest.ts
```

If successful, you should see `✅ SUCCESS: Successfully authenticated with PayPal!`.

## 3. Full Payout Flow Test

### Step A: Seed Test Data
Create a mock vendor and a fulfilled order that is ready for payout:

```bash
npx ts-node scripts/create-test-payout-data.ts
```

### Step B: Process Payout in Admin Dashboard
1. Log in to the Admin Dashboard: `https://app.thestreetcollector.com/admin/vendors/payouts`
2. Look for **"Test Artisan"** in the **Pending Payouts** list.
3. Select the payout and click **"Process Payout"**.
4. Choose **PayPal** as the payment method.
5. Once processed, note the **Batch ID** (e.g., `5W1234567890ABCD`).

### Step C: Simulate Webhook Completion
PayPal Sandbox webhooks can be slow. You can manually trigger the completion logic (status update, ledger debit, notifications) using the Batch ID from Step B:

```bash
npx ts-node scripts/simulate-payout-webhook.ts <your_batch_id>
```

## 4. Verification

After running the simulation script:
1. **Admin Dashboard**: The payout should move to the **History** tab with status `completed`.
2. **Vendor Dashboard**: Log in as the test vendor (or view their profile) to see the payment in their history.
3. **Ledger**: Check the `vendor_ledger` table in Supabase to see the corresponding withdrawal entry.
4. **Email**: Check the logs or your email service provider to verify notifications were sent.

## 5. Cleaning Up
You can manually delete the "Test Artisan" vendor and their associated records from the Supabase dashboard when finished.

