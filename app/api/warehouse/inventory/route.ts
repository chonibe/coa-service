import { NextRequest, NextResponse } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Create ChinaDivision client and fetch all SKU inventory
    const client = createChinaDivisionClient()
    console.log('[Warehouse Inventory] Fetching inventory from ChinaDivision API')
    
    const inventoryData = await client.getAllSkuInventory()
    console.log(`[Warehouse Inventory] Successfully fetched ${inventoryData.length} SKU records`)

    // Fetch vendor information from Supabase to map SKUs to vendors
    const { data: products } = await supabase
      .from('products')
      .select('sku, vendor_id, vendors(vendor_name)')
      .not('vendor_id', 'is', null)

    // Create a map of SKU to vendor
    const skuToVendor = new Map<string, { vendorId: number; vendorName: string }>()
    if (products) {
      products.forEach(product => {
        if (product.sku && product.vendor_id && product.vendors) {
          skuToVendor.set(product.sku, {
            vendorId: product.vendor_id,
            vendorName: (product.vendors as any).vendor_name || 'Unknown Vendor'
          })
        }
      })
    }

    // Group inventory by vendor
    const vendorInventory: Record<string, {
      vendorName: string
      vendorId: number
      skus: Array<{
        sku: string
        quantity: number
        productName?: string
      }>
      totalQuantity: number
    }> = {}

    // Track core products
    let streetlamp001Count = 0
    let streetlamp002Count = 0

    // Process inventory data
    inventoryData.forEach((item: any) => {
      const sku = item.sku || item.sku_code || ''
      // Try multiple possible field names for quantity - prioritize available_quantity and stock_quantity
      const quantity = parseInt(
        item.available_quantity ||
        item.stock_quantity ||
        item.product_quantity ||
        item.quantity || 
        item.inventory || 
        item.inventory_quantity || 
        item.stock || 
        item.qty ||
        '0', 
        10
      ) || 0

      // Track core products
      if (sku.toLowerCase() === 'streetlamp001') {
        streetlamp001Count += quantity
      } else if (sku.toLowerCase() === 'streetlamp002') {
        streetlamp002Count += quantity
      }

      // Get vendor info
      const vendorInfo = skuToVendor.get(sku)
      if (vendorInfo) {
        const vendorKey = vendorInfo.vendorId.toString()
        if (!vendorInventory[vendorKey]) {
          vendorInventory[vendorKey] = {
            vendorName: vendorInfo.vendorName,
            vendorId: vendorInfo.vendorId,
            skus: [],
            totalQuantity: 0
          }
        }
        vendorInventory[vendorKey].skus.push({
          sku,
          quantity,
          productName: item.product_name || item.name || sku
        })
        vendorInventory[vendorKey].totalQuantity += quantity
      } else {
        // Handle SKUs without vendor assignment
        const unknownKey = 'unknown'
        if (!vendorInventory[unknownKey]) {
          vendorInventory[unknownKey] = {
            vendorName: 'Unassigned',
            vendorId: 0,
            skus: [],
            totalQuantity: 0
          }
        }
        vendorInventory[unknownKey].skus.push({
          sku,
          quantity,
          productName: item.product_name || item.name || sku
        })
        vendorInventory[unknownKey].totalQuantity += quantity
      }
    })

    // Convert to array and sort by vendor name
    const vendorInventoryArray = Object.values(vendorInventory).sort((a, b) => 
      a.vendorName.localeCompare(b.vendorName)
    )

    return NextResponse.json({
      success: true,
      vendors: vendorInventoryArray,
      coreProducts: {
        streetlamp001: streetlamp001Count,
        streetlamp002: streetlamp002Count,
        total: streetlamp001Count + streetlamp002Count
      },
      totalSkus: inventoryData.length,
      totalQuantity: inventoryData.reduce((sum: number, item: any) => {
        return sum + (parseInt(
          item.quantity || 
          item.inventory || 
          item.inventory_quantity || 
          item.stock || 
          item.stock_quantity ||
          item.qty ||
          '0', 
          10
        ) || 0)
      }, 0)
    })
  } catch (error: any) {
    console.error('Error fetching warehouse inventory:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch warehouse inventory',
      },
      { status: 500 }
    )
  }
}

