"use client"

import * as React from "react"
import { useTheme } from "next-themes"

interface LogoProps {
  className?: string
  alt?: string
  height?: number
  width?: number
  lightLogoUrl?: string
  darkLogoUrl?: string
}

export function Logo({ 
  className = "h-8 w-auto object-contain",
  alt = "Street Lamp Logo",
  height,
  width,
  lightLogoUrl,
  darkLogoUrl
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Default logo URLs
  // Dark logo: white/light text logo for dark mode
  const defaultDarkLogo = "https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Logo_a395ed7f-3980-4407-80d0-70c343848544.png?v=1764246238"
  // Light logo: black text logo for light mode
  const defaultLightLogo = "https://cdn.shopify.com/s/files/1/0659/7925/2963/files/LOGO_New_Black_19113602-ced0-4687-9162-435cf4e311d6.png?v=1764246239"

  // Determine which theme is active
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark")
  const logoUrl = isDark ? (darkLogoUrl || defaultDarkLogo) : (lightLogoUrl || defaultLightLogo)

  // Show a placeholder while mounting to avoid hydration issues
  if (!mounted) {
    return (
      <img 
        src={defaultDarkLogo}
        alt={alt}
        className={className}
        style={{ opacity: 0 }}
        aria-hidden="true"
      />
    )
  }

  return (
    <img 
      src={logoUrl}
      alt={alt}
      className={className}
      height={height}
      width={width}
      onError={(e) => {
        // Fallback to dark logo if light logo fails to load
        if (logoUrl !== defaultDarkLogo) {
          e.currentTarget.src = defaultDarkLogo
        }
      }}
    />
  )
}

