import { NextResponse } from 'next/server'
import { getProduct } from '@/lib/shopify/storefront-client'
import { 
  getProductSeriesInfo, 
  getProductEditionInfo,
  getCollectorSeriesProgress 
} from '@/lib/shop/series'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that must be awaited
    const { handle } = await context.params
    const product = await getProduct(handle)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Fetch series info (non-blocking)
    const seriesInfo = await getProductSeriesInfo(product.id).catch(() => null)
    
    // Fetch edition info (non-blocking)
    const editionInfo = await getProductEditionInfo(product.id).catch(() => null)
    
    // Fetch collector progress if authenticated
    let collectorProgress = null
    if (seriesInfo) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user?.email) {
          collectorProgress = await getCollectorSeriesProgress(
            seriesInfo.id,
            user.email
          )
        }
      } catch (error) {
        // Non-critical error, continue without progress
        console.debug('Could not fetch collector progress:', error)
      }
    }
    
    return NextResponse.json({ 
      product,
      seriesInfo,
      editionInfo,
      collectorProgress
    })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
