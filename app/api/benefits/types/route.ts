import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase.from("benefit_types").select("*").order("name", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ types: data })
  } catch (error: any) {
    console.error("Error fetching benefit types:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
