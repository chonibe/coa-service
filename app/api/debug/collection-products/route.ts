import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/shopify/storefront-client'
import { getCollectionProductHandlesByHandle, isAdminCollectionApiAvailable } from '@/lib/shopify/admin-collection-products'
import { getProductsByHandles } from '@/lib/shopify/storefront-client'

/**
 * Debug endpoint to see if we can find artworks in a collection.
 * GET /api/debug/collection-products?handle=jack-jc-art
 * Returns Storefront product count, Admin API handles, and whether we can fetch those products.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')?.trim()
  if (!handle) {
    return NextResponse.json(
      { error: 'Missing handle', usage: '/api/debug/collection-products?handle=jack-jc-art' },
      { status: 400 }
    )
  }

  try {
    const adminConfigured = isAdminCollectionApiAvailable()

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
      const fetched = await getProductsByHandles(handlesToFetch)
      productsFetched = {
        count: fetched.length,
        handles: fetched.map((p) => p.handle).filter(Boolean) as string[],
      }
    }

    const hint =
      adminHandles.length > 0 && productsFetched.count === 0
        ? 'Set SHOPIFY_STOREFRONT_PRIVATE_TOKEN (private Storefront API token) so unlisted products can be fetched by handle.'
        : undefined

    return NextResponse.json({
      handle,
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
