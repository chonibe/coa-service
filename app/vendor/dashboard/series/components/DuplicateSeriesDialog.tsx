"use client"

import { useState } from "react"




import { Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button, Input, Label } from "@/components/ui"
interface DuplicateSeriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (newName: string) => Promise<void>
  originalName: string
  isDuplicating: boolean
}

export function DuplicateSeriesDialog({
  open,
  onOpenChange,
  onConfirm,
  originalName,
  isDuplicating,
}: DuplicateSeriesDialogProps) {
  const [newName, setNewName] = useState(`${originalName} (Copy)`)

  const handleConfirm = async () => {
    if (newName.trim()) {
      await onConfirm(newName.trim())
      setNewName(`${originalName} (Copy)`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Series</DialogTitle>
          <DialogDescription>
            Create a copy of "{originalName}" with a new name. All artworks and settings will be duplicated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">New Series Name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter series name"
              disabled={isDuplicating}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDuplicating}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!newName.trim() || isDuplicating}>
            {isDuplicating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Duplicating...
              </>
            ) : (
              "Duplicate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

