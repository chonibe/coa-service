import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"
import { guardAdminRequest } from "@/lib/auth-guards"

/**
 * Validate SQL query for dangerous operations
 */
function validateSqlQuery(sql: string): { valid: boolean; error?: string } {
  const upperSql = sql.toUpperCase().trim()
  
  // Block dangerous operations
  const dangerousPatterns = [
    /DROP\s+(DATABASE|TABLE|SCHEMA|USER|ROLE)/i,
    /TRUNCATE/i,
    /DELETE\s+FROM/i,
    /UPDATE\s+\w+\s+SET/i, // Allow only in specific contexts
    /GRANT/i,
    /REVOKE/i,
    /ALTER\s+USER/i,
    /CREATE\s+USER/i,
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      return { valid: false, error: `Dangerous SQL operation detected: ${pattern}` }
    }
  }
  
  // Only allow CREATE, ALTER (for migrations), and SELECT queries
  if (!upperSql.match(/^(CREATE|ALTER|SELECT)\s+/i)) {
    return { valid: false, error: "Only CREATE, ALTER, and SELECT queries are allowed" }
  }
  
  return { valid: true }
}

export async function POST(request: NextRequest) {
  // Require admin authentication
  const guardResult = guardAdminRequest(request)
  if (guardResult.kind !== "ok") {
    return guardResult.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createClient()
    
    // Get user info for audit logging
    const { data: { user } } = await supabase.auth.getUser()
    const executedBy = user?.email || "unknown"
    
    // First, create the secure exec_sql function if it doesn't exist
    const secureFunctionSql = fs.readFileSync(
      path.join(process.cwd(), "db", "create_exec_sql_function_secure.sql"),
      "utf8"
    )

    // Validate the function creation SQL
    const validation = validateSqlQuery(secureFunctionSql)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Execute the SQL to create the secure function
    // Note: This requires direct database access, not via RPC
    // For now, we'll use the existing function but with validation
    let functionError = null
    try {
      // Try to use the secure version if available
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: secureFunctionSql,
        executed_by: executedBy,
      })
      functionError = error
    } catch (error) {
      console.log("Secure exec_sql function not found, using fallback...")
      functionError = error
    }

    if (functionError) {
      console.error("Error creating secure exec_sql function:", functionError)
      // Continue with existing function but add validation
    }

    // Now create the vendors table with validation
    const vendorsTableSql = fs.readFileSync(path.join(process.cwd(), "db", "vendors_table.sql"), "utf8")
    
    const vendorsValidation = validateSqlQuery(vendorsTableSql)
    if (!vendorsValidation.valid) {
      return NextResponse.json({ error: vendorsValidation.error }, { status: 400 })
    }

    const { error, data } = await supabase.rpc("exec_sql", { 
      sql_query: vendorsTableSql,
      executed_by: executedBy,
    })

    if (error) {
      console.error("Error creating vendors table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Now create the product_vendor_payouts table with validation
    const productVendorPayoutsTableSql = fs.readFileSync(
      path.join(process.cwd(), "db", "product_vendor_payouts_table.sql"),
      "utf8",
    )

    const payoutsValidation = validateSqlQuery(productVendorPayoutsTableSql)
    if (!payoutsValidation.valid) {
      return NextResponse.json({ error: payoutsValidation.error }, { status: 400 })
    }

    const { error: productVendorPayoutsError } = await supabase.rpc("exec_sql", {
      sql_query: productVendorPayoutsTableSql,
      executed_by: executedBy,
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
