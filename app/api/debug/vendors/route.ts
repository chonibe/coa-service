import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get all vendors
    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("id, vendor_name, contact_email, status, onboarding_completed")
      .order("vendor_name")
    
    if (error) {
      return NextResponse.json({ 
        error: "Failed to fetch vendors",
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      count: vendors?.length || 0,
      vendors: vendors || []
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Unexpected error",
      message: error.message
    }, { status: 500 })
  }
}

