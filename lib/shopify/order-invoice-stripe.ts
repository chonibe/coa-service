/**
 * Shopify draft-order / invoice payment links use paths like:
 *   /{legacyShopSegment}/order_payment/{orderId}?secret=...
 * When the primary domain points at this Next.js app, those URLs must be handled here
 * instead of falling through to not-found → home.
 */

import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from '@/lib/env'

const ADMIN_GRAPHQL_VERSION = '2024-10'

function adminGraphqlUrl(): string {
  return `https://${SHOPIFY_SHOP}/admin/api/${ADMIN_GRAPHQL_VERSION}/graphql.json`
}

export async function shopifyAdminGraphql<T>(params: {
  query: string
  variables?: Record<string, unknown>
}): Promise<T> {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify Admin API is not configured')
  }
  const res = await fetch(adminGraphqlUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query: params.query, variables: params.variables }),
  })
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> }
  if (!res.ok) {
    throw new Error(`Shopify GraphQL HTTP ${res.status}`)
  }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }
  if (!json.data) {
    throw new Error('Shopify GraphQL returned no data')
  }
  return json.data
}

export interface OrderInvoicePayEligibility {
  orderGid: string
  numericOrderId: string
  name: string
  email: string | null
  canMarkAsPaid: boolean
  displayFinancialStatus: string
  outstandingCents: number
  currencyCode: string
}

export async function getOrderInvoicePayEligibility(
  numericOrderId: string
): Promise<OrderInvoicePayEligibility | null> {
  const id = `gid://shopify/Order/${numericOrderId}`
  const data = await shopifyAdminGraphql<{
    order: {
      id: string
      name: string
      email: string | null
      canMarkAsPaid: boolean
      displayFinancialStatus: string
      totalOutstandingSet: { shopMoney: { amount: string; currencyCode: string } }
    } | null
  }>({
    query: `#graphql
      query OrderInvoicePay($id: ID!) {
        order(id: $id) {
          id
          name
          email
          canMarkAsPaid
          displayFinancialStatus
          totalOutstandingSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }`,
    variables: { id },
  })

  const order = data.order
  if (!order) return null

  const amount = parseFloat(order.totalOutstandingSet.shopMoney.amount || '0')
  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }
  const outstandingCents = Math.round(amount * 100)

  return {
    orderGid: order.id,
    numericOrderId,
    name: order.name,
    email: order.email,
    canMarkAsPaid: order.canMarkAsPaid,
    displayFinancialStatus: order.displayFinancialStatus,
    outstandingCents,
    currencyCode: order.totalOutstandingSet.shopMoney.currencyCode.toLowerCase(),
  }
}

export async function orderMarkAsPaid(orderGid: string): Promise<{ ok: boolean; error?: string }> {
  const data = await shopifyAdminGraphql<{
    orderMarkAsPaid: {
      userErrors: Array<{ field: string[] | null; message: string }>
      order: { id: string; displayFinancialStatus: string } | null
    }
  }>({
    query: `#graphql
      mutation OrderMarkAsPaid($input: OrderMarkAsPaidInput!) {
        orderMarkAsPaid(input: $input) {
          userErrors {
            field
            message
          }
          order {
            id
            displayFinancialStatus
          }
        }
      }`,
    variables: { input: { id: orderGid } },
  })

  const payload = data.orderMarkAsPaid
  if (payload.userErrors?.length) {
    const msg = payload.userErrors.map((e) => e.message).join('; ')
    const lower = msg.toLowerCase()
    const idempotentOk =
      (lower.includes('already') && lower.includes('paid')) ||
      lower.includes('no outstanding') ||
      lower.includes('outstanding balance is zero') ||
      lower.includes('nothing outstanding')
    if (idempotentOk) {
      return { ok: true }
    }
    return { ok: false, error: msg }
  }
  return { ok: true }
}

/**
 * Validates that Shopify still accepts this hosted invoice URL on the myshopify domain.
 * Invalid/expired secrets often 302 to the storefront root.
 */
export async function validateShopifyHostedOrderPaymentUrl(
  pathname: string,
  search: string
): Promise<boolean> {
  if (!SHOPIFY_SHOP || !pathname.includes('/order_payment/')) return false
  const url = `https://${SHOPIFY_SHOP}${pathname}${search}`
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'TheStreetCollector-InvoicePay/1.0',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
    })
    if (res.status === 404) return false
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return false
      let abs: URL
      try {
        abs = new URL(loc, url)
      } catch {
        return false
      }
      const shopOrigin = new URL(`https://${SHOPIFY_SHOP}`).origin
      if (abs.origin === shopOrigin && abs.pathname === '/' && abs.search === '') {
        return false
      }
      return true
    }
    return res.status === 200
  } catch {
    return false
  }
}
