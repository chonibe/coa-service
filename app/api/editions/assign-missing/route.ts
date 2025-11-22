import { NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Assign edition numbers to line items that don't have them yet
 * Only processes products that have active (fulfilled) items without edition numbers
 */
export async function POST() {
  try {
    // Find products that have active items without edition numbers
    const { data: itemsWithoutEditions, error: fetchError } = await supabase
      .from('order_line_items_v2')
      .select('product_id')
      .eq('status', 'active')
      .is('edition_number', null)
      .not('product_id', 'is', null)
      .neq('product_id', '')

    if (fetchError) {
      console.error('Error fetching items without edition numbers:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch items without edition numbers' },
        { status: 500 }
      )
    }

    if (!itemsWithoutEditions || itemsWithoutEditions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active items found without edition numbers',
        stats: {
          productsProcessed: 0,
          totalAssigned: 0,
          itemsWithoutEditions: 0
        }
      })
    }

    // Get unique product IDs that need edition numbers assigned
    const uniqueProducts = [
      ...new Set(
        itemsWithoutEditions
          .map(item => item.product_id)
          .filter(id => id && id.trim() !== '')
      )
    ]

    console.log(`Found ${itemsWithoutEditions.length} active items without edition numbers across ${uniqueProducts.length} products`)

    const results = []
    let totalAssigned = 0
    let errors = 0

    // Assign edition numbers for each product
    for (const productId of uniqueProducts) {
      try {
        // Get count of items that will be assigned before calling
        const { count: itemsCount } = await supabase
          .from('order_line_items_v2')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', productId)
          .eq('status', 'active')
          .is('edition_number', null)

        // Call the assign_edition_numbers function
        // Note: This function will reassign ALL active items for the product,
        // not just the ones missing numbers, to ensure sequential numbering
        const { data, error: assignError } = await supabase
          .rpc('assign_edition_numbers', { p_product_id: String(productId) })

        if (assignError) {
          console.error(`Error assigning numbers for product ${productId}:`, assignError)
          errors++
          results.push({
            productId,
            success: false,
            error: assignError.message,
            itemsNeedingAssignment: itemsCount || 0
          })
        } else {
          totalAssigned += data || 0
          results.push({
            productId,
            success: true,
            editionNumbersAssigned: data || 0,
            itemsNeedingAssignment: itemsCount || 0
          })
          console.log(`Assigned ${data} edition numbers for product ${productId}`)
        }
      } catch (error: any) {
        console.error(`Error processing product ${productId}:`, error)
        errors++
        results.push({
          productId,
          success: false,
          error: error.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Assigned edition numbers for ${totalAssigned} items across ${uniqueProducts.length} products`,
      stats: {
        productsProcessed: uniqueProducts.length,
        productsWithErrors: errors,
        totalAssigned,
        itemsWithoutEditions: itemsWithoutEditions.length
      },
      results
    })
  } catch (error: any) {
    console.error('Error in assign-missing:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

