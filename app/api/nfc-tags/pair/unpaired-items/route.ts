import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const offset = (page - 1) * limit

    const supabase = createClient()

    // Start building the query
    let query = supabase
      .from('order_line_items_v2')
      .select(`
        id,
        product_id,
        product_name,
        order_number,
        quantity,
        nfc_pairing_status,
        created_at
      `)
      .eq('nfc_pairing_status', 'pending')

    // Add search filter if provided
    if (search) {
      query = query.or(`
        product_name.ilike.%${search}%,
        order_number.ilike.%${search}%
      `)
    }

    // Add sorting
    if (sortBy && sortOrder) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('order_line_items_v2')
      .select('*', { count: 'exact', head: true })
      .eq('nfc_pairing_status', 'pending')

    // Get paginated results
    const { data: items, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching unpaired items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch unpaired items' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      items,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (err) {
    console.error('Unexpected error in unpaired-items route:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 