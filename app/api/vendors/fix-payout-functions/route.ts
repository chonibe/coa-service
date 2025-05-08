import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createClient()
    const results = {
      steps: [] as any[],
      success: false,
    }

    // Step 1: Check if the vendor_payout_items table exists
    try {
      results.steps.push({ name: "Check vendor_payout_items table" })
      const { data: tableExists, error: tableError } = await supabase.from("vendor_payout_items").select("id").limit(1)

      if (tableError && tableError.message.includes("does not exist")) {
        // Create the table
        results.steps.push({ name: "Creating vendor_payout_items table" })
        const { error: createError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS vendor_payout_items (
            id SERIAL PRIMARY KEY,
            payout_id INTEGER,
            line_item_id TEXT NOT NULL,
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            amount DECIMAL NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(payout_id, line_item_id)
          );
          
          CREATE INDEX IF NOT EXISTS vendor_payout_items_line_item_idx ON vendor_payout_items(line_item_id);
          CREATE INDEX IF NOT EXISTS vendor_payout_items_payout_id_idx ON vendor_payout_items(payout_id);
        `)

        if (createError) {
          results.steps.push({ name: "Create table error", error: createError.message })
        } else {
          results.steps.push({ name: "Table created successfully" })
        }
      } else {
        results.steps.push({ name: "Table already exists" })
      }
    } catch (err: any) {
      results.steps.push({ name: "Table check error", error: err.message })
    }

    // Step 2: Create the get_pending_vendor_payouts function
    try {
      results.steps.push({ name: "Creating get_pending_vendor_payouts function" })
      const { error: funcError } = await supabase.query(`
        CREATE OR REPLACE FUNCTION get_pending_vendor_payouts()
        RETURNS TABLE (
          vendor_name TEXT,
          amount DECIMAL,
          product_count INTEGER,
          paypal_email TEXT,
          tax_id TEXT,
          tax_country TEXT,
          is_company BOOLEAN,
          last_payout_date TIMESTAMP WITH TIME ZONE
        ) AS $$
        BEGIN
          RETURN QUERY
          WITH paid_line_items AS (
            SELECT line_item_id FROM vendor_payout_items
          ),
          vendor_sales AS (
            SELECT 
              v.name AS vendor_name,
              li.id AS line_item_id,
              li.order_id,
              li.product_id,
              li.price,
              COALESCE(pvp.payout_amount, 10) AS payout_percentage,
              COALESCE(pvp.is_percentage, true) AS is_percentage,
              CASE 
                WHEN COALESCE(pvp.is_percentage, true) THEN (li.price * COALESCE(pvp.payout_amount, 10) / 100)
                ELSE COALESCE(pvp.payout_amount, 0)
              END AS payout_amount
            FROM line_items li
            JOIN products p ON li.product_id = p.id
            JOIN vendors v ON p.vendor_id = v.id
            LEFT JOIN product_vendor_payouts pvp ON p.id = pvp.product_id
            WHERE li.id NOT IN (SELECT line_item_id FROM paid_line_items)
          ),
          vendor_totals AS (
            SELECT 
              vendor_name,
              SUM(payout_amount) AS amount,
              COUNT(*) AS product_count
            FROM vendor_sales
            GROUP BY vendor_name
          )
          SELECT 
            vt.vendor_name,
            vt.amount,
            vt.product_count,
            v.paypal_email,
            v.tax_id,
            v.tax_country,
            v.is_company,
            MAX(vp.payout_date) AS last_payout_date
          FROM vendor_totals vt
          JOIN vendors v ON vt.vendor_name = v.name
          LEFT JOIN vendor_payouts vp ON vt.vendor_name = vp.vendor_name
          GROUP BY 
            vt.vendor_name, 
            vt.amount, 
            vt.product_count, 
            v.paypal_email, 
            v.tax_id, 
            v.tax_country, 
            v.is_company;
        END;
        $$ LANGUAGE plpgsql;
      `)

      if (funcError) {
        results.steps.push({ name: "Function creation error", error: funcError.message })
      } else {
        results.steps.push({ name: "Function created successfully" })
      }
    } catch (err: any) {
      results.steps.push({ name: "Function creation error", error: err.message })
    }

    // Step 3: Create the get_pending_line_items_for_vendor function
    try {
      results.steps.push({ name: "Creating get_pending_line_items_for_vendor function" })
      const { error: funcError } = await supabase.query(`
        CREATE OR REPLACE FUNCTION get_pending_line_items_for_vendor(vendor_name_param TEXT)
        RETURNS TABLE (
          line_item_id TEXT,
          order_id TEXT,
          order_name TEXT,
          product_id TEXT,
          product_title TEXT,
          price DECIMAL,
          created_at TIMESTAMP WITH TIME ZONE,
          payout_amount DECIMAL,
          is_percentage BOOLEAN
        ) AS $$
        BEGIN
          RETURN QUERY
          WITH paid_line_items AS (
            SELECT line_item_id FROM vendor_payout_items
          )
          SELECT 
            li.id AS line_item_id,
            li.order_id,
            o.name AS order_name,
            li.product_id,
            p.title AS product_title,
            li.price,
            li.created_at,
            COALESCE(pvp.payout_amount, 10) AS payout_amount,
            COALESCE(pvp.is_percentage, true) AS is_percentage
          FROM line_items li
          JOIN products p ON li.product_id = p.id
          JOIN vendors v ON p.vendor_id = v.id
          JOIN orders o ON li.order_id = o.id
          LEFT JOIN product_vendor_payouts pvp ON p.id = pvp.product_id
          WHERE v.name = vendor_name_param
          AND li.id NOT IN (SELECT line_item_id FROM paid_line_items);
        END;
        $$ LANGUAGE plpgsql;
      `)

      if (funcError) {
        results.steps.push({ name: "Function creation error", error: funcError.message })
      } else {
        results.steps.push({ name: "Function created successfully" })
      }
    } catch (err: any) {
      results.steps.push({ name: "Function creation error", error: err.message })
    }

    // Step 4: Test if the function works
    try {
      results.steps.push({ name: "Testing get_pending_vendor_payouts function" })
      const { data, error } = await supabase.rpc("get_pending_vendor_payouts")

      if (error) {
        results.steps.push({ name: "Function test error", error: error.message })
      } else {
        results.steps.push({ name: "Function test successful", data: data })
        results.success = true
      }
    } catch (err: any) {
      results.steps.push({ name: "Function test error", error: err.message })
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Error in fix payout functions API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
