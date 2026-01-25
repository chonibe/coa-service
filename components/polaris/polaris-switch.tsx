'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisSwitchProps } from './types'

/**
 * React wrapper for Polaris p-switch web component
 */
export function PolarisSwitch({
  label,
  checked,
  disabled,
  id,
  name,
  helpText,
  onChange,
  children,
  className,
  style,
  ...props
}: PolarisSwitchProps) {
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
    if (id) element.setAttribute('id', id)
    if (name) element.setAttribute('name', name)
    if (helpText) element.setAttribute('help-text', helpText)
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
  }, [label, checked, disabled, id, name, helpText, onChange, className, style])

  return React.createElement('p-switch', { ref, ...props }, children)
}
