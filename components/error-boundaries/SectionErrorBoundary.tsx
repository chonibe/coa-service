"use client"

/**
 * Section Error Boundary
 * 
 * Catches errors at the section level (larger UI areas like cards, tabs, panels).
 * Provides a more visible fallback than component-level boundaries.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { errorLogger } from '@/lib/error-logging'
import { SectionFallback } from './fallbacks/SectionFallback'

type SectionErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
  sectionName?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  className?: string
  showIcon?: boolean
}

type SectionErrorBoundaryState = {
  hasError: boolean
  error?: Error
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { sectionName, onError } = this.props

    // Log the error with section context
    errorLogger.logComponentError(error, sectionName || 'UnknownSection', {
      errorInfo: errorInfo.componentStack,
      sectionName,
      isSectionError: true,
    })

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback, sectionName, className, showIcon = true } = this.props

      // Custom fallback provided
      if (fallback) {
        return fallback
      }

      // Use default section fallback
      return (
        <SectionFallback 
          sectionName={sectionName} 
          className={className}
          showIcon={showIcon}
        />
      )
    }

    return this.props.children
  }
}
