import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL || 
      'https://ldmppmnpgdxueebkkpid.supabase.co'

    console.warn('Using default Supabase URL. Please configure SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')

    const supabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from("backups")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching backups:", error)
    return NextResponse.json(
      { error: "Failed to fetch backups" },
      { status: 500 }
    )
  }
} 