import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase client not initialized" },
      { status: 500 }
    )
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching first order:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in first order endpoint:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 