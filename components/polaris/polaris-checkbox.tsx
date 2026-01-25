'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisCheckboxProps } from './types'

/**
 * React wrapper for Polaris p-checkbox web component
 */
export function PolarisCheckbox({
  label,
  checked,
  disabled,
  error,
  helpText,
  id,
  name,
  value,
  onChange,
  children,
  className,
  style,
  ...props
}: PolarisCheckboxProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (label) element.setAttribute('label', label)
    if (checked !== undefined) {
      if (checked) {
        element.setAttribute('checked', '')
      } else {
        element.removeAttribute('checked')
      }
    }
    if (disabled) element.setAttribute('disabled', '')
    if (error) {
      element.setAttribute('error', typeof error === 'string' ? error : '')
    }
    if (helpText) element.setAttribute('help-text', helpText)
    if (id) element.setAttribute('id', id)
    if (name) element.setAttribute('name', name)
    if (value !== undefined) element.setAttribute('value', String(value))
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle change events
    if (onChange) {
      const handleChange = (event: Event) => {
        const target = event.target as HTMLElement
        const isChecked = target.hasAttribute('checked')
        onChange(isChecked)
      }
      element.addEventListener('change', handleChange)
      return () => {
        element.removeEventListener('change', handleChange)
      }
    }
  }, [label, checked, disabled, error, helpText, id, name, value, onChange, className, style])

  return React.createElement('p-checkbox', { ref, ...props }, children || label)
}
