'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisSelectProps } from './types'

/**
 * React wrapper for Polaris p-select web component
 */
export function PolarisSelect({
  label,
  labelHidden,
  helpText,
  error,
  requiredIndicator,
  disabled,
  placeholder,
  value,
  options = [],
  onChange,
  className,
  style,
  ...props
}: PolarisSelectProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (label) element.setAttribute('label', label)
    if (labelHidden) element.setAttribute('label-hidden', '')
    if (helpText) element.setAttribute('help-text', helpText)
    if (error) {
      element.setAttribute('error', typeof error === 'string' ? error : '')
    }
    if (requiredIndicator) element.setAttribute('required-indicator', '')
    if (disabled) element.setAttribute('disabled', '')
    if (placeholder) element.setAttribute('placeholder', placeholder)
    if (value !== undefined) element.setAttribute('value', String(value))
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Set options if provided
    if (options.length > 0) {
      // Clear existing options
      const existingOptions = element.querySelectorAll('p-option')
      existingOptions.forEach((opt) => opt.remove())

      // Add new options
      options.forEach((option) => {
        const optionElement = document.createElement('p-option')
        optionElement.setAttribute('value', option.value)
        optionElement.textContent = option.label
        if (option.disabled) optionElement.setAttribute('disabled', '')
        element.appendChild(optionElement)
      })
    }

    // Handle change events
    if (onChange) {
      element.addEventListener('change', onChange as EventListener)
      return () => {
        element.removeEventListener('change', onChange as EventListener)
      }
    }
  }, [label, labelHidden, helpText, error, requiredIndicator, disabled, placeholder, value, options, onChange, className, style])

  return React.createElement('p-select', { ref, ...props })
}

// Select sub-components for backward compatibility
export function PolarisSelectTrigger({ children, className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  )
}

export function PolarisSelectContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function PolarisSelectItem({ value, children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  return (
    <div className={className} data-value={value} {...props}>
      {children}
    </div>
  )
}

export function PolarisSelectValue({ placeholder, className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }) {
  return (
    <span className={className} {...props}>
      {placeholder || ''}
    </span>
  )
}
