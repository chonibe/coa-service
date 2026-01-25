'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const variantMap = {
  default: 'primary',
  outline: 'secondary',
  ghost: 'tertiary',
  link: 'plain',
  destructive: 'destructive',
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  plain: 'plain',
} as const

const sizeMap = {
  xs: 'xs',
  sm: 'sm',
  default: 'medium',
  lg: 'lg',
  slim: 'slim',
  medium: 'medium',
  large: 'large',
  icon: 'icon',
} as const

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--p-border-radius-200)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90',
        secondary:
          'border border-[hsl(var(--input))] bg-[hsl(var(--background))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
        tertiary:
          'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
        plain: 'text-[hsl(var(--primary))] hover:underline underline-offset-4',
        destructive:
          'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90',
      },
      size: {
        xs: 'h-7 rounded-[var(--p-border-radius-100)] px-2 text-xs',
        sm: 'h-9 rounded-[var(--p-border-radius-200)] px-3',
        slim: 'h-8 rounded-[var(--p-border-radius-200)] px-3',
        medium: 'h-10 px-4 py-2',
        large: 'h-11 rounded-[var(--p-border-radius-200)] px-6',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium',
    },
  }
)

export type ButtonVariantsProps = VariantProps<typeof buttonVariants>

export interface PolarisButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>,
    VariantProps<typeof buttonVariants> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'plain'
    | 'destructive'
    | 'default'
    | 'outline'
    | 'ghost'
    | 'link'
  size?: 'slim' | 'medium' | 'large' | 'sm' | 'lg' | 'xs' | 'default' | 'icon'
  fullWidth?: boolean
  loading?: boolean
  submit?: boolean
  url?: string
  href?: string
  external?: boolean
  download?: boolean | string
  asChild?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export function PolarisButton({
  variant = 'primary',
  size = 'medium',
  fullWidth,
  disabled,
  loading,
  submit,
  url,
  href,
  external,
  download,
  asChild,
  onClick,
  children,
  className,
  style,
  type,
  ...props
}: PolarisButtonProps) {
  const resolvedVariant = variantMap[variant as keyof typeof variantMap] ?? 'primary'
  const resolvedSize = sizeMap[size as keyof typeof sizeMap] ?? 'medium'

  const isLink = Boolean(href ?? url) && !asChild
  const Comp = asChild ? Slot : isLink ? 'a' : 'button'

  const linkProps = isLink
    ? {
        href: href ?? url,
        target: external ? '_blank' : undefined,
        rel: external ? 'noopener noreferrer' : undefined,
        download: download !== undefined ? (download === true ? undefined : String(download)) : undefined,
      }
    : {}

  const buttonProps = !isLink && !asChild
    ? {
        type: submit ? 'submit' : type ?? 'button',
        disabled: disabled ?? loading,
      }
    : {}

  const content = loading ? (
    <>
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      {children}
    </>
  ) : (
    children
  )

  return (
    <Comp
      className={cn(
        buttonVariants({ variant: resolvedVariant, size: resolvedSize }),
        fullWidth && 'w-full',
        className
      )}
      style={style}
      onClick={onClick}
      {...linkProps}
      {...buttonProps}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { buttonVariants }
