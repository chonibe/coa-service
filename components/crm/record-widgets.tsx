"use client"

import { useState, useEffect } from "react"

import { Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
interface RecordWidget {
  id: string
  name: string
  title: string
  widget_type: string
  config: any
}

interface RecordWidgetsProps {
  entityType: string
  recordId: string
}

export function RecordWidgets({ entityType, recordId }: RecordWidgetsProps) {
  const [widgets, setWidgets] = useState<RecordWidget[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWidgets()
  }, [entityType])

  const fetchWidgets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/crm/record-widgets?entity_type=${entityType}`)
      if (!response.ok) throw new Error("Failed to fetch widgets")
      const data = await response.json()
      setWidgets(data.widgets || [])
    } catch (err: any) {
      console.error("Error fetching record widgets:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading widgets...</span>
      </div>
    )
  }

  if (widgets.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {widgets.map((widget) => (
        <Card key={widget.id}>
          <CardHeader>
            <CardTitle>{widget.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {widget.widget_type === "custom" && (
              <div className="text-sm text-muted-foreground">
                Custom widget: {widget.name}
                {/* TODO: Render custom widget based on config */}
              </div>
            )}
            {widget.widget_type === "chart" && (
              <div className="text-sm text-muted-foreground">
                Chart widget: {widget.config?.chart_type || "Unknown"}
                {/* TODO: Render chart based on config */}
              </div>
            )}
            {widget.widget_type === "list" && (
              <div className="text-sm text-muted-foreground">
                List widget: {widget.config?.list_type || "Unknown"}
                {/* TODO: Render list based on config */}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

