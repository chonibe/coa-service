/**
 * Minimal Fallback Component
 * 
 * Shows a subtle, unobtrusive placeholder when a component fails.
 * Designed to blend into the UI with minimal visual disruption.
 */

type MinimalFallbackProps = {
  className?: string
  componentName?: string
}

export function MinimalFallback({ className = '', componentName }: MinimalFallbackProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center min-h-[20px] min-w-[20px] ${className}`}
      role="status"
      aria-label="Content unavailable"
    >
      <div 
        className="w-4 h-4 rounded border border-muted-foreground/20 bg-muted/10"
        title={process.env.NODE_ENV === 'development' && componentName ? `Component error: ${componentName}` : undefined}
      />
    </div>
  )
}
