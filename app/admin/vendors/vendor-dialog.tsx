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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Instagram } from "lucide-react"

interface VendorDialogProps {
  vendor: {
    name: string
    instagram_url?: string | null
    notes?: string | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function VendorDialog({ vendor, open, onOpenChange, onSave }: VendorDialogProps) {
  const [instagramUrl, setInstagramUrl] = useState(vendor?.instagram_url || "")
  const [notes, setNotes] = useState(vendor?.notes || "")
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when vendor changes
  useState(() => {
    if (vendor) {
      setInstagramUrl(vendor.instagram_url || "")
      setNotes(vendor.notes || "")
    }
  })

  const handleSave = async () => {
    if (!vendor) return

    setIsLoading(true)

    try {
      // Format Instagram URL if needed
      let formattedUrl = instagramUrl.trim()
      if (formattedUrl && !formattedUrl.startsWith("http")) {
        // If it's just a username, convert to full URL
        if (formattedUrl.startsWith("@")) {
          formattedUrl = `https://instagram.com/${formattedUrl.substring(1)}`
        } else {
          formattedUrl = `https://instagram.com/${formattedUrl}`
        }
      }

      const response = await fetch("/api/vendors/custom-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorName: vendor.name,
          instagramUrl: formattedUrl,
          notes: notes.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save vendor data")
      }

      toast({
        title: "Vendor updated",
        description: `Successfully updated ${vendor.name}`,
      })

      onOpenChange(false)
      onSave()
    } catch (error) {
      console.error("Error saving vendor:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save vendor data",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogDescription>Add additional information for {vendor?.name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={vendor?.name || ""} className="col-span-3" disabled />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="instagram" className="text-right">
              Instagram
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              <Input
                id="instagram"
                placeholder="@username or URL"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this vendor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
