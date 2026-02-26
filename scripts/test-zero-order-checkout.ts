#!/usr/bin/env npx tsx
/**
 * Test Zero-Order Checkout Flow
 *
 * Tests: checkout/create ($0) → checkout/complete → Shopify draft order creation
 *
 * Prerequisites:
 * - Dev server running (npm run dev)
 * - checkout_sessions table exists in Supabase
 * - Shopify Admin API configured
 *
 * Usage: npx tsx scripts/test-zero-order-checkout.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { getProduct } from '../lib/shopify/storefront-client'

const root = path.join(__dirname, '..')
dotenv.config({ path: path.join(root, '.env.local') })
dotenv.config({ path: path.join(root, '.env') })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function main() {
  console.log('🧪 Zero-Order Checkout Test\n')
  console.log('Step 1: Fetching lamp product...')

  const lamp = await getProduct('street_lamp')
  if (!lamp) throw new Error('Could not fetch street_lamp product. Is Shopify configured?')
  const variantNode = lamp.variants?.edges?.[0]?.node
  if (!variantNode) throw new Error('Lamp has no variants')
  const variantGid = variantNode.id
  const variantId = variantGid.replace('gid://shopify/ProductVariant/', '')
  console.log(`   ✓ Got product: ${lamp.title} (variant ${variantId})`)

  console.log('\nStep 2: Creating checkout session (POST /api/checkout/create)...')

  const createBody = {
    items: [
      {
        productId: lamp.id.replace('gid://shopify/Product/', ''),
        variantId,
        variantGid,
        handle: lamp.handle,
        title: `${lamp.title} (Test $0)`,
        price: 0,
        quantity: 1,
        image: lamp.featuredImage?.url,
      },
    ],
  }

  const createRes = await fetch(`${BASE_URL}/api/checkout/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createBody),
  })

  const createData = await createRes.json()

  if (!createRes.ok) {
    console.error('   ✗ Create failed:', createData.error || createRes.statusText)
    process.exit(1)
  }

  if (createData.type !== 'zero_dollar' && createData.type !== 'credit_only') {
    console.error('   ✗ Expected zero_dollar flow, got:', createData.type)
    process.exit(1)
  }

  const sessionId = createData.sessionId
  console.log(`   ✓ Session created: ${sessionId}`)

  console.log('\nStep 3: Completing order (POST /api/checkout/complete)...')

  const completeRes = await fetch(`${BASE_URL}/api/checkout/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      shippingAddress: null,
      billingAddress: null,
    }),
  })

  const completeData = await completeRes.json()

  if (!completeRes.ok) {
    console.error('   ✗ Complete failed:', completeData.error || completeRes.statusText)
    process.exit(1)
  }

  console.log(`   ✓ Order created in Shopify!`)
  console.log(`   - Order ID: ${completeData.orderId}`)
  console.log(`   - Draft Order ID: ${completeData.draftOrderId}`)

  console.log(
    '\n✅ Test passed! Check Shopify Admin → Orders for the new order (tag: headless,zero-dollar-test)'
  )
}

main().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
