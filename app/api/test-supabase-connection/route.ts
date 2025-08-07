import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("Testing Supabase connection...")
    console.log("Supabase URL:", supabaseUrl)
    console.log("Supabase Key exists:", !!supabaseKey)

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: "Missing Supabase environment variables",
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      }, { status: 500 })
    }

    const supabase = createClient()
    
    // Test a simple query
    const { data, error } = await supabase.from("products").select("count").limit(1)

    if (error) {
      console.error("Supabase connection error:", error)
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Supabase connection successful",
      data: data
    })
  } catch (error: any) {
    console.error("Unexpected error testing Supabase:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred",
      stack: error.stack
    }, { status: 500 })
  }
}
