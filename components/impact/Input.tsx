'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Impact Theme Input
 * 
 * Matches the exact styling from the Shopify Impact theme:
 * - Border radius: 8px (input_border_radius)
 * - Height: 42px mobile, 50px desktop
 * - Padding: 16px horizontal
 */

const inputVariants = cva(
  [
    'flex w-full',
    'font-body text-base text-[#1a1a1a]',
    'bg-white',
    'border border-[#1a1a1a]/12',
    'rounded-[8px]', // Impact theme input border radius
    'transition-all duration-200 ease-in-out',
    'placeholder:text-[#1a1a1a]/50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c4bce] focus-visible:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f5f5f5]',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
  ].join(' '),
  {
    variants: {
      inputSize: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-[2.625rem] px-4 text-base sm:h-[3.125rem] sm:px-5', // 42px mobile, 50px desktop
        lg: 'h-14 px-5 text-lg',
      },
      variant: {
        default: '',
        error: 'border-[#f83a3a] focus-visible:ring-[#f83a3a]',
        success: 'border-[#00a341] focus-visible:ring-[#00a341]',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      inputSize: 'md',
      variant: 'default',
      fullWidth: true,
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      inputSize,
      variant,
      fullWidth,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId()
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    
    // If there's an error, override the variant
    const computedVariant = error ? 'error' : variant
    
    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#1a1a1a]"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/50">
              {leftIcon}
            </span>
          )}
          
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ inputSize, variant: computedVariant, fullWidth }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/50">
              {rightIcon}
            </span>
          )}
        </div>
        
        {error && (
          <p id={errorId} className="text-sm text-[#f83a3a]">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={hintId} className="text-sm text-[#1a1a1a]/60">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

/**
 * Textarea component matching Impact theme styling
 */
const textareaVariants = cva(
  [
    'flex w-full min-h-[120px]',
    'font-body text-base text-[#1a1a1a]',
    'bg-white',
    'border border-[#1a1a1a]/12',
    'rounded-[8px]',
    'px-4 py-3',
    'transition-all duration-200 ease-in-out',
    'placeholder:text-[#1a1a1a]/50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c4bce] focus-visible:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f5f5f5]',
    'resize-y',
  ].join(' '),
  {
    variants: {
      variant: {
        default: '',
        error: 'border-[#f83a3a] focus-visible:ring-[#f83a3a]',
        success: 'border-[#00a341] focus-visible:ring-[#00a341]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || React.useId()
    const errorId = `${textareaId}-error`
    const hintId = `${textareaId}-hint`
    
    const computedVariant = error ? 'error' : variant
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[#1a1a1a]"
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          className={cn(textareaVariants({ variant: computedVariant }), className)}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="text-sm text-[#f83a3a]">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={hintId} className="text-sm text-[#1a1a1a]/60">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

/**
 * Select component matching Impact theme styling
 */
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || React.useId()
    const errorId = `${selectId}-error`
    const hintId = `${selectId}-hint`
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[#1a1a1a]"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              'flex w-full appearance-none',
              'font-body text-base text-[#1a1a1a]',
              'bg-white',
              'border border-[#1a1a1a]/12',
              'rounded-[8px]',
              'h-[2.625rem] px-4 pr-10 sm:h-[3.125rem]',
              'transition-all duration-200 ease-in-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c4bce] focus-visible:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f5f5f5]',
              error && 'border-[#f83a3a] focus-visible:ring-[#f83a3a]',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Dropdown arrow */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#1a1a1a]/50">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        
        {error && (
          <p id={errorId} className="text-sm text-[#f83a3a]">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={hintId} className="text-sm text-[#1a1a1a]/60">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Input, Textarea, Select, inputVariants, textareaVariants }
