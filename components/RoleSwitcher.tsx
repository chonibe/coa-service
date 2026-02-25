"use client"

/**
 * RoleSwitcher Component
 * 
 * Dropdown that shows available roles for multi-role users and allows
 * switching between dashboards. Sets the `active_role` cookie on selection
 * and redirects to the appropriate dashboard.
 * 
 * Only renders when the user has 2+ roles.
 * 
 * @module components/RoleSwitcher
 * @see app/api/auth/roles/route.ts - API endpoint for fetching roles
 * @see lib/rbac/session.ts - getDashboardForRole
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// ============================================
// Types
// ============================================

interface RoleDetail {
  role: string
  label: string
  dashboard: string
  isActive: boolean
}

interface RolesResponse {
  roles: string[]
  activeRole: string | null
  email: string
  roleDetails: RoleDetail[]
}

interface RoleSwitcherProps {
  /** Visual variant: 'compact' for sidebar, 'full' for header bars */
  variant?: 'compact' | 'full'
  /** Additional CSS classes */
  className?: string
}

// ============================================
// Role Icons & Colors
// ============================================

const ROLE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  admin: {
    icon: '🛡️',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  vendor: {
    icon: '🎨',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  collector: {
    icon: '🖼️',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
}

// ============================================
// Component
// ============================================

export function RoleSwitcher({ variant = 'compact', className }: RoleSwitcherProps) {
  const router = useRouter()
  const [roleDetails, setRoleDetails] = useState<RoleDetail[]>([])
  const [activeRole, setActiveRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)

  // Fetch available roles on mount
  useEffect(() => {
    let cancelled = false

    async function fetchRoles() {
      try {
        const res = await fetch('/api/auth/roles', { credentials: 'include' })
        if (!res.ok) {
          setIsLoading(false)
          return
        }

        const data: RolesResponse = await res.json()
        if (!cancelled) {
          setRoleDetails(data.roleDetails)
          setActiveRole(data.activeRole)
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchRoles()
    return () => { cancelled = true }
  }, [])

  // Handle role switch
  const handleSwitch = useCallback(async (role: RoleDetail) => {
    if (role.isActive || isSwitching) return

    setIsSwitching(true)

    // Set active_role cookie (client-side, httpOnly: false)
    document.cookie = `active_role=${role.role}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`

    setActiveRole(role.role)

    // Redirect to the target dashboard
    router.push(role.dashboard)
  }, [isSwitching, router])

  // Don't render if user has fewer than 2 roles or still loading
  if (isLoading || roleDetails.length < 2) {
    return null
  }

  const currentRole = roleDetails.find(r => r.role === activeRole)
  const currentConfig = currentRole ? ROLE_CONFIG[currentRole.role] : ROLE_CONFIG['vendor']

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              currentConfig?.bgColor,
              currentConfig?.color,
              className
            )}
            disabled={isSwitching}
          >
            <span className="text-base">{currentConfig?.icon}</span>
            <span className="truncate">{currentRole?.label}</span>
            <svg className="h-4 w-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Switch Dashboard
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {roleDetails.map((role) => {
            const config = ROLE_CONFIG[role.role]
            return (
              <DropdownMenuItem
                key={role.role}
                onClick={() => handleSwitch(role)}
                disabled={isSwitching}
                className={cn(
                  "flex items-center gap-3 cursor-pointer",
                  role.isActive && "bg-accent"
                )}
              >
                <span className="text-base">{config?.icon}</span>
                <div className="flex flex-col">
                  <span className={cn("font-medium", config?.color)}>
                    {role.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {role.dashboard}
                  </span>
                </div>
                {role.isActive && (
                  <span className="ml-auto text-xs text-muted-foreground">Current</span>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Full variant for header bars
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "border-border/50",
            className
          )}
          disabled={isSwitching}
        >
          <span>{currentConfig?.icon}</span>
          <span>{currentRole?.label} Dashboard</span>
          <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Dashboard
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roleDetails.map((role) => {
          const config = ROLE_CONFIG[role.role]
          return (
            <DropdownMenuItem
              key={role.role}
              onClick={() => handleSwitch(role)}
              disabled={isSwitching}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                role.isActive && "bg-accent"
              )}
            >
              <span className="text-base">{config?.icon}</span>
              <div className="flex flex-col flex-1">
                <span className={cn("font-medium", config?.color)}>
                  {role.label} Dashboard
                </span>
              </div>
              {role.isActive && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default RoleSwitcher
