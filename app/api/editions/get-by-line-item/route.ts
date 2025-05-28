import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  try {
    // Get the productId from the query parameters
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check for admin session cookie
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch line items from the database
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('order_line_items_v2')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError)
      return NextResponse.json({ error: 'Failed to fetch line items' }, { status: 500 })
    }

    // Fetch edition total from product_edition_counters
    const { data: editionCounter, error: counterError } = await supabase
      .from('product_edition_counters')
      .select('edition_total')
      .eq('product_id', productId)
      .single()

    if (counterError && counterError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching edition counter:', counterError)
      return NextResponse.json({ error: 'Failed to fetch edition counter' }, { status: 500 })
    }

    // Add edition total to each line item
    const lineItemsWithEditionTotal = lineItems?.map(item => ({
      ...item,
      edition_total: editionCounter?.edition_total || null
    })) || []

    return NextResponse.json(lineItemsWithEditionTotal)
  } catch (error) {
    console.error('Error in get-by-line-item route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
