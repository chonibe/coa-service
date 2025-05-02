import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Get the first record to examine its structure
    const { data: sampleRecord, error: sampleError } = await supabaseAdmin
      .from("order_line_items")
      .select("*")
      .limit(1)
      .single()

    if (sampleError) {
      return NextResponse.json(
        {
          error: "Error fetching sample record",
          details: sampleError,
        },
        { status: 500 },
      )
    }

    // Get column information from Postgres
    const { data: columns, error: columnsError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'order_line_items'
          ORDER BY ordinal_position
        `,
    })

    if (columnsError) {
      return NextResponse.json(
        {
          error: "Error fetching column information",
          details: columnsError,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Order Line Items Table Schema",
      columns: columns,
      sampleRecord: sampleRecord,
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error,
      },
      { status: 500 },
    )
  }
}
