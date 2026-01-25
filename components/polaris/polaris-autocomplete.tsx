'use client'

import React, { useEffect, useRef } from 'react'

/**
 * React wrapper for Polaris p-autocomplete web component
 */
export interface PolarisAutocompleteProps extends React.HTMLAttributes<HTMLElement> {
  label?: string
  labelHidden?: boolean
  helpText?: string
  error?: string | boolean
  requiredIndicator?: boolean
  disabled?: boolean
  placeholder?: string
  value?: string
  options?: Array<{ value: string; label: string }>
  onChange?: (value: string) => void
  onSelect?: (value: string) => void
}

export function PolarisAutocomplete({
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
  onSelect,
  className,
  style,
  ...props
}: PolarisAutocompleteProps) {
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
    if (options.length > 0) {
      element.setAttribute('options', JSON.stringify(options))
    }
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle events
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

    if (onSelect) {
      const handleSelect = (event: Event) => {
        const customEvent = event as CustomEvent<{ value: string }>
        onSelect(customEvent.detail.value)
      }
      element.addEventListener('select', handleSelect)
      return () => {
        element.removeEventListener('select', handleSelect)
      }
    }
  }, [
    label,
    labelHidden,
    helpText,
    error,
    requiredIndicator,
    disabled,
    placeholder,
    value,
    options,
    onChange,
    onSelect,
    className,
    style,
  ])

  return React.createElement('p-autocomplete', { ref, ...props })
}
