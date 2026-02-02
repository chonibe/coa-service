'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Impact Theme Card
 * 
 * Matches the exact styling from the Shopify Impact theme:
 * - Border radius: 24px (block_border_radius)
 * - Box shadow: 0 18px 30px rgba(26, 26, 26, 0.1)
 */

const cardVariants = cva(
  [
    'relative',
    'bg-white',
    'overflow-hidden',
    'transition-all duration-200 ease-in-out',
  ].join(' '),
  {
    variants: {
      variant: {
        // Default card with shadow
        default: [
          'rounded-[24px]', // Impact theme block border radius
          'shadow-impact-block', // 0 18px 30px rgba(26, 26, 26, 0.1)
        ].join(' '),
        
        // Elevated card with larger shadow
        elevated: [
          'rounded-[24px]',
          'shadow-impact-lg',
          'hover:shadow-impact-block hover:-translate-y-1',
        ].join(' '),
        
        // Flat card without shadow
        flat: [
          'rounded-[24px]',
          'border border-[#1a1a1a]/12',
        ].join(' '),
        
        // Outlined card
        outline: [
          'rounded-[24px]',
          'border-2 border-[#1a1a1a]/12',
          'hover:border-[#1a1a1a]/24',
        ].join(' '),
        
        // Ghost card (minimal)
        ghost: [
          'rounded-[24px]',
          'bg-transparent',
        ].join(' '),
        
        // Interactive card (clickable)
        interactive: [
          'rounded-[24px]',
          'shadow-impact-sm',
          'hover:shadow-impact-block hover:-translate-y-1',
          'cursor-pointer',
        ].join(' '),
        
        // Product card
        product: [
          'rounded-[24px]',
          'bg-transparent',
          'group',
        ].join(' '),
        
        // Featured card with accent border
        featured: [
          'rounded-[24px]',
          'shadow-impact-block',
          'border-2 border-[#2c4bce]',
        ].join(' '),
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: 'div' | 'article' | 'section'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Card.displayName = 'Card'

/**
 * Card Header component
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4', className)}
        {...props}
      >
        {(title || subtitle || children) && (
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-[#1a1a1a]/60">
                {subtitle}
              </p>
            )}
            {children}
          </div>
        )}
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    )
  }
)
CardHeader.displayName = 'CardHeader'

/**
 * Card Content component
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
CardContent.displayName = 'CardContent'

/**
 * Card Footer component
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-3 pt-4 mt-auto', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

/**
 * Card Image component - for media at top of card
 */
export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto'
  overlay?: boolean
}

const CardImage = React.forwardRef<HTMLDivElement, CardImageProps>(
  ({ className, aspectRatio = 'auto', overlay, src, alt, ...props }, ref) => {
    const aspectClasses = {
      square: 'aspect-square',
      video: 'aspect-video',
      portrait: 'aspect-[3/4]',
      auto: '',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden -mx-6 -mt-6 mb-6 first:-mt-6',
          aspectClasses[aspectRatio],
          className
        )}
      >
        <img
          src={src}
          alt={alt || ''}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          {...props}
        />
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
      </div>
    )
  }
)
CardImage.displayName = 'CardImage'

/**
 * Product Card - specialized card for product listings
 * 
 * Features:
 * - Hover image swap (shows secondImage on hover)
 * - Quick Add to Cart button on hover
 * - Transparent background option
 * - Vendor link
 */
export interface ProductCardProps {
  title: string
  price: string
  compareAtPrice?: string
  image: string
  secondImage?: string
  imageAlt?: string
  href: string
  badges?: React.ReactNode
  vendor?: string
  vendorHref?: string
  className?: string
  onClick?: () => void
  onQuickAdd?: () => void
  showQuickAdd?: boolean
  transparentBackground?: boolean
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      title,
      price,
      compareAtPrice,
      image,
      secondImage,
      imageAlt,
      href,
      badges,
      vendor,
      vendorHref,
      className,
      onClick,
      onQuickAdd,
      showQuickAdd = true,
      transparentBackground = true,
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)
    
    const handleQuickAdd = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onQuickAdd?.()
    }
    
    return (
      <Card
        ref={ref}
        variant="product"
        padding="none"
        className={cn('group', className)}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a href={href} className="block">
          {/* Image Container */}
          <div className={cn(
            'relative aspect-square overflow-hidden rounded-[24px]',
            transparentBackground ? 'bg-transparent' : 'bg-[#f5f5f5]'
          )}>
            {/* Primary Image */}
            <img
              src={image}
              alt={imageAlt || title}
              className={cn(
                'w-full h-full object-contain transition-all duration-300',
                secondImage && isHovered ? 'opacity-0' : 'opacity-100',
                'group-hover:scale-105'
              )}
            />
            
            {/* Secondary Image (shown on hover) */}
            {secondImage && (
              <img
                src={secondImage}
                alt={`${imageAlt || title} - alternate view`}
                className={cn(
                  'absolute inset-0 w-full h-full object-contain transition-all duration-300',
                  isHovered ? 'opacity-100 scale-105' : 'opacity-0'
                )}
              />
            )}
            
            {/* Badges */}
            {badges && (
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                {badges}
              </div>
            )}
            
            {/* Quick Add Button */}
            {showQuickAdd && onQuickAdd && (
              <div className={cn(
                'absolute bottom-3 left-3 right-3 transition-all duration-300',
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              )}>
                <button
                  onClick={handleQuickAdd}
                  className={cn(
                    'w-full py-3 px-4',
                    'bg-[#f0c417] text-[#1a1a1a]',
                    'font-semibold text-sm',
                    'rounded-full',
                    'hover:bg-[#e0b415] transition-colors',
                    'shadow-lg'
                  )}
                >
                  Add to cart
                </button>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="mt-4 text-center">
            {vendor && (
              vendorHref ? (
                <a 
                  href={vendorHref}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-[#1a1a1a]/60 uppercase tracking-wider mb-1 hover:text-[#1a1a1a] transition-colors inline-block"
                >
                  {vendor}
                </a>
              ) : (
                <p className="text-xs text-[#1a1a1a]/60 uppercase tracking-wider mb-1">
                  {vendor}
                </p>
              )
            )}
            <h3 className="font-heading text-lg font-medium text-[#1a1a1a] tracking-[-0.02em] line-clamp-2">
              {title}
            </h3>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={cn(
                'text-base font-semibold',
                compareAtPrice ? 'text-[#f83a3a]' : 'text-[#1a1a1a]'
              )}>
                {price}
              </span>
              {compareAtPrice && (
                <span className="text-sm text-[#1a1a1a]/50 line-through">
                  {compareAtPrice}
                </span>
              )}
            </div>
          </div>
        </a>
      </Card>
    )
  }
)
ProductCard.displayName = 'ProductCard'

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardImage,
  ProductCard,
  cardVariants,
}
