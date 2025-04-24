"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface SyncDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (productId: string) => void
  syncResult: any
}

export function SyncDialog({ isOpen, onClose, onConfirm, syncResult }: SyncDialogProps) {
  const [productId, setProductId] = useState("")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync Edition Data</DialogTitle>
          <DialogDescription>
            Enter a product ID to sync edition data for that product. This will update all edition numbers in the
            database.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="productId" className="text-right">
            Product ID
          </Label>
          <Input
            id="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Enter product ID"
            className="mt-2"
          />
        </div>

        {syncResult && (
          <div className="bg-muted p-4 rounded-md text-sm">
            <h4 className="font-semibold mb-2">Sync Results:</h4>
            <div className="space-y-1">
              <p>Product: {syncResult.productTitle}</p>
              <p>Total Editions: {syncResult.totalEditions}</p>
              <p>Edition Total: {syncResult.editionTotal || "Not specified"}</p>
              <p>Active Items: {syncResult.activeItems}</p>
              <p>Removed Items: {syncResult.removedItems}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={() => onConfirm(productId)}>
            Sync Edition Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
