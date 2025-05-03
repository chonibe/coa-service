"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface VendorSalesChartProps {
  vendorName?: string
}

export function VendorSalesChart({ vendorName }: VendorSalesChartProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setError(null)
      } catch (err) {
        console.error("Error fetching sales data:", err)
        setError("Failed to load sales data")
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [vendorName])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  // Placeholder for chart
  return (
    <div className="h-[300px] flex flex-col items-center justify-center">
      <div className="w-full h-full flex items-end justify-around">
        {[30, 70, 45, 80, 55, 65, 40, 90, 75, 60, 50, 85].map((height, index) => (
          <div key={index} className="relative group">
            <div
              className="w-8 bg-primary/80 hover:bg-primary transition-all rounded-t"
              style={{ height: `${height}%` }}
            ></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs rounded px-2 py-1 pointer-events-none">
              {height}%
            </div>
          </div>
        ))}
      </div>
      <div className="w-full flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
        <span>Jul</span>
        <span>Aug</span>
        <span>Sep</span>
        <span>Oct</span>
        <span>Nov</span>
        <span>Dec</span>
      </div>
    </div>
  )
}
