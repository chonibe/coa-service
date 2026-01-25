/**
 * Error Boundaries Index
 * 
 * Central export for all error boundary components and utilities
 */

// Error Boundary Components
export { ComponentErrorBoundary } from './ComponentErrorBoundary'
export { SectionErrorBoundary } from './SectionErrorBoundary'
export { SafeComponent, withErrorBoundary } from './SafeComponent'

// Fallback Components
export { SilentFallback } from './fallbacks/SilentFallback'
export { MinimalFallback } from './fallbacks/MinimalFallback'
export { SectionFallback } from './fallbacks/SectionFallback'

// Re-export error logging utilities
export { errorLogger, ErrorLogger } from '@/lib/error-logging'
export type { ErrorContext, ErrorLogEntry } from '@/lib/error-logging'
