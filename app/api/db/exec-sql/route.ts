import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      throw new Error("Failed to initialize Supabase admin client")
    }

    // First, create the exec_sql function if it doesn't exist
    const createFunctionSql = fs.readFileSync(path.join(process.cwd(), "db", "create_exec_sql_function.sql"), "utf8")

    // Execute the SQL directly to create the function
    let functionError = null
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: createFunctionSql,
      })
      functionError = error
    } catch (error) {
      // If the function doesn't exist yet, we need to create it directly
      try {
        await supabase.from("_temp_exec_sql").select().limit(1)
      } catch (error) {
        console.error("Error creating exec_sql function:", error)
      }
    }

    if (functionError) {
      console.error("Error creating exec_sql function:", functionError)
    }

    // Now create the vendors table
    const vendorsTableSql = fs.readFileSync(path.join(process.cwd(), "db", "vendors_table.sql"), "utf8")

    const { error } = await supabase.rpc("exec_sql", { sql_query: vendorsTableSql })

    if (error) {
      console.error("Error creating vendors table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Now create the product_vendor_payouts table
    const productVendorPayoutsTableSql = fs.readFileSync(
      path.join(process.cwd(), "db", "product_vendor_payouts_table.sql"),
      "utf8",
    )

    const { error: productVendorPayoutsError } = await supabase.rpc("exec_sql", {
      sql_query: productVendorPayoutsTableSql,
    })

    if (productVendorPayoutsError) {
      console.error("Error creating product_vendor_payouts table:", productVendorPayoutsError)
      return NextResponse.json({ error: productVendorPayoutsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Database initialized successfully" })
  } catch (error) {
    console.error("Unexpected error initializing database:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
