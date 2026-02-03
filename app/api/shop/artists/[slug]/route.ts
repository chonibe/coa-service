import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/shopify/storefront-client'

/**
 * Artist/Vendor Profile API
 * 
 * Returns artist profile with their products.
 */

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  
  try {
    // Convert slug back to artist name
    const artistName = slug.replace(/-/g, ' ')
    
    // Fetch all products and filter by vendor
    const { products } = await getProducts({ first: 250 })
    
    const artistProducts = products.filter(
      (p) => p.vendor?.toLowerCase() === artistName.toLowerCase()
    )
    
    if (artistProducts.length === 0) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      )
    }
    
    const artist = {
      name: artistProducts[0].vendor || artistName,
      slug,
      bio: artistProducts[0].description || undefined, // Could be enhanced with actual artist bios from CMS
      image: artistProducts[0].featuredImage?.url,
      products: artistProducts,
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
