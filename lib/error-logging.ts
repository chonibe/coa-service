/**
 * Centralized Error Logging System
 * 
 * Provides consistent error logging across the application with context capture.
 * In development: logs to console with rich formatting
 * In production: can be extended to send to monitoring services (Sentry, etc.)
 */

export type ErrorContext = {
  componentName?: string
  userId?: string
  vendorId?: string
  pathname?: string
  timestamp: string
  errorType: 'component' | 'import' | 'api' | 'runtime' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  [key: string]: any
}

export type ErrorLogEntry = {
  error: Error
  context: ErrorContext
  stack?: string
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log a component rendering error
   */
  logComponentError(error: Error, componentName: string, additionalContext?: Record<string, any>): void {
    const context: ErrorContext = {
      componentName,
      errorType: 'component',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...additionalContext,
    }

    this.log({ error, context, stack: error.stack })
  }

  /**
   * Log an import/module loading error
   */
  logImportError(error: Error, moduleName: string, additionalContext?: Record<string, any>): void {
    const context: ErrorContext = {
      componentName: moduleName,
      errorType: 'import',
      severity: 'high',
      timestamp: new Date().toISOString(),
      pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...additionalContext,
    }

    this.log({ error, context, stack: error.stack })
  }

  /**
   * Log an API call error
   */
  logAPIError(error: Error, endpoint: string, additionalContext?: Record<string, any>): void {
    const context: ErrorContext = {
      componentName: endpoint,
      errorType: 'api',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...additionalContext,
    }

    this.log({ error, context, stack: error.stack })
  }

  /**
   * Log a runtime error
   */
  logRuntimeError(error: Error, additionalContext?: Record<string, any>): void {
    const context: ErrorContext = {
      errorType: 'runtime',
      severity: 'high',
      timestamp: new Date().toISOString(),
      pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...additionalContext,
    }

    this.log({ error, context, stack: error.stack })
  }

  /**
   * Core logging method
   */
  private log(entry: ErrorLogEntry): void {
    if (this.isDevelopment) {
      // Rich console logging in development
      console.group(`🔴 Error [${entry.context.errorType}] - ${entry.context.severity}`)
      console.error('Error:', entry.error.message)
      if (entry.context.componentName) {
        console.log('Component:', entry.context.componentName)
      }
      if (entry.context.pathname) {
        console.log('Path:', entry.context.pathname)
      }
      console.log('Timestamp:', entry.context.timestamp)
      console.log('Context:', entry.context)
      if (entry.stack) {
        console.log('Stack:', entry.stack)
      }
      console.groupEnd()
    } else {
      // In production, log minimally to console
      // This can be extended to send to monitoring services
      console.error(`[${entry.context.errorType}] ${entry.context.componentName || 'Unknown'}:`, entry.error.message)
      
      // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
      // Example:
      // Sentry.captureException(entry.error, {
      //   tags: {
      //     errorType: entry.context.errorType,
      //     severity: entry.context.severity,
      //   },
      //   extra: entry.context,
      // })
    }
  }

  /**
   * Check if an error is a known recoverable error
   */
  isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /not found/i,
    ]

    return recoverablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    )
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: Error): string {
    if (this.isRecoverableError(error)) {
      return 'This content is temporarily unavailable. Please try again.'
    }

    // Generic message for unknown errors
    return 'Something went wrong. Please refresh the page.'
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger()

// Export class for testing
export { ErrorLogger }
