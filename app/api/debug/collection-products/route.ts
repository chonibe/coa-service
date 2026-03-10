import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCollection } from '@/lib/shopify/storefront-client'
import { getCollectionProductHandlesByHandle, isAdminCollectionApiAvailable } from '@/lib/shopify/admin-collection-products'
import { getProductsByHandles } from '@/lib/shopify/storefront-client'
import { guardAdminRequest } from "@/lib/auth-guards"

/**
 * Debug endpoint to see if we can find artworks in a collection.
 * GET /api/debug/collection-products?handle=jack-jc-art
 * Returns Storefront product count, Admin API handles, and whether we can fetch those products.
 */
const DEFAULT_DEBUG_HANDLE = 'jack-jc-art'

export async function GET(request: NextRequest) {
  const guardResult = guardAdminRequest(request)
  if (guardResult.kind !== "ok") {
    return guardResult.response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const handle = searchParams.get('handle')?.trim() || DEFAULT_DEBUG_HANDLE

  try {
    const adminConfigured = isAdminCollectionApiAvailable()
    const privateTokenSet = Boolean(process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN)

    const [storefrontCollection, adminHandles] = await Promise.all([
      getCollection(handle, { first: 100 }),
      adminConfigured ? getCollectionProductHandlesByHandle(handle) : Promise.resolve([]),
    ])

    const storefrontProducts = storefrontCollection?.products?.edges?.map((e) => e.node) ?? []
    const storefrontHandles = storefrontProducts
      .filter((p) => p.handle && p.handle !== 'street_lamp' && !p.handle.startsWith('street-lamp'))
      .map((p) => p.handle as string)

    const handlesToFetch = adminHandles.length > 0 ? adminHandles : storefrontHandles
    let productsFetched: { count: number; handles: string[] } = { count: 0, handles: [] }
    if (handlesToFetch.length > 0) {
      const fetched = await getProductsByHandles(handlesToFetch, { preferPrivateToken: adminHandles.length > 0 })
      productsFetched = {
        count: fetched.length,
        handles: fetched.map((p) => p.handle).filter(Boolean) as string[],
      }
    }

    const hint =
      adminHandles.length > 0 && productsFetched.count === 0
        ? privateTokenSet
          ? 'Private token is set but Storefront returned 0 products. Check token has unlisted access (e.g. private/custom app token).'
          : 'Set SHOPIFY_STOREFRONT_PRIVATE_TOKEN in Vercel (Production). For local: vercel env pull .env.local --environment=production'
        : undefined

    return NextResponse.json({
      handle,
      privateTokenSet,
      storefront: {
        collectionFound: !!storefrontCollection,
        collectionId: storefrontCollection?.id ?? null,
        productCount: storefrontProducts.length,
        productHandles: storefrontHandles,
      },
      admin: {
        configured: adminConfigured,
        handlesFromAdmin: adminHandles,
        handleCount: adminHandles.length,
      },
      productsFetched,
      summary:
        adminHandles.length > 0
          ? `Admin API found ${adminHandles.length} product(s); Storefront fetched ${productsFetched.count} by handle.`
          : storefrontHandles.length > 0
            ? `Storefront collection has ${storefrontHandles.length} product(s).`
            : 'No products found. If collection has unlisted products, set SHOPIFY_ACCESS_TOKEN for Admin API.',
      ...(hint ? { hint } : {}),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message, handle }, { status: 500 })
  }
}
