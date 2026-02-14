"use client"

/**
 * CollectorRoleSwitcherWrapper
 * 
 * Renders the RoleSwitcher in a fixed position for the collector dashboard.
 * Only visible when the user has multiple roles (e.g., vendor + collector).
 * 
 * @see components/RoleSwitcher.tsx
 */

import { RoleSwitcher } from "@/components/RoleSwitcher"

export function CollectorRoleSwitcherWrapper() {
  return (
    <div className="fixed top-3 right-3 z-40">
      <RoleSwitcher variant="full" />
    </div>
  )
}
