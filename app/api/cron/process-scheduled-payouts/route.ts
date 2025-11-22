import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CRON_SECRET } from "@/lib/env"

/**
 * Cron job to process scheduled payouts
 * Runs daily at 9 AM UTC (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  const results = {
    processed: 0,
    skipped: 0,
    errors: [] as string[],
  }

  try {
    // Get all enabled schedules that are due
    const now = new Date()
    const { data: schedules, error: schedulesError } = await supabase
      .from("payout_schedules")
      .select("*")
      .eq("enabled", true)
      .neq("schedule_type", "manual")
      .lte("next_run", now.toISOString())

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError)
      return NextResponse.json(
        { error: "Failed to fetch schedules", details: schedulesError.message },
        { status: 500 }
      )
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scheduled payouts due",
        results,
      })
    }

    // Process each scheduled payout
    for (const schedule of schedules) {
      try {
        // Get pending payout for this vendor
        const { data: pendingPayouts, error: payoutError } = await supabase.rpc(
          "get_pending_vendor_payouts"
        )

        if (payoutError) {
          results.errors.push(`Error fetching pending payouts: ${payoutError.message}`)
          continue
        }

        const vendorPayout = pendingPayouts?.find(
          (p: any) => p.vendor_name === schedule.vendor_name
        )

        if (!vendorPayout || vendorPayout.amount <= 0) {
          // No pending payout or amount is 0/negative
          results.skipped++
          continue
        }

        // Check minimum amount threshold
        if (schedule.minimum_amount && vendorPayout.amount < schedule.minimum_amount) {
          results.skipped++
          continue
        }

        // Check if vendor has PayPal email
        if (!vendorPayout.paypal_email) {
          results.errors.push(
            `Vendor ${schedule.vendor_name} has no PayPal email configured`
          )
          continue
        }

        // Process the payout
        const payoutResponse = await fetch(
          `${request.nextUrl.origin}/api/vendors/payouts/process`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Use service role for internal API calls
              Cookie: request.headers.get("Cookie") || "",
            },
            body: JSON.stringify({
              payouts: [
                {
                  vendor_name: vendorPayout.vendor_name,
                  amount: vendorPayout.amount,
                  product_count: vendorPayout.product_count,
                },
              ],
              payment_method: "paypal",
              generate_invoices: true,
              notes: `Automated payout - ${schedule.schedule_type} schedule`,
            }),
          }
        )

        if (!payoutResponse.ok) {
          const errorData = await payoutResponse.json()
          results.errors.push(
            `Failed to process payout for ${schedule.vendor_name}: ${errorData.error || "Unknown error"}`
          )
          continue
        }

        // Update schedule last_run and next_run
        const { error: updateError } = await supabase
          .from("payout_schedules")
          .update({
            last_run: now.toISOString(),
            next_run: await calculateNextRun(schedule),
            updated_at: now.toISOString(),
          })
          .eq("id", schedule.id)

        if (updateError) {
          console.error(`Error updating schedule for ${schedule.vendor_name}:`, updateError)
        }

        results.processed++
      } catch (err: any) {
        console.error(`Error processing schedule for ${schedule.vendor_name}:`, err)
        results.errors.push(`Error processing ${schedule.vendor_name}: ${err.message}`)
      }
    }

    // Update next_run for all schedules (in case some were skipped)
    await supabase.rpc("update_payout_schedule_next_runs")

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} payouts, skipped ${results.skipped}`,
      results,
    })
  } catch (error: any) {
    console.error("Error in scheduled payout cron:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
        results,
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate next run time for a schedule
 */
async function calculateNextRun(schedule: any): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase.rpc("calculate_next_payout_run", {
    p_schedule_type: schedule.schedule_type,
    p_day_of_week: schedule.day_of_week,
    p_day_of_month: schedule.day_of_month,
  })
  return data || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default: 7 days
}

