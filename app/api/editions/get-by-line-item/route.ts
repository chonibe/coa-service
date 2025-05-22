import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    // Get the productId from the query parameters
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Fetch line items from the database
    const { data: lineItems, error } = await supabase
      .from('order_line_items_v2')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching line items:', error)
      return NextResponse.json({ error: 'Failed to fetch line items' }, { status: 500 })
    }

    return NextResponse.json(lineItems || [])
  } catch (error) {
    console.error('Error in get-by-line-item route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
