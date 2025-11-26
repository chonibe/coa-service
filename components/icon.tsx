/**
 * Icon Component - Centralized icon wrapper for consistent sizing and styling
 * 
 * This component provides a consistent way to use icons throughout the app
 * with proper sizing, alignment, and accessibility.
 */

import { cn } from "@/lib/utils"

interface IconProps {
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  children: React.ReactNode
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
}

export function Icon({ className, size = "md", children }: IconProps) {
  return (
    <span className={cn("inline-flex items-center justify-center flex-shrink-0", sizeClasses[size], className)}>
      {children}
    </span>
  )
}

// Re-export commonly used Heroicons for convenience
export {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline"

