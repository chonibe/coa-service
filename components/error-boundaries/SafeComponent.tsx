"use client"

/**
 * Safe Component Wrapper
 * 
 * HOC that wraps any component with error handling and loading states.
 * Useful for making third-party or unstable components safe.
 */

import React, { Suspense, ComponentType } from 'react'
import { ComponentErrorBoundary } from './ComponentErrorBoundary'
import { Loader2 } from 'lucide-react'

type SafeComponentProps<P = any> = {
  component: ComponentType<P>
  componentProps?: P
  componentName?: string
  fallback?: React.ReactNode
  fallbackMode?: 'silent' | 'minimal' | 'custom'
  loadingFallback?: React.ReactNode
  onError?: (error: Error) => void
  className?: string
}

/**
 * Default loading fallback
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  )
}

/**
 * SafeComponent wrapper
 */
export function SafeComponent<P = any>({
  component: Component,
  componentProps,
  componentName,
  fallback,
  fallbackMode = 'minimal',
  loadingFallback,
  onError,
  className,
}: SafeComponentProps<P>) {
  return (
    <ComponentErrorBoundary
      componentName={componentName || Component.displayName || Component.name}
      fallback={fallback}
      fallbackMode={fallbackMode}
      onError={onError}
      className={className}
    >
      <Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        <Component {...(componentProps as P)} />
      </Suspense>
    </ComponentErrorBoundary>
  )
}

/**
 * HOC version - wraps a component and returns a new safe component
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options?: {
    componentName?: string
    fallback?: React.ReactNode
    fallbackMode?: 'silent' | 'minimal' | 'custom'
    onError?: (error: Error) => void
  }
) {
  const WrappedComponent = (props: P) => (
    <ComponentErrorBoundary
      componentName={options?.componentName || Component.displayName || Component.name}
      fallback={options?.fallback}
      fallbackMode={options?.fallbackMode}
      onError={options?.onError}
    >
      <Component {...props} />
    </ComponentErrorBoundary>
  )

  WrappedComponent.displayName = `SafeComponent(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}
