import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
            getSupabaseUrl(),
            getSupabaseKey('anon')
          )

export async function POST() {
  try {
    // Get all unique product IDs from order_line_items_v2
    const { data: products, error: productsError } = await supabase
      .from('order_line_items_v2')
      .select('product_id')
      .order('product_id')
      .not('product_id', 'is', null)

    if (productsError) {
      throw new Error('Failed to fetch products')
    }

    // Get unique product IDs, filter out null/empty ones
    const uniqueProducts = [
      ...new Set(
        products
          .map(p => p.product_id)
          .filter(id => id && id.trim() !== '')
      )
    ]

    const results = []
    let totalAssigned = 0

    // Assign edition numbers for each product
    for (const productId of uniqueProducts) {
      const { data, error } = await supabase
        .rpc('assign_edition_numbers', { p_product_id: String(productId) })

      if (error) {
        console.error(`Error assigning numbers for product ${productId}:`, error)
        results.push({
          productId,
          success: false,
          error: error.message
        })
      } else {
        totalAssigned += data
        results.push({
          productId,
          success: true,
          count: data
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Assigned ${totalAssigned} edition numbers across ${uniqueProducts.length} products`,
      results
    })
  } catch (error) {
    let message = 'Internal server error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({
      success: false,
      error: message
    })
  }
}