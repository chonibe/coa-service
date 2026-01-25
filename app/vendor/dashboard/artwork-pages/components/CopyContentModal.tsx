"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface CopyContentModalProps {
  isOpen: boolean
  onClose: () => void
  onCopy: (sourceProductId: string) => Promise<void>
  currentProductId: string
  vendorProducts: Array<{ id: string; name: string; hasContent: boolean }>
}

export function CopyContentModal({
  isOpen,
  onClose,
  onCopy,
  currentProductId,
  vendorProducts,
}: CopyContentModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [isCopying, setIsCopying] = useState(false)

  // Filter out current product and products without content
  const availableProducts = vendorProducts.filter(
    (p) => p.id !== currentProductId && p.hasContent
  )

  const handleCopy = async () => {
    if (!selectedProductId) return

    setIsCopying(true)
    try {
      await onCopy(selectedProductId)
      setSelectedProductId("")
      onClose()
    } catch (err) {
      console.error("Failed to copy content:", err)
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy Content from Another Artwork</DialogTitle>
          <DialogDescription>
            Select an artwork to copy all its content blocks. The content will be duplicated, not linked.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Artwork</label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an artwork..." />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No artworks with content available
                  </SelectItem>
                ) : (
                  availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {availableProducts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                You need at least one other artwork with content blocks to copy from.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCopying}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={!selectedProductId || isCopying}>
            {isCopying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Copying...
              </>
            ) : (
              "Copy Content"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
