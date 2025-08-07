import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseUrl) {
      return NextResponse.json({ 
        error: "Supabase URL not found",
        supabaseUrl: null
      }, { status: 500 })
    }

    console.log("Testing Supabase URL:", supabaseUrl)
    
    // Test if the URL is accessible
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log("Supabase URL test response status:", response.status)
      
      return NextResponse.json({ 
        success: true,
        supabaseUrl: supabaseUrl,
        status: response.status,
        accessible: response.ok
      })
    } catch (fetchError: any) {
      console.error("Error testing Supabase URL:", fetchError)
      return NextResponse.json({ 
        error: "Failed to connect to Supabase URL",
        supabaseUrl: supabaseUrl,
        fetchError: fetchError.message,
        name: fetchError.name
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Unexpected error testing Supabase URL:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred",
      stack: error.stack
    }, { status: 500 })
  }
} 