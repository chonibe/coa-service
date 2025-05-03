import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createClient()

    // Test if the function exists
    const { data, error } = await supabase.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'get_pending_vendor_payouts'
      );
    `)

    if (error) {
      console.error("Error testing function existence:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Try to execute the function
    let functionResult = null
    let functionError = null

    try {
      const { data: funcData, error: funcError } = await supabase.rpc("get_pending_vendor_payouts")
      functionResult = funcData
      functionError = funcError
    } catch (err: any) {
      functionError = err.message
    }

    return NextResponse.json({
      functionExists: data?.[0]?.exists || false,
      functionResult: functionResult,
      functionError: functionError ? functionError.message || String(functionError) : null,
    })
  } catch (err: any) {
    console.error("Error in test functions API:", err)
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 })
  }
}
