import { NextResponse } from "next/server"
import { supabaseAdmin } from "/dev/null"

export async function GET() {
  try {
    // Check if the table exists
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    })

    if (tablesError) {
      return NextResponse.json({ error: tablesError.message, step: "checking tables" }, { status: 500 })
    }

    const tableExists = tables.some((t: any) => t.table_name === "product_vendor_payouts")

    if (!tableExists) {
      return NextResponse.json(
        {
          error: "Table product_vendor_payouts does not exist",
          tables: tables.map((t: any) => t.table_name),
        },
        { status: 404 },
      )
    }

    // Get table structure
    const { data: columns, error: columnsError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query:
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_vendor_payouts'",
    })

    if (columnsError) {
      return NextResponse.json({ error: columnsError.message, step: "checking columns" }, { status: 500 })
    }

    // Get all records
    const { data, error } = await supabaseAdmin.from("product_vendor_payouts").select("*").limit(100)

    if (error) {
      return NextResponse.json({ error: error.message, step: "fetching data" }, { status: 500 })
    }

    return NextResponse.json({
      tableExists,
      columns,
      recordCount: data?.length || 0,
      records: data || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
