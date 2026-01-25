'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PolarisCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  checked?: boolean
  error?: string | boolean
  helpText?: string
  onChange?: (checked: boolean) => void
  onCheckedChange?: (checked: boolean) => void
}

export const PolarisCheckbox = React.forwardRef<HTMLInputElement, PolarisCheckboxProps>(
  function PolarisCheckbox(
    {
      label,
      checked,
      disabled,
      error,
      helpText,
      id: idProp,
      name,
      value,
      onChange,
      onCheckedChange,
      className,
      children,
      ...props
    },
    ref
  ) {
    const id = idProp ?? React.useId()
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.checked
      onChange?.(next)
      onCheckedChange?.(next)
    }
    const hasError = Boolean(error)

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={id}
          className={cn(
            'flex items-center gap-3 cursor-pointer text-sm text-[var(--p-color-text)]',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            ref={ref}
            type="checkbox"
            id={id}
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className={cn(
              'h-4 w-4 rounded-[var(--p-border-radius-100)] border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] text-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-0',
              hasError && 'border-red-500',
              className
            )}
            {...props}
          />
          <span>{children ?? label}</span>
        </label>
        {helpText && !hasError && (
          <p className="text-sm text-[var(--p-color-text-secondary)] pl-7">{helpText}</p>
        )}
        {typeof error === 'string' && (
          <p className="text-sm text-red-600 dark:text-red-400 pl-7" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
