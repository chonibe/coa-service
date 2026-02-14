import { NextResponse } from 'next/server'
import { getCollection, getProduct, getProducts, getCollections, isStorefrontConfigured, getStorefrontConfigStatus } from '@/lib/shopify/storefront-client'
import { homepageContent } from '@/content/homepage'

/**
 * Debug endpoint to test shop rendering and identify the exact error
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    storefrontConfigured: isStorefrontConfigured(),
    configStatus: getStorefrontConfigStatus(),
    tests: {},
  }

  // Test 1: getCollection for new releases
  try {
    const collection = await getCollection(homepageContent.newReleases.collectionHandle, { first: 2 })
    results.tests.newReleasesCollection = {
      success: true,
      hasCollection: !!collection,
      hasProducts: !!collection?.products,
      hasEdges: !!collection?.products?.edges,
      edgesLength: collection?.products?.edges?.length,
    }
  } catch (error: any) {
    results.tests.newReleasesCollection = {
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
    }
  }

  // Test 2: getProducts
  try {
    const productsResult = await getProducts({ first: 2 })
    results.tests.getProducts = {
      success: true,
      productsCount: productsResult.products?.length,
      hasPageInfo: !!productsResult.pageInfo,
    }
  } catch (error: any) {
    results.tests.getProducts = {
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
    }
  }

  // Test 3: getCollections
  try {
    const collectionsResult = await getCollections({ first: 5 })
    results.tests.getCollections = {
      success: true,
      collectionsCount: collectionsResult.collections?.length,
    }
  } catch (error: any) {
    results.tests.getCollections = {
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
    }
  }

  // Test 4: getProduct
  try {
    const product = await getProduct(homepageContent.featuredProduct.productHandle)
    results.tests.getProduct = {
      success: true,
      hasProduct: !!product,
      productTitle: product?.title,
      hasImages: !!product?.images,
      hasEdges: !!product?.images?.edges,
      edgesLength: product?.images?.edges?.length,
    }
  } catch (error: any) {
    results.tests.getProduct = {
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
    }
  }

  // Test 5: artist collection
  try {
    const collection = await getCollection('moritz-adam-schmitt', { first: 1 })
    results.tests.artistCollection = {
      success: true,
      hasCollection: !!collection,
      hasProducts: !!collection?.products,
      hasEdges: !!collection?.products?.edges,
    }
  } catch (error: any) {
    results.tests.artistCollection = {
      success: false,
      error: error.message,
    }
  }

  return NextResponse.json(results, { status: 200 })
}
