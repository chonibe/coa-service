"use client"

import { useState, useEffect } from "react"




import { Settings, GripVertical } from "lucide-react"
import { PayoutTrendsChart } from "./payout-trends-chart"
import { PayoutForecast } from "./payout-forecast"
import { ProductPerformanceHeatmap } from "./product-performance-heatmap"
import { PayoutMetricsCards } from "./payout-metrics-cards"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui"
interface WidgetConfig {
  id: string
  title: string
  component: React.ComponentType<any>
  defaultVisible: boolean
  order: number
}

interface DashboardWidgetsProps {
  vendorName?: string
  isAdmin?: boolean
}

const availableWidgets: WidgetConfig[] = [
  { id: "metrics", title: "Key Metrics", component: PayoutMetricsCards, defaultVisible: true, order: 1 },
  { id: "trends", title: "Payout Trends", component: PayoutTrendsChart, defaultVisible: true, order: 2 },
  { id: "forecast", title: "Forecast", component: PayoutForecast, defaultVisible: true, order: 3 },
  { id: "products", title: "Product Performance", component: ProductPerformanceHeatmap, defaultVisible: false, order: 4 },
]

export function DashboardWidgets({ vendorName, isAdmin = false }: DashboardWidgetsProps) {
  const [widgetConfigs, setWidgetConfigs] = useState<Record<string, { visible: boolean; order: number }>>({})
  const [isCustomizing, setIsCustomizing] = useState(false)

  useEffect(() => {
    // Load saved widget configuration from localStorage
    const saved = localStorage.getItem(`dashboard-widgets-${isAdmin ? "admin" : vendorName}`)
    if (saved) {
      try {
        setWidgetConfigs(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading widget config:", error)
      }
    } else {
      // Initialize with defaults
      const defaults: Record<string, { visible: boolean; order: number }> = {}
      availableWidgets.forEach((widget) => {
        defaults[widget.id] = { visible: widget.defaultVisible, order: widget.order }
      })
      setWidgetConfigs(defaults)
    }
  }, [vendorName, isAdmin])

  const saveWidgetConfig = (configs: Record<string, { visible: boolean; order: number }>) => {
    setWidgetConfigs(configs)
    localStorage.setItem(`dashboard-widgets-${isAdmin ? "admin" : vendorName}`, JSON.stringify(configs))
  }

  const toggleWidget = (widgetId: string) => {
    const newConfigs = { ...widgetConfigs }
    if (newConfigs[widgetId]) {
      newConfigs[widgetId].visible = !newConfigs[widgetId].visible
    } else {
      const widget = availableWidgets.find((w) => w.id === widgetId)
      if (widget) {
        newConfigs[widgetId] = { visible: true, order: widget.order }
      }
    }
    saveWidgetConfig(newConfigs)
  }

  const resetToDefaults = () => {
    const defaults: Record<string, { visible: boolean; order: number }> = {}
    availableWidgets.forEach((widget) => {
      defaults[widget.id] = { visible: widget.defaultVisible, order: widget.order }
    })
    saveWidgetConfig(defaults)
  }

  const visibleWidgets = availableWidgets
    .filter((widget) => widgetConfigs[widget.id]?.visible !== false)
    .sort((a, b) => {
      const orderA = widgetConfigs[a.id]?.order || a.order
      const orderB = widgetConfigs[b.id]?.order || b.order
      return orderA - orderB
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customize Dashboard</DialogTitle>
              <DialogDescription>
                Choose which widgets to display and arrange them to your preference.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {availableWidgets.map((widget) => {
                const config = widgetConfigs[widget.id]
                const isVisible = config?.visible !== false
                return (
                  <div key={widget.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <label className="font-medium">{widget.title}</label>
                    </div>
                    <Checkbox
                      checked={isVisible}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                )
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetToDefaults}>
                Reset to Defaults
              </Button>
              <Button onClick={() => setIsCustomizing(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {visibleWidgets.map((widget) => {
        const WidgetComponent = widget.component
        return (
          <div key={widget.id}>
            <WidgetComponent vendorName={vendorName} isAdmin={isAdmin} />
          </div>
        )
      })}
    </div>
  )
}



