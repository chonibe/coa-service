/**
 * Section Fallback Component
 * 
 * Shows a minimal "Content unavailable" message for larger sections that fail.
 * Designed to match the application's design system.
 */

import { AlertCircle } from "lucide-react"

type SectionFallbackProps = {
  sectionName?: string
  className?: string
  showIcon?: boolean
}

export function SectionFallback({ 
  sectionName, 
  className = '',
  showIcon = true 
}: SectionFallbackProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 rounded-lg border border-muted bg-muted/5 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-3" />
      )}
      <p className="text-sm text-muted-foreground">
        {sectionName ? `${sectionName} unavailable` : 'Content unavailable'}
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-muted-foreground/60 mt-1">
          Check console for details
        </p>
      )}
    </div>
  )
}
