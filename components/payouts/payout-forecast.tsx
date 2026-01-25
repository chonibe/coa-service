"use client"

import { useState, useEffect } from "react"


import { Skeleton } from "@/components/ui"

import { AlertCircle, TrendingUp, Calendar } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from "recharts"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, AlertDescription } from "@/components/ui"
interface ForecastData {
  date: string
  historical: number
  forecast: number
  confidenceLow: number
  confidenceHigh: number
  isHistorical: boolean
}

interface PayoutForecastProps {
  vendorName?: string
  isAdmin?: boolean
  forecastDays?: number
}

export function PayoutForecast({ vendorName, isAdmin = false, forecastDays = 30 }: PayoutForecastProps) {
  const [data, setData] = useState<ForecastData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDays, setSelectedDays] = useState<string>(forecastDays.toString())

  useEffect(() => {
    fetchForecastData()
  }, [selectedDays, vendorName])

  const fetchForecastData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const url = isAdmin
        ? `/api/payouts/forecast?days=${selectedDays}`
        : `/api/payouts/forecast?days=${selectedDays}&vendorName=${encodeURIComponent(vendorName || "")}`

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch forecast data")
      }

      const result = await response.json()
      setData(result.forecast || [])
    } catch (err) {
      console.error("Error fetching forecast data:", err)
      setError(err instanceof Error ? err.message : "Failed to load forecast")
    } finally {
      setIsLoading(false)
    }
  }

  const historicalData = data.filter((d) => d.isHistorical)
  const forecastData = data.filter((d) => !d.isHistorical)
  const avgHistorical = historicalData.length > 0 ? historicalData.reduce((sum, d) => sum + d.historical, 0) / historicalData.length : 0
  const avgForecast = forecastData.length > 0 ? forecastData.reduce((sum, d) => sum + d.forecast, 0) / forecastData.length : 0
  const totalForecast = forecastData.reduce((sum, d) => sum + d.forecast, 0)

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d")
    } catch {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout Forecast</CardTitle>
          <CardDescription>Predictive analytics for future payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout Forecast</CardTitle>
          <CardDescription>Predictive analytics for future payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout Forecast</CardTitle>
          <CardDescription>Predictive analytics for future payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Insufficient historical data for forecasting
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Payout Forecast
            </CardTitle>
            <CardDescription>AI-powered predictions based on historical patterns</CardDescription>
          </div>
          <Select value={selectedDays} onValueChange={setSelectedDays}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Avg Historical</div>
            <div className="text-2xl font-bold">{formatUSD(avgHistorical)}</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Avg Forecast</div>
            <div className="text-2xl font-bold">{formatUSD(avgForecast)}</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-sm text-muted-foreground">Total Forecast</div>
            <div className="text-2xl font-bold text-primary">{formatUSD(totalForecast)}</div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "historical") return [formatUSD(value), "Historical"]
                if (name === "forecast") return [formatUSD(value), "Forecast"]
                if (name === "confidenceLow") return [formatUSD(value), "Low Estimate"]
                if (name === "confidenceHigh") return [formatUSD(value), "High Estimate"]
                return [value, name]
              }}
              labelFormatter={formatDate}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#8884d8"
              strokeWidth={2}
              name="Historical"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#82ca9d"
              strokeWidth={3}
              name="Forecast"
              strokeDasharray="5 5"
              dot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="confidenceLow"
              stroke="#ffc658"
              strokeWidth={1}
              strokeDasharray="3 3"
              name="Low Estimate"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="confidenceHigh"
              stroke="#ffc658"
              strokeWidth={1}
              strokeDasharray="3 3"
              name="High Estimate"
              dot={false}
            />
            {data.length > 0 && (
              <ReferenceArea
                x1={historicalData[historicalData.length - 1]?.date}
                x2={data[data.length - 1]?.date}
                fill="#82ca9d"
                fillOpacity={0.1}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Forecast based on {historicalData.length} days of historical data using linear regression and seasonal
              adjustments
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



