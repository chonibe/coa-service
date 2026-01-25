/**
 * Centralized authentication error handler
 * Handles Supabase auth errors and provides fallback mechanisms
 */

import { redirect } from "next/navigation"

export interface AuthError {
  code?: number
  error_code?: string
  msg?: string
  message?: string
  name?: string
}

export interface AuthErrorHandlerOptions {
  redirectTo?: string
  allowedPaths?: string[]
  logError?: boolean
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): error is AuthError {
  return (
    error &&
    (error.error_code === 'unexpected_failure' ||
      error.code === 500 ||
      error.message?.includes('auth') ||
      error.message?.includes('session') ||
      error.message?.includes('token'))
  )
}

/**
 * Handle authentication errors with fallback to login
 */
export function handleAuthError(
  error: any,
  options: AuthErrorHandlerOptions = {}
): never {
  const {
    redirectTo = '/login',
    logError = true,
  } = options

  if (logError) {
    console.error('[auth-error-handler] Authentication error:', {
      code: error?.code,
      error_code: error?.error_code,
      message: error?.message || error?.msg,
      stack: error?.stack,
    })
  }

  // Create error message for user
  const errorMessage = getErrorMessage(error)
  
  // Redirect to login with error message
  const redirectUrl = new URL(redirectTo, 'http://localhost')
  redirectUrl.searchParams.set('error', errorMessage)
  redirectUrl.searchParams.set('returnTo', typeof window !== 'undefined' ? window.location.pathname : '/')
  
  redirect(redirectUrl.pathname + redirectUrl.search)
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: any): string {
  if (error?.error_code === 'unexpected_failure') {
    return 'Authentication failed. Please log in again.'
  }
  
  if (error?.code === 500) {
    return 'Server error. Please try logging in again.'
  }
  
  if (error?.message?.includes('session')) {
    return 'Your session has expired. Please log in again.'
  }
  
  if (error?.message?.includes('token')) {
    return 'Invalid authentication token. Please log in again.'
  }
  
  return 'Authentication error. Please log in again.'
}

/**
 * Wrap async function with auth error handling
 */
export function withAuthErrorHandling<T>(
  fn: () => Promise<T>,
  options: AuthErrorHandlerOptions = {}
): Promise<T> {
  return fn().catch((error) => {
    if (isAuthError(error)) {
      handleAuthError(error, options)
    }
    throw error
  })
}

/**
 * Safe auth operation that catches and handles errors
 */
export async function safeAuthOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  options: AuthErrorHandlerOptions = {}
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (isAuthError(error)) {
      if (options.logError !== false) {
        console.error('[auth-error-handler] Auth operation failed:', error)
      }
      handleAuthError(error, options)
    }
    
    // For non-auth errors, log and return fallback
    console.error('[auth-error-handler] Operation failed:', error)
    return fallback
  }
}
