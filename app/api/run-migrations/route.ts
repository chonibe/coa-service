import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"

export async function GET() {
  try {
    // Create Instagram profile cache table
    await supabaseAdmin.query(`
      CREATE TABLE IF NOT EXISTS instagram_profile_cache (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username TEXT NOT NULL UNIQUE,
        profile_picture_url TEXT,
        followers_count INTEGER,
        media_count INTEGER,
        biography TEXT,
        name TEXT,
        website TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `)

    // Create Instagram media cache table
    await supabaseAdmin.query(`
      CREATE TABLE IF NOT EXISTS instagram_media_cache (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        instagram_media_id TEXT NOT NULL,
        username TEXT NOT NULL,
        media_type TEXT NOT NULL,
        media_url TEXT NOT NULL,
        thumbnail_url TEXT,
        permalink TEXT NOT NULL,
        caption TEXT,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(username, instagram_media_id)
      );
    `)

    // Create Instagram stories cache table
    await supabaseAdmin.query(`
      CREATE TABLE IF NOT EXISTS instagram_stories_cache (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        instagram_media_id TEXT NOT NULL,
        username TEXT NOT NULL,
        media_type TEXT NOT NULL,
        media_url TEXT NOT NULL,
        permalink TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(username, instagram_media_id)
      );
    `)

    // Create Instagram story views table
    await supabaseAdmin.query(`
      CREATE TABLE IF NOT EXISTS instagram_story_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        collector_id UUID NOT NULL,
        instagram_media_id TEXT NOT NULL,
        viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(collector_id, instagram_media_id)
      );
    `)

    return NextResponse.json({ success: true, message: "Instagram tables created successfully" })
  } catch (error) {
    console.error("Error creating Instagram tables:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
