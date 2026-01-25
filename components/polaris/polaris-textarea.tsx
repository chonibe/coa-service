'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisTextareaProps } from './types'

/**
 * React wrapper for Polaris p-textarea web component
 */
export function PolarisTextarea({
  label,
  labelHidden,
  helpText,
  error,
  requiredIndicator,
  disabled,
  readonly,
  placeholder,
  value,
  rows,
  maxLength,
  showCharacterCount,
  onChange,
  onInput,
  onFocus,
  onBlur,
  className,
  style,
  ...props
}: PolarisTextareaProps) {
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
    if (readonly) element.setAttribute('readonly', '')
    if (placeholder) element.setAttribute('placeholder', placeholder)
    if (value !== undefined) element.setAttribute('value', String(value))
    if (rows) element.setAttribute('rows', String(rows))
    if (maxLength) element.setAttribute('max-length', String(maxLength))
    if (showCharacterCount) element.setAttribute('show-character-count', '')
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
    rows,
    maxLength,
    showCharacterCount,
    onChange,
    onInput,
    onFocus,
    onBlur,
    className,
    style,
  ])

  return React.createElement('p-textarea', { ref, ...props })
}
