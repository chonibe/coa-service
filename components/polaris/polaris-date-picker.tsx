'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const inputBase =
  'flex h-10 w-full rounded-[var(--p-border-radius-200)] border border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] px-3 py-2 text-sm text-[var(--p-color-text)] placeholder:text-[var(--p-color-text-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50'

export interface PolarisDatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string
  labelHidden?: boolean
  helpText?: string
  error?: string | boolean
  requiredIndicator?: boolean
  value?: string
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
  id: idProp,
  ...props
}: PolarisDatePickerProps) {
  const id = idProp ?? React.useId()
  const errorMessage = typeof error === 'string' ? error : undefined
  const hasError = Boolean(error)

  return (
    <div className="space-y-1.5">
      {label && !labelHidden && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[var(--p-color-text)]"
        >
          {label}
          {requiredIndicator && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      <input
        type="date"
        id={id}
        value={value ?? ''}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          inputBase,
          hasError && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {helpText && !hasError && (
        <p className="text-sm text-[var(--p-color-text-secondary)]">{helpText}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
