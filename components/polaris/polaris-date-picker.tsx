'use client'

import React, { useEffect, useRef } from 'react'

/**
 * React wrapper for Polaris p-date-picker web component
 */
export interface PolarisDatePickerProps extends React.HTMLAttributes<HTMLElement> {
  label?: string
  labelHidden?: boolean
  helpText?: string
  error?: string | boolean
  requiredIndicator?: boolean
  disabled?: boolean
  value?: string
  min?: string
  max?: string
  onChange?: (value: string) => void
}

export function PolarisDatePicker({
  label,
  labelHidden,
  helpText,
  error,
  requiredIndicator,
  disabled,
  value,
  min,
  max,
  onChange,
  className,
  style,
  ...props
}: PolarisDatePickerProps) {
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
    if (value) element.setAttribute('value', value)
    if (min) element.setAttribute('min', min)
    if (max) element.setAttribute('max', max)
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle change events
    if (onChange) {
      const handleChange = (event: Event) => {
        const customEvent = event as CustomEvent<{ value: string }>
        onChange(customEvent.detail.value)
      }
      element.addEventListener('change', handleChange)
      return () => {
        element.removeEventListener('change', handleChange)
      }
    }
  }, [label, labelHidden, helpText, error, requiredIndicator, disabled, value, min, max, onChange, className, style])

  return React.createElement('p-date-picker', { ref, ...props })
}
