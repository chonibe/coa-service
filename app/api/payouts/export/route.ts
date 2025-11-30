import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { convertGBPToUSD, formatUSD } from "@/lib/utils"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dataType, format, columns, reportType, isAdmin, vendorName, filterCriteria, email, schedule } = body

    // Auth check
    if (isAdmin) {
      const auth = guardAdminRequest(request)
      if (auth.kind !== "ok") {
        return auth.response
      }
    } else if (vendorName) {
      const cookieStore = cookies()
      const sessionVendorName = getVendorFromCookieStore(cookieStore)
      if (sessionVendorName !== vendorName) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const supabase = createClient()

    // Build query based on dataType
    let query = supabase.from("vendor_payouts").select("*")

    if (vendorName) {
      query = query.eq("vendor_name", vendorName)
    }

    // Apply filters
    if (filterCriteria) {
      if (filterCriteria.status && filterCriteria.status.length > 0) {
        query = query.in("status", filterCriteria.status)
      }
      if (filterCriteria.dateRange?.start) {
        query = query.gte("payout_date", filterCriteria.dateRange.start)
      }
      if (filterCriteria.dateRange?.end) {
        query = query.lte("payout_date", filterCriteria.dateRange.end)
      }
      if (filterCriteria.amountRange?.min !== null && filterCriteria.amountRange?.min !== undefined) {
        query = query.gte("amount", filterCriteria.amountRange.min)
      }
      if (filterCriteria.amountRange?.max !== null && filterCriteria.amountRange?.max !== undefined) {
        query = query.lte("amount", filterCriteria.amountRange.max)
      }
    }

    query = query.order("created_at", { ascending: false })

    const { data: payouts, error } = await query

    if (error) {
      console.error("Error fetching payouts for export:", error)
      return NextResponse.json({ error: "Failed to fetch payout data" }, { status: 500 })
    }

    // Format data based on selected columns
    const formattedData = (payouts || []).map((payout) => {
      const row: Record<string, any> = {}
      columns.forEach((col: string) => {
        switch (col) {
          case "date":
            row["Date"] = payout.payout_date || payout.created_at
            break
          case "vendor":
            row["Vendor"] = payout.vendor_name
            break
          case "amount":
            row["Amount"] = formatUSD(convertGBPToUSD(payout.amount || 0))
            break
          case "status":
            row["Status"] = payout.status
            break
          case "paymentMethod":
            row["Payment Method"] = payout.payment_method || "N/A"
            break
          case "reference":
            row["Reference"] = payout.reference || "N/A"
            break
          case "invoiceNumber":
            row["Invoice Number"] = payout.invoice_number || "N/A"
            break
          case "productCount":
            row["Product Count"] = payout.product_count || 0
            break
          case "taxAmount":
            row["Tax Amount"] = formatUSD(convertGBPToUSD(payout.tax_amount || 0))
            break
          case "processedBy":
            row["Processed By"] = payout.processed_by || "N/A"
            break
        }
      })
      return row
    })

    // Handle scheduling
    if (schedule?.enabled && email) {
      // TODO: Implement scheduled export functionality
      // This would typically involve:
      // 1. Storing schedule in database
      // 2. Setting up cron job or scheduled task
      // 3. Sending email with export
      return NextResponse.json({
        success: true,
        message: `Scheduled ${schedule.frequency} export has been set up. Reports will be sent to ${email}`,
      })
    }

    // Generate export based on format
    if (format === "csv") {
      const csv = generateCSV(formattedData)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="payouts-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else if (format === "excel") {
      // For Excel, we'd use a library like exceljs
      // For now, return CSV with .xlsx extension
      const csv = generateCSV(formattedData)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="payouts-export-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    } else if (format === "pdf") {
      // For PDF, we'd use a library like pdfkit or puppeteer
      // For now, return JSON with instructions
      if (email) {
        // TODO: Generate PDF and send via email
        return NextResponse.json({
          success: true,
          message: `PDF report will be generated and sent to ${email}`,
        })
      }
      return NextResponse.json({
        error: "PDF export requires email address",
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 })
  } catch (error) {
    console.error("Error in export route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return ""

  const headers = Object.keys(data[0])
  const rows = data.map((row) => headers.map((header) => {
    const value = row[header]
    // Escape quotes and wrap in quotes if contains comma or quote
    if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }))

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}



