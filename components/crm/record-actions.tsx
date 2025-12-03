"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import * as Icons from "lucide-react"

interface RecordAction {
  id: string
  name: string
  label: string
  icon: string | null
  action_type: "server_function" | "modal" | "url"
  config: any
}

interface RecordActionsProps {
  entityType: string
  recordId: string
}

export function RecordActions({ entityType, recordId }: RecordActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [actions, setActions] = useState<RecordAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)

  useEffect(() => {
    fetchActions()
  }, [entityType])

  const fetchActions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/crm/record-actions?entity_type=${entityType}`)
      if (!response.ok) throw new Error("Failed to fetch actions")
      const data = await response.json()
      setActions(data.actions || [])
    } catch (err: any) {
      console.error("Error fetching record actions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecute = async (action: RecordAction) => {
    try {
      setExecuting(action.id)
      const response = await fetch(`/api/crm/record-actions/${action.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_id: recordId,
          record_type: entityType,
        }),
      })

      if (!response.ok) throw new Error("Failed to execute action")

      const result = await response.json()

      if (result.action_type === "url") {
        router.push(result.url)
      } else if (result.action_type === "modal") {
        // TODO: Show modal with result.modal_config
        toast({
          title: "Action executed",
          description: "Modal action triggered",
        })
      } else {
        toast({
          title: "Action executed",
          description: result.message || "Action completed successfully",
        })
        // Refresh page data if needed
        window.location.reload()
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to execute action",
      })
    } finally {
      setExecuting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading actions...</span>
      </div>
    )
  }

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const IconComponent = action.icon
          ? (Icons as any)[action.icon] || Icons.Circle
          : Icons.Circle

        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => handleExecute(action)}
            disabled={executing === action.id}
          >
            {executing === action.id ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IconComponent className="h-4 w-4 mr-2" />
            )}
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}

