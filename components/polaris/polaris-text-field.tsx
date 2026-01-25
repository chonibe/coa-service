'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisTextFieldProps } from './types'

/**
 * React wrapper for Polaris p-text-field web component
 */
export function PolarisTextField({
  label,
  labelHidden,
  helpText,
  error,
  requiredIndicator,
  disabled,
  readonly,
  placeholder,
  value,
  type = 'text',
  multiline,
  rows,
  maxLength,
  showCharacterCount,
  clearButton,
  onChange,
  onInput,
  onFocus,
  onBlur,
  className,
  style,
  ...props
}: PolarisTextFieldProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Set attributes
    if (label) element.setAttribute('label', label)
    if (labelHidden) element.setAttribute('label-hidden', '')
    if (helpText) element.setAttribute('help-text', helpText)
    if (error) {
      element.setAttribute('error', typeof error === 'string' ? error : '')
    }
    if (requiredIndicator) element.setAttribute('required-indicator', '')
    if (disabled) element.setAttribute('disabled', '')
    if (readonly) element.setAttribute('readonly', '')
    if (placeholder) element.setAttribute('placeholder', placeholder)
    if (value !== undefined) element.setAttribute('value', String(value))
    if (type) element.setAttribute('type', type)
    if (multiline !== undefined) {
      element.setAttribute('multiline', multiline === true ? '' : String(multiline))
    }
    if (rows) element.setAttribute('rows', String(rows))
    if (maxLength) element.setAttribute('max-length', String(maxLength))
    if (showCharacterCount) element.setAttribute('show-character-count', '')
    if (clearButton) element.setAttribute('clear-button', '')
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle events
    if (onChange) {
      element.addEventListener('change', onChange as EventListener)
    }
    if (onInput) {
      element.addEventListener('input', onInput as EventListener)
    }
    if (onFocus) {
      element.addEventListener('focus', onFocus as EventListener)
    }
    if (onBlur) {
      element.addEventListener('blur', onBlur as EventListener)
    }

    return () => {
      if (onChange) element.removeEventListener('change', onChange as EventListener)
      if (onInput) element.removeEventListener('input', onInput as EventListener)
      if (onFocus) element.removeEventListener('focus', onFocus as EventListener)
      if (onBlur) element.removeEventListener('blur', onBlur as EventListener)
    }
  }, [
    label,
    labelHidden,
    helpText,
    error,
    requiredIndicator,
    disabled,
    readonly,
    placeholder,
    value,
    type,
    multiline,
    rows,
    maxLength,
    showCharacterCount,
    clearButton,
    onChange,
    onInput,
    onFocus,
    onBlur,
    className,
    style,
  ])

  return React.createElement('p-text-field', { ref, ...props })
}

// Alias for backward compatibility with Input
export const PolarisInput = PolarisTextField
