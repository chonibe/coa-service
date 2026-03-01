import { cva } from 'class-variance-authority'

/**
 * Impact Theme Button Variants
 *
 * Shared class name generator for button styles. Exported without 'use client'
 * so it can be called from Server Components (e.g. for styling <a> elements).
 *
 * Matches the exact styling from the Shopify Impact theme:
 * - Primary: #2c4bce background, white text, 60px border radius
 * - Secondary: #f0c417 background, #1a1a1a text
 * - Button hover effect: fade to 85% opacity
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-body font-semibold',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[#2c4bce] text-white',
          'rounded-[60px]',
          'hover:opacity-[0.85]',
          'focus-visible:ring-[#2c4bce]',
          'shadow-impact-sm hover:shadow-impact-md',
        ].join(' '),
        secondary: [
          'bg-[#f0c417] text-[#1a1a1a]',
          'rounded-[60px]',
          'hover:opacity-[0.85]',
          'focus-visible:ring-[#f0c417]',
          'shadow-impact-sm hover:shadow-impact-md',
        ].join(' '),
        outline: [
          'bg-transparent text-[#1a1a1a]',
          'rounded-[60px]',
          'border-2 border-current',
          'hover:bg-[#1a1a1a] hover:text-white',
          'focus-visible:ring-[#1a1a1a]',
        ].join(' '),
        'outline-primary': [
          'bg-transparent text-[#2c4bce]',
          'rounded-[60px]',
          'border-2 border-[#2c4bce]',
          'hover:bg-[#2c4bce] hover:text-white',
          'focus-visible:ring-[#2c4bce]',
        ].join(' '),
        ghost: [
          'bg-transparent text-[#1a1a1a]',
          'rounded-[60px]',
          'hover:bg-[#1a1a1a]/5',
          'focus-visible:ring-[#1a1a1a]',
        ].join(' '),
        link: [
          'bg-transparent text-[#2c4bce]',
          'underline-offset-4',
          'hover:underline',
          'focus-visible:ring-[#2c4bce]',
        ].join(' '),
        subdued: [
          'bg-[#1a1a1a]/5 text-[#1a1a1a]',
          'rounded-[60px]',
          'hover:bg-[#1a1a1a]/10',
          'focus-visible:ring-[#1a1a1a]',
        ].join(' '),
        header: [
          'bg-transparent text-[#ffba94]',
          'rounded-[60px]',
          'border-2 border-[#ffba94]',
          'hover:bg-[#ffba94] hover:text-[#390000]',
          'focus-visible:ring-[#ffba94]',
        ].join(' '),
        success: [
          'bg-[#00a341] text-white',
          'rounded-[60px]',
          'hover:opacity-[0.85]',
          'focus-visible:ring-[#00a341]',
          'shadow-impact-sm hover:shadow-impact-md',
        ].join(' '),
        destructive: [
          'bg-[#f83a3a] text-white',
          'rounded-[60px]',
          'hover:opacity-[0.85]',
          'focus-visible:ring-[#f83a3a]',
          'shadow-impact-sm hover:shadow-impact-md',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        xl: 'h-16 px-10 text-xl',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)
