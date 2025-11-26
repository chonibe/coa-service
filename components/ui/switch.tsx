"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled, className, id, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked)
      }
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        id={id}
        ref={ref}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 bg-transparent",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "material-symbols-outlined text-3xl leading-none transition-all duration-200 select-none",
            checked 
              ? "text-primary" 
              : "text-slate-400 dark:text-slate-500"
          )}
          style={{
            fontVariationSettings: checked ? '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' : '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
          }}
        >
          toggle_on
        </span>
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
