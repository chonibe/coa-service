'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PolarisRadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  checked?: boolean
  helpText?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const PolarisRadio = React.forwardRef<HTMLInputElement, PolarisRadioProps>(
  function PolarisRadio(
    { label, checked, disabled, id: idProp, name, value, helpText, onChange, className, children, ...props },
    ref
  ) {
    const id = idProp ?? React.useId()

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
            type="radio"
            id={id}
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className={cn(
              'h-4 w-4 rounded-full border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] text-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-0',
              className
            )}
            {...props}
          />
          <span>{children ?? label}</span>
        </label>
        {helpText && (
          <p className="text-sm text-[var(--p-color-text-secondary)] pl-7">{helpText}</p>
        )}
      </div>
    )
  }
)

export interface PolarisRadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  value?: string
  onValueChange?: (value: string) => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function PolarisRadioGroup({
  name,
  value,
  onValueChange,
  onChange,
  children,
  className,
  ...props
}: PolarisRadioGroupProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    onValueChange?.(e.target.value)
  }

  return (
    <div
      role="radiogroup"
      className={cn('space-y-2', className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && typeof child.type !== 'string') {
          const c = child as React.ReactElement<{ name?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }>
          return React.cloneElement(c, {
            name: c.props.name ?? name,
            checked: value !== undefined ? c.props.value === value : c.props.checked,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              c.props.onChange?.(e)
              handleChange(e)
            },
          })
        }
        return child
      })}
    </div>
  )
}

export function PolarisRadioGroupItem({
  value,
  id,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLInputElement> & { value: string; id?: string }) {
  return (
    <PolarisRadio value={value} id={id ?? value} className={className} {...props}>
      {children}
    </PolarisRadio>
  )
}
