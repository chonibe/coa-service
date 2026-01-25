"use client"

/**
 * Backward-compatible re-export from Polaris components
 * This file maintains compatibility for imports from @/components/ui/dialog
 * 
 * Note: Some sub-components like DialogPortal, DialogOverlay, DialogClose
 * are kept from Radix UI as they don't have direct Polaris equivalents
 */
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

// Re-export Polaris dialog components
export {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  type DialogProps,
} from '@/components/ui'

// Keep DialogPortal, DialogOverlay, DialogClose for backward compatibility
// These are used by some components that need Radix primitives
const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

export { DialogPortal, DialogOverlay, DialogClose }
