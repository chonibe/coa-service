'use client'

import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { updateItemStatus } from "@/lib/api"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface StatusToggleProps {
  lineItemId: string
  orderId: string
  initialStatus: string
  onStatusChange: () => void
  totalEditions: number
  activeEditions: number
}

export function StatusToggle({ 
  lineItemId, 
  orderId, 
  initialStatus, 
  onStatusChange,
  totalEditions,
  activeEditions 
}: StatusToggleProps) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(initialStatus)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<"active" | "removed" | null>(null)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = async (checked: boolean) => {
    if (!mounted) return
    const newStatus = checked ? "active" : "removed"
    setPendingStatus(newStatus)
    setShowConfirmDialog(true)
  }

  const confirmStatusChange = async () => {
    if (!mounted || !pendingStatus) return

    setIsLoading(true)
    try {
      await updateItemStatus(lineItemId, orderId, pendingStatus)
      setStatus(pendingStatus)
      onStatusChange()
      toast.success(`Status updated to ${pendingStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
      // Revert the toggle if there was an error
      setStatus(status)
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
      setPendingStatus(null)
    }
  }

  const remainingEditions = activeEditions - (status === "active" ? 1 : 0)
  const isLastActive = status === "active" && remainingEditions === 0

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Switch
              checked={status === "active"}
              onCheckedChange={handleToggle}
              disabled={isLoading || isLastActive}
              className={`data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Active Editions: {activeEditions}</p>
          <p>Total Editions: {totalEditions}</p>
          {isLastActive && <p className="text-red-500">Cannot remove last active edition</p>}
        </TooltipContent>
      </Tooltip>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              {pendingStatus === "removed" 
                ? "Are you sure you want to remove this edition? This will resequence the remaining editions."
                : "Are you sure you want to reactivate this edition?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmStatusChange}
              variant={pendingStatus === "removed" ? "destructive" : "default"}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
} 