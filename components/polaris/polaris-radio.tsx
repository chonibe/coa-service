'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisRadioProps } from './types'

/**
 * React wrapper for Polaris p-radio web component
 */
export function PolarisRadio({
  label,
  checked,
  disabled,
  id,
  name,
  value,
  helpText,
  onChange,
  children,
  className,
  style,
  ...props
}: PolarisRadioProps) {
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
    if (value !== undefined) element.setAttribute('value', String(value))
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
  }, [label, checked, disabled, id, name, value, helpText, onChange, className, style])

  return React.createElement('p-radio', { ref, ...props }, children || label)
}

// Radio Group wrapper
export function PolarisRadioGroup({
  children,
  className,
  name,
  value,
  onChange,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  name?: string
  value?: string
  onChange?: (value: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (name) element.setAttribute('name', name)
    if (value !== undefined) element.setAttribute('value', value)

    if (onChange) {
      const handleChange = (event: Event) => {
        const target = event.target as HTMLElement
        const newValue = target.getAttribute('value') || ''
        onChange(newValue)
      }
      element.addEventListener('change', handleChange)
      return () => {
        element.removeEventListener('change', handleChange)
      }
    }
  }, [name, value, onChange])

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
}

// RadioGroupItem for backward compatibility
export function PolarisRadioGroupItem({
  value,
  id,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
  value: string
  id?: string
}) {
  return (
    <PolarisRadio
      value={value}
      id={id || value}
      className={className}
      {...props}
    >
      {children}
    </PolarisRadio>
  )
}
