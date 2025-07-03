import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'

export async function GET() {
  try {
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseKey('anon')
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