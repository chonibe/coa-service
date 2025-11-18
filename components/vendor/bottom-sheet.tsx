"use client"

import { useEffect, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  className?: string
}

/**
 * Bottom sheet modal component optimized for mobile
 * Slides up from bottom on mobile, centered dialog on desktop
 */
export function BottomSheet({ open, onOpenChange, children, title, className }: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !contentRef.current) return

    // Prevent body scroll when bottom sheet is open
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 top-auto max-h-[90vh] translate-y-0 rounded-t-lg border-t p-0 sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border-t-0",
          className
        )}
      >
        {(title || true) && (
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="ml-auto h-8 w-8 min-h-[44px] min-w-[44px]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

