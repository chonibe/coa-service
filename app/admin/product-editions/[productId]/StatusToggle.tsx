'use client'

import { Switch } from "@/components/ui/switch"
import { updateItemStatus } from "@/lib/api"
import { toast } from "sonner"
import { useState } from "react"

interface StatusToggleProps {
  lineItemId: string
  orderId: string
  initialStatus: string
  onStatusChange: () => void
}

export function StatusToggle({ lineItemId, orderId, initialStatus, onStatusChange }: StatusToggleProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(initialStatus)

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true)
    try {
      const newStatus = checked ? "active" : "removed"
      await updateItemStatus(lineItemId, orderId, newStatus)
      setStatus(newStatus)
      onStatusChange()
      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
      // Revert the toggle if there was an error
      setStatus(status)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Switch
      checked={status === "active"}
      onCheckedChange={handleToggle}
      disabled={isLoading}
      className="data-[state=checked]:bg-green-600"
    />
  )
} 