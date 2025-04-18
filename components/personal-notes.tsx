"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { usePersonalNotes } from "@/hooks/use-personal-notes"

interface PersonalNotesProps {
  isOpen: boolean
  onClose: () => void
  artistId: string
  certificateId: string
  collectorId: string
}

export function PersonalNotes({ isOpen, onClose, artistId, certificateId, collectorId }: PersonalNotesProps) {
  const { notes, saveNotes, loading } = usePersonalNotes(artistId, certificateId, collectorId)
  const [currentNotes, setCurrentNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load existing notes when the dialog opens
  useEffect(() => {
    if (isOpen && notes) {
      setCurrentNotes(notes)
    }
  }, [isOpen, notes])

  const handleSave = async () => {
    setSaving(true)

    try {
      await saveNotes(currentNotes)
      setSaved(true)

      // Reset the saved indicator after a moment
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Error saving notes:", error)
    } finally {
      setSaving(false)
    }
  }

  // Auto-save on close
  const handleClose = async () => {
    if (currentNotes !== notes) {
      await saveNotes(currentNotes)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Personal Notes</DialogTitle>
        </DialogHeader>

        <div className="my-4">
          <Textarea
            placeholder="Add your personal thoughts, memories, or experiences with this artwork..."
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            rows={12}
            className="min-h-[200px]"
          />
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm">{saved && <span className="text-green-600">Notes saved</span>}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
