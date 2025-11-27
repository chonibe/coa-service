"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

interface DeleteSeriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  seriesName: string
  memberCount: number
  isDeleting: boolean
}

export function DeleteSeriesDialog({
  open,
  onOpenChange,
  onConfirm,
  seriesName,
  memberCount,
  isDeleting,
}: DeleteSeriesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Series</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{seriesName}"?
            {memberCount > 0 && (
              <span className="block mt-2 text-destructive">
                This series contains {memberCount} {memberCount === 1 ? "artwork" : "artworks"}. 
                {memberCount > 0 && " The series will be deactivated but artworks will remain."}
              </span>
            )}
            {memberCount === 0 && (
              <span className="block mt-2">This action cannot be undone.</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

