"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SalesData {
  date: string
  sales: number
  revenue: number
}

interface SalesChartProps {
  vendorName: string
}

export function SalesChart({ vendorName }: SalesChartProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch sales data from Supabase
        const { data, error } = await supabase
          .from("product_edition_counters")
          .select("updated_at, current_edition_number, product_id")
          .eq("vendor_name", vendorName)

        if (error) {
          throw new Error(`Failed to fetch sales data: ${error.message}`)
        }

        // Transform the data to match the expected format
        const transformedData: SalesData[] = data.map((item) => ({
          date: item.updated_at.substring(0, 10), // Extract date part
          sales: item.current_edition_number, // Use current_edition_number as sales
          revenue: item.current_edition_number * 50, // Assuming an average price of $50
        }))

        setSalesData(transformedData)
      } catch (err: any) {
        console.error("Error fetching sales data:", err)
        setError(err.message || "Failed to load sales data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [vendorName])

  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">{error}</div>
        ) : salesData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No sales data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" name="Sales" />
              <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
