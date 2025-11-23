import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Verify this is a valid Vercel cron request
function isValidCronRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createClient()

    // Get all enabled schedules that are due
    const now = new Date()
    const { data: schedules, error: schedulesError } = await supabase
      .from("payout_schedules")
      .select("*")
      .eq("enabled", true)
      .lte("next_run", now.toISOString())

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError)
      return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ message: "No schedules due for processing", processed: 0 })
    }

    let processed = 0
    const results = []

    for (const schedule of schedules) {
      try {
        // Get pending payouts for this vendor (or all vendors if vendor_name is null)
        let payoutQuery = supabase
          .from("vendor_payouts")
          .select("id, vendor_name, amount")
          .in("status", ["pending", "processing"])

        if (schedule.vendor_name) {
          payoutQuery = payoutQuery.eq("vendor_name", schedule.vendor_name)
        }

        // Apply threshold if set
        if (schedule.threshold) {
          payoutQuery = payoutQuery.gte("amount", schedule.threshold)
        }

        const { data: payouts, error: payoutsError } = await payoutQuery

        if (payoutsError) {
          console.error(`Error fetching payouts for schedule ${schedule.id}:`, payoutsError)
          continue
        }

        if (!payouts || payouts.length === 0) {
          // Update next run date even if no payouts
          await updateNextRun(supabase, schedule)
          continue
        }

        // If auto_process is enabled, process the payouts
        if (schedule.auto_process) {
          // Call the payout processing endpoint
          const processResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/vendors/payouts/process`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.CRON_SECRET}`,
              },
              body: JSON.stringify({
                payouts: payouts.map((p) => ({
                  vendor_name: p.vendor_name,
                  amount: p.amount,
                })),
                payment_method: "paypal",
                generate_invoices: true,
                notes: `Automated payout via schedule: ${schedule.name}`,
              }),
            }
          )

          if (processResponse.ok) {
            processed += payouts.length
            results.push({
              scheduleId: schedule.id,
              scheduleName: schedule.name,
              payoutsProcessed: payouts.length,
              success: true,
            })
          } else {
            results.push({
              scheduleId: schedule.id,
              scheduleName: schedule.name,
              error: "Failed to process payouts",
              success: false,
            })
          }
        }

        // Update next run date
        await updateNextRun(supabase, schedule)
      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error)
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        })
      }
    }

    return NextResponse.json({
      message: "Scheduled payout processing completed",
      processed,
      results,
    })
  } catch (error) {
    console.error("Error in scheduled payout processing:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

async function updateNextRun(supabase: any, schedule: any) {
  const now = new Date()
  let nextRun = new Date()

  switch (schedule.frequency) {
    case "weekly":
      if (schedule.day_of_week) {
        const daysUntil = (schedule.day_of_week - now.getDay() + 7) % 7 || 7
        nextRun.setDate(now.getDate() + daysUntil)
      } else {
        nextRun.setDate(now.getDate() + 7)
      }
      break
    case "bi-weekly":
      nextRun.setDate(now.getDate() + 14)
      break
    case "monthly":
      if (schedule.day_of_month) {
        nextRun.setMonth(now.getMonth() + 1)
        nextRun.setDate(schedule.day_of_month)
      } else {
        nextRun.setMonth(now.getMonth() + 1)
      }
      break
  }

  await supabase
    .from("payout_schedules")
    .update({
      last_run: now.toISOString(),
      next_run: nextRun.toISOString(),
    })
    .eq("id", schedule.id)
}
