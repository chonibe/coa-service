/**
 * Silent Fallback Component
 * 
 * Renders nothing when a component fails, providing complete silence.
 * Optionally shows a tiny debug indicator in development mode.
 */

type SilentFallbackProps = {
  showDebugIndicator?: boolean
  componentName?: string
}

export function SilentFallback({ showDebugIndicator = false, componentName }: SilentFallbackProps) {
  // In production, always return null
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  // In development, optionally show a tiny indicator
  if (!showDebugIndicator) {
    return null
  }

  return (
    <div 
      className="inline-block w-2 h-2 rounded-full bg-red-500/20" 
      title={`Component error${componentName ? `: ${componentName}` : ''}`}
      aria-hidden="true"
    />
  )
}
