import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    
    // Check if the table exists
    let tables, tablesError;
    try {
      const result = await supabase.rpc("exec_sql", {
        sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      });
      tables = result.data;
      tablesError = result.error;
    } catch (error) {
      console.error("RPC call failed:", error);
      tablesError = error;
    }

    if (tablesError) {
      return NextResponse.json({ 
        error: tablesError instanceof Error ? tablesError.message : String(tablesError), 
        step: "checking tables" 
      }, { status: 500 })
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
    let columns, columnsError;
    try {
      const result = await supabase.rpc("exec_sql", {
        sql_query:
          "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_vendor_payouts'",
      });
      columns = result.data;
      columnsError = result.error;
    } catch (error) {
      console.error("RPC call failed:", error);
      columnsError = error;
    }

    if (columnsError) {
      return NextResponse.json({ 
        error: columnsError instanceof Error ? columnsError.message : String(columnsError), 
        step: "checking columns" 
      }, { status: 500 })
    }

    // Get all records
    const { data, error } = await supabase.from("product_vendor_payouts").select("*").limit(100)

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
