import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest, 
  { params }: { params: { lineItemId: string } }
) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('order_line_items_v2')
      .select('artwork_story, artwork_media_urls')
      .eq('line_item_id', params.lineItemId)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ 
        success: false, 
        message: 'Artwork story not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      story: {
        text: data.artwork_story || '',
        mediaUrls: data.artwork_media_urls || []
      }
    })
  } catch (err) {
    console.error('Artwork Story Fetch Error:', err)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to retrieve artwork story' 
    }, { status: 500 })
  }
}
