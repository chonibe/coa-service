import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { convertGBPToUSD } from "@/lib/utils"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionVendorName = getVendorFromCookieStore(cookieStore)
  const { searchParams } = request.nextUrl
  const queryVendorName = searchParams.get("vendorName")

  // Check if this is a vendor request
  if (sessionVendorName) {
    // Vendor request - use session vendor name, but verify query param matches if provided
    if (queryVendorName && queryVendorName !== sessionVendorName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    // Admin request
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return auth.response
    }
  }

  try {
    const supabase = createClient()
    const vendorName = sessionVendorName || queryVendorName

    if (vendorName) {
      // Vendor metrics
      const { data: payouts, error: payoutsError } = await supabase
        .from("vendor_payouts")
        .select("amount, payout_date, created_at, status")
        .eq("vendor_name", vendorName)
        .order("created_at", { ascending: false })

      if (payoutsError) {
        console.error("Error fetching vendor payouts:", payoutsError)
        return NextResponse.json({ error: "Failed to fetch payout data" }, { status: 500 })
      }

      const completedPayouts = payouts?.filter((p) => p.status === "completed" || p.status === "paid") || []
      const totalEarned = completedPayouts.reduce((sum, p) => sum + (p.amount || 0), 0)
      const averagePayoutSize =
        completedPayouts.length > 0 ? totalEarned / completedPayouts.length : 0

      // Calculate payout frequency (payouts per month)
      const firstPayout = completedPayouts[completedPayouts.length - 1]
      const lastPayout = completedPayouts[0]
      let payoutFrequency = 0
      if (firstPayout && lastPayout) {
        const daysDiff =
          (new Date(lastPayout.payout_date || lastPayout.created_at).getTime() -
            new Date(firstPayout.payout_date || firstPayout.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
        payoutFrequency = daysDiff > 0 ? (completedPayouts.length / daysDiff) * 30 : 0
      }

      // Calculate growth trend (compare last 30 days to previous 30 days)
      const now = new Date()
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const recentPayouts = completedPayouts.filter(
        (p) => new Date(p.payout_date || p.created_at) >= last30Days
      )
      const previousPayouts = completedPayouts.filter(
        (p) =>
          new Date(p.payout_date || p.created_at) >= last60Days &&
          new Date(p.payout_date || p.created_at) < last30Days
      )

      const recentTotal = recentPayouts.reduce((sum, p) => sum + (p.amount || 0), 0)
      const previousTotal = previousPayouts.reduce((sum, p) => sum + (p.amount || 0), 0)
      const growthTrend = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0

      // Get vendor's collector identifier for ledger-based balance
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, auth_id, vendor_name")
        .eq("vendor_name", vendorName)
        .single()

      let expectedNextPayout = 0
      if (vendor && !vendor.error) {
        const collectorIdentifier = vendor.auth_id || vendorName

        try {
          // Import the ledger-based balance calculator
          const { getUsdBalance } = await import("@/lib/banking/balance-calculator")
          expectedNextPayout = await getUsdBalance(collectorIdentifier)
        } catch (error) {
          console.error(`Error getting ledger balance for ${vendorName}:`, error)
          // Fall back to pending payouts calculation
          const { data: pendingPayouts } = await supabase
            .from("vendor_payouts")
            .select("amount")
            .eq("vendor_name", vendorName)
            .in("status", ["pending", "processing"])

          expectedNextPayout = pendingPayouts?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
        }
      } else {
        console.error(`Error fetching vendor ${vendorName}:`, vendor?.error)
        // Fall back to pending payouts calculation
        const { data: pendingPayouts } = await supabase
          .from("vendor_payouts")
          .select("amount")
          .eq("vendor_name", vendorName)
          .in("status", ["pending", "processing"])

        expectedNextPayout = pendingPayouts?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      }

      // Estimate next payout date (average interval)
      let nextPayoutDate: string | undefined
      if (completedPayouts.length > 1 && payoutFrequency > 0) {
        const avgDaysBetween = 30 / payoutFrequency
        const lastPayoutDate = new Date(
          completedPayouts[0].payout_date || completedPayouts[0].created_at
        )
        const nextDate = new Date(lastPayoutDate.getTime() + avgDaysBetween * 24 * 60 * 60 * 1000)
        nextPayoutDate = nextDate.toISOString()
      }

      return NextResponse.json({
        metrics: {
          expectedNextPayout,
          availablePayoutBalance: expectedNextPayout, // Same as expectedNextPayout - represents available balance for payout
          payoutFrequency,
          averagePayoutSize,
          growthTrend,
          nextPayoutDate,
          totalEarned,
        },
      })
    } else {
      // Admin metrics
      const { data: allPayouts, error: allPayoutsError } = await supabase
        .from("vendor_payouts")
        .select("amount, created_at, status, vendor_name, payout_date")
        .order("created_at", { ascending: false })

      if (allPayoutsError) {
        console.error("Error fetching all payouts:", allPayoutsError)
        return NextResponse.json({ error: "Failed to fetch payout data" }, { status: 500 })
      }

      // Calculate pending total
      const pendingPayouts = allPayouts?.filter((p) => p.status === "pending" || p.status === "processing") || []
      const totalPending = pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0)

      // Calculate success rate
      const completedPayouts = allPayouts?.filter((p) => p.status === "completed" || p.status === "paid") || []
      const failedPayouts = allPayouts?.filter((p) => p.status === "failed") || []
      const totalProcessed = completedPayouts.length + failedPayouts.length
      const successRate = totalProcessed > 0 ? (completedPayouts.length / totalProcessed) * 100 : 100

      // Calculate average processing time (hours between created_at and payout_date for completed)
      let totalProcessingTime = 0
      let processingCount = 0
      completedPayouts.forEach((payout) => {
        if (payout.payout_date && payout.created_at) {
          const created = new Date(payout.created_at)
          const paid = new Date(payout.payout_date)
          const hours = (paid.getTime() - created.getTime()) / (1000 * 60 * 60)
          if (hours > 0 && hours < 720) {
            // Reasonable range (0-30 days)
            totalProcessingTime += hours
            processingCount += 1
          }
        }
      })
      const averageProcessingTime = processingCount > 0 ? totalProcessingTime / processingCount : 0

      // Calculate payout velocity
      const now = new Date()
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const dailyPayouts = completedPayouts.filter(
        (p) => new Date(p.payout_date || p.created_at) >= last24Hours
      ).length
      const weeklyPayouts = completedPayouts.filter(
        (p) => new Date(p.payout_date || p.created_at) >= last7Days
      ).length
      const monthlyPayouts = completedPayouts.filter(
        (p) => new Date(p.payout_date || p.created_at) >= last30Days
      ).length

      // Top vendors
      const vendorMap = new Map<string, number>()
      completedPayouts.forEach((payout) => {
        const existing = vendorMap.get(payout.vendor_name) || 0
        vendorMap.set(payout.vendor_name, existing + (payout.amount || 0))
      })

      const topVendors = Array.from(vendorMap.entries())
        .map(([vendorName, amount]) => ({ vendorName, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)

      // Refund impact
      const { data: refundedItems } = await supabase
        .from("order_line_items_v2")
        .select("price, refunded_amount")
        .eq("refund_status", "full")
        .not("refunded_amount", "is", null)

      const refundImpact =
        refundedItems?.reduce((sum, item) => {
          const price = typeof item.price === "string" ? parseFloat(item.price || "0") : item.price || 0
          const refunded = typeof item.refunded_amount === "string"
            ? parseFloat(item.refunded_amount || "0")
            : item.refunded_amount || 0
          return sum + convertGBPToUSD(refunded)
        }, 0) || 0

      return NextResponse.json({
        metrics: {
          totalPending,
          averageProcessingTime,
          successRate,
          topVendors,
          payoutVelocity: {
            daily: dailyPayouts,
            weekly: weeklyPayouts / 7,
            monthly: monthlyPayouts / 30,
          },
          refundImpact,
        },
      })
    }
  } catch (error) {
    console.error("Error in metrics route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

