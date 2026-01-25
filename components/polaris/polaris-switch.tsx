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
    const id = idProp ?? React.useId()
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.checked
      onChange?.(next)
      onCheckedChange?.(next)
    }

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={id}
          className={cn(
            'flex items-center gap-3 cursor-pointer text-sm text-[var(--p-color-text)]',
            'has-[:checked]:[&_.switch-track]:bg-[hsl(var(--primary))] has-[:checked]:[&_.switch-track]:border-[hsl(var(--primary))]',
            'has-[:focus-visible]:[&_.switch-track]:ring-2 has-[:focus-visible]:[&_.switch-track]:ring-[hsl(var(--ring))] has-[:focus-visible]:[&_.switch-track]:ring-offset-2',
            'has-[:checked]:[&_.switch-thumb]:translate-x-4',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            ref={ref}
            type="checkbox"
            id={id}
            name={name}
            role="switch"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="sr-only"
            {...props}
          />
          <span
            className={cn(
              'switch-track relative inline-flex h-5 w-9 shrink-0 rounded-full border border-[var(--p-color-border)] bg-[var(--p-color-bg-surface-secondary)] transition-colors'
            )}
          >
            <span
              className={cn(
                'switch-thumb pointer-events-none absolute left-0.5 top-0.5 block h-4 w-3 rounded-full bg-white shadow transition-transform'
              )}
            />
          </span>
          <span>{children ?? label}</span>
        </label>
        {helpText && (
          <p className="text-sm text-[var(--p-color-text-secondary)] pl-12">{helpText}</p>
        )}
      </div>
    )
  }
)
