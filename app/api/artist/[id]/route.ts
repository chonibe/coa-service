import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, bio, profile_image_url')
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ 
        success: false, 
        message: 'Artist not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      artist: {
        id: data.id,
        name: data.name,
        bio: data.bio,
        profileImageUrl: data.profile_image_url
      }
    })
  } catch (err) {
    console.error('Artist Fetch Error:', err)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to retrieve artist information' 
    }, { status: 500 })
  }
} 