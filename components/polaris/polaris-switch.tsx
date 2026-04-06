'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PolarisSwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  checked?: boolean
  helpText?: string
  onChange?: (checked: boolean) => void
  onCheckedChange?: (checked: boolean) => void
}

export const PolarisSwitch = React.forwardRef<HTMLInputElement, PolarisSwitchProps>(
  function PolarisSwitch(
    {
      label,
      checked,
      disabled,
      id: idProp,
      name,
      helpText,
      onChange,
      onCheckedChange,
      className,
      children,
      ...props
    },
    ref
  ) {
    const generatedId = React.useId()
    const id = idProp ?? generatedId
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.checked
      onChange?.(next)
      onCheckedChange?.(next)
    }

    return (
      <div className={cn('space-y-1.5', className)}>
        {/* Input must be a previous sibling of the label for Tailwind `peer-checked:` (reliable vs `has-[:checked]` in some builds). */}
        <div className={cn('inline-flex items-center gap-3', disabled && 'opacity-50')}>
          <input
            ref={ref}
            type="checkbox"
            id={id}
            name={name}
            role="switch"
            aria-checked={checked ?? false}
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className={cn(
              'peer sr-only',
              'focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--p-color-bg-surface)]'
            )}
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              'flex cursor-pointer items-center gap-3 text-sm text-[var(--p-color-text)]',
              'peer-disabled:cursor-not-allowed',
              'peer-focus-visible:[&_.switch-track]:ring-2 peer-focus-visible:[&_.switch-track]:ring-[hsl(var(--ring))] peer-focus-visible:[&_.switch-track]:ring-offset-2 peer-focus-visible:[&_.switch-track]:ring-offset-[var(--p-color-bg-surface)]',
              'peer-checked:[&_.switch-track]:border-primary peer-checked:[&_.switch-track]:bg-primary',
              'peer-checked:[&_.switch-thumb]:translate-x-6'
            )}
          >
            <span
              className={cn(
                'switch-track relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-[var(--p-color-border)] bg-[var(--p-color-bg-surface-secondary)] transition-colors duration-200'
              )}
            >
              <span
                className={cn(
                  'switch-thumb pointer-events-none absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200'
                )}
              />
            </span>
            <span className="min-w-0">{children ?? label}</span>
          </label>
        </div>
        {helpText && (
          <p className="pl-[3.25rem] text-sm text-[var(--p-color-text-secondary)]">{helpText}</p>
        )}
      </div>
    )
  }
)
