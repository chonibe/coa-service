"use client"

/**
 * Safe Icon Component
 * 
 * Wrapper for lucide-react icons with error handling.
 * Prevents icon import failures from crashing the application.
 * Falls back to a default icon if the requested icon fails to load.
 */

import React from 'react'
import { Circle, AlertCircle, LucideProps } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

type SafeIconProps = LucideProps & {
  name: string
  fallbackIcon?: keyof typeof LucideIcons
}

/**
 * SafeIcon component that handles icon loading errors
 */
export function SafeIcon({ 
  name, 
  fallbackIcon = 'Circle',
  ...props 
}: SafeIconProps) {
  try {
    // Try to get the icon from lucide-react
    const IconComponent = (LucideIcons as any)[name]
    
    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in lucide-react, using fallback`)
      const FallbackIcon = (LucideIcons as any)[fallbackIcon] || Circle
      return <FallbackIcon {...props} />
    }

    return <IconComponent {...props} />
  } catch (error) {
    console.error(`Error rendering icon "${name}":`, error)
    const FallbackIcon = (LucideIcons as any)[fallbackIcon] || Circle
    return <FallbackIcon {...props} />
  }
}

/**
 * Hook to safely get an icon component
 */
export function useSafeIcon(
  name: string, 
  fallbackIcon: keyof typeof LucideIcons = 'Circle'
): React.ComponentType<LucideProps> {
  try {
    const IconComponent = (LucideIcons as any)[name]
    
    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in lucide-react, using fallback`)
      return (LucideIcons as any)[fallbackIcon] || Circle
    }

    return IconComponent
  } catch (error) {
    console.error(`Error loading icon "${name}":`, error)
    return (LucideIcons as any)[fallbackIcon] || Circle
  }
}

/**
 * Validate if an icon exists in lucide-react
 */
export function iconExists(name: string): boolean {
  return name in LucideIcons
}

/**
 * Get icon component safely with null return on failure
 */
export function getIconComponent(name: string): React.ComponentType<LucideProps> | null {
  try {
    const IconComponent = (LucideIcons as any)[name]
    return IconComponent || null
  } catch {
    return null
  }
}
