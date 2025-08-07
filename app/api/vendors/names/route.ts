import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("Starting vendor names API call...")
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log("Supabase URL exists:", !!supabaseUrl)
    console.log("Supabase Key exists:", !!supabaseKey)
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json({ 
        error: "Missing Supabase environment variables",
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      }, { status: 500 })
    }

    console.log("Creating Supabase client...")
    const supabase = createClient()
    
    console.log("Executing Supabase query...")
    const { data, error } = await supabase.from("vendors").select("vendor_name").order("vendor_name")

    if (error) {
      console.error("Error fetching vendor names:", error)
      return NextResponse.json({ 
        error: "Failed to fetch vendor names",
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }

    console.log("Successfully fetched vendor names, count:", data?.length || 0)
    const vendorNames = data.map((vendor) => vendor.vendor_name)

    return NextResponse.json({ vendors: vendorNames })
  } catch (error: any) {
    console.error("Error in vendor names API:", error)
    return NextResponse.json({ 
      error: error.message || "An error occurred",
      stack: error.stack,
      name: error.name
    }, { status: 500 })
  }
}
