'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Breadcrumb Component
 * 
 * Navigation breadcrumbs for hierarchical page navigation.
 * Follows Impact theme styling with simple, clean design.
 */

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center gap-2 text-sm', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="text-[#1a1a1a]/30"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
            
            {isLast || !item.href ? (
              <span className="text-[#1a1a1a]/60 font-medium">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-[#1a1a1a]/60 hover:text-[#2c4bce] transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

/**
 * Helper to generate breadcrumbs from pathname
 */
export function generateBreadcrumbs(pathname: string, customLabels?: Record<string, string>): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/shop' }
  ]
  
  let currentPath = ''
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`
    
    // Check for custom label
    const label = customLabels?.[segment] || 
      segment
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
    
    // Don't add href to last item (current page)
    const isLast = i === segments.length - 1
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath
    })
  }
  
  return breadcrumbs
}

export default Breadcrumb
