"use client"

/**
 * Component Error Boundary
 * 
 * Catches errors at the component level and provides graceful fallbacks.
 * Supports silent mode for minimal UI disruption.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { errorLogger } from '@/lib/error-logging'
import { SilentFallback } from './fallbacks/SilentFallback'
import { MinimalFallback } from './fallbacks/MinimalFallback'

type FallbackMode = 'silent' | 'minimal' | 'custom'

type ComponentErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
  fallbackMode?: FallbackMode
  componentName?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  className?: string
}

type ComponentErrorBoundaryState = {
  hasError: boolean
  error?: Error
}

export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { componentName, onError } = this.props

    // Log the error
    errorLogger.logComponentError(error, componentName || 'UnknownComponent', {
      errorInfo: errorInfo.componentStack,
      props: this.props,
    })

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback, fallbackMode = 'minimal', componentName, className } = this.props

      // Custom fallback provided
      if (fallback) {
        return fallback
      }

      // Use fallback mode
      switch (fallbackMode) {
        case 'silent':
          return <SilentFallback componentName={componentName} showDebugIndicator={process.env.NODE_ENV === 'development'} />
        
        case 'minimal':
          return <MinimalFallback componentName={componentName} className={className} />
        
        default:
          return <MinimalFallback componentName={componentName} className={className} />
      }
    }

    return this.props.children
  }
}
