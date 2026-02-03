import { NextRequest, NextResponse } from 'next/server'
import { getCollection, getProductsByVendor } from '@/lib/shopify/storefront-client'

/**
 * Artist/Vendor Profile API
 * 
 * Returns artist profile with their products from Shopify collection.
 * Collections contain the artist's profile photo and bio.
 */

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  
  try {
    // First, try to fetch the artist's collection by handle (slug)
    // Artists typically have collections with their profile photo and bio
    const collection = await getCollection(slug, {
      first: 50,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    
    if (collection) {
      // Collection found - use it for artist data
      const products = collection.products.edges.map(edge => edge.node)
      
      const artist = {
        name: collection.title,
        slug,
        bio: collection.description || collection.descriptionHtml?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        image: collection.image?.url,
        products,
      }
      
      return NextResponse.json(artist)
    }
    
    // Fallback: If no collection found, try fetching by vendor name
    const artistName = slug.replace(/-/g, ' ')
    const { products: vendorProducts } = await getProductsByVendor(artistName, {
      first: 50,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    
    if (vendorProducts.length === 0) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      )
    }
    
    // Use vendor-based fallback
    const artist = {
      name: vendorProducts[0].vendor || artistName,
      slug,
      bio: vendorProducts[0].description || undefined,
      image: vendorProducts[0].featuredImage?.url,
      products: vendorProducts,
    }
    
    return NextResponse.json(artist)
  } catch (error) {
    console.error('[Artist API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artist', products: [] },
      { status: 500 }
    )
  }
}
