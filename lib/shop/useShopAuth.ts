'use client'

/**
 * Shop Authentication Hook with RBAC Integration
 * 
 * Provides authentication state, roles, permissions, and membership status
 * for the shop/storefront experience.
 * 
 * @module lib/shop/useShopAuth
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Role, Permission } from '@/lib/rbac'
import type { MembershipTierId } from '@/lib/membership/tiers'

const AUTH_THROTTLE_MS = 5000
const AUTH_429_RETRY_AFTER_MS = 3000

export interface ShopUser {
  id: string
  email: string
  collectorIdentifier: string
  firstName?: string
  lastName?: string
  phone?: string
  avatarUrl?: string
  
  // RBAC integration
  roles: Role[]
  permissions: Permission[]
  isCollector: boolean
  isVendor: boolean
  isAdmin: boolean
  
  // Membership-specific
  isMember: boolean
  membershipTier?: MembershipTierId
  membershipStatus?: 'active' | 'cancelled' | 'past_due' | 'trialing' | null
  membershipCurrentPeriodEnd?: string
  creditBalance: number
  creditBalanceValue: number // USD value of credits
  /** True when using dev mock login */
  isMockUser?: boolean
}

interface UseShopAuthReturn {
  user: ShopUser | null
  loading: boolean
  isAuthenticated: boolean
  hasPermission: (permission: Permission) => boolean
  hasRole: (role: Role) => boolean
  canUseCredits: () => boolean
  refreshUser: () => Promise<void>
}

export function useShopAuth(): UseShopAuthReturn {
  const [user, setUser] = useState<ShopUser | null>(null)
  const [loading, setLoading] = useState(true)
  // Memoize so the client reference is stable across renders, preventing
  // checkAuth / onAuthStateChange from being recreated on every render.
  const supabase = useMemo(() => createClient(), [])
  const lastCheckRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkAuth = useCallback(async (isRetryAfter429 = false) => {
    if (!supabase) {
      setUser(null)
      setLoading(false)
      return
    }

    const now = Date.now()
    if (!isRetryAfter429 && now - lastCheckRef.current < AUTH_THROTTLE_MS) {
      return
    }
    lastCheckRef.current = now

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }

      // Extract RBAC info from JWT claims (app_metadata)
      const claims = session.user.app_metadata || {}
      const roles = (claims.user_roles || []) as Role[]
      const permissions = (claims.user_permissions || []) as Permission[]
      const isCollector = roles.includes('collector')

      // Fetch PII from collector_profiles, membership status, and credit balance in parallel
      let membershipData = null
      let creditBalance = 0
      let creditBalanceValue = 0
      let customer: { firstName?: string; lastName?: string; phone?: string } | null = null
      let isMockUser = false

      const authPromise = fetch('/api/shop/account/auth', { cache: 'no-store' })
      const memberPromise = isCollector ? fetch('/api/membership/status') : Promise.resolve(new Response(null, { status: 401 }))
      const balancePromise = isCollector
        ? fetch(`/api/banking/balance?collector_identifier=${encodeURIComponent(session.user.email || '')}`)
        : Promise.resolve(new Response(null, { status: 401 }))

      try {
        const [authRes, memberRes, balanceRes] = await Promise.all([authPromise, memberPromise, balancePromise])

        if (authRes.status === 429 && !isRetryAfter429) {
          retryTimeoutRef.current = setTimeout(() => checkAuth(true), AUTH_429_RETRY_AFTER_MS)
          return
        }

        if (authRes.ok) {
          const authData = await authRes.json()
          customer = authData?.customer ?? null
          isMockUser = !!authData?.isMockUser
        }

        if (isCollector && memberRes.ok) {
          membershipData = await memberRes.json()
        }

        if (isCollector && balanceRes.ok) {
          const balanceData = await balanceRes.json()
          creditBalance = balanceData?.balance?.creditsBalance || 0
          creditBalanceValue = creditBalance * 0.10
        }
      } catch (fetchError) {
        console.warn('[useShopAuth] Error fetching auth/membership/balance:', fetchError)
      }

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        collectorIdentifier: session.user.email || '',
        firstName: customer?.firstName || session.user.user_metadata?.first_name,
        lastName: customer?.lastName || session.user.user_metadata?.last_name,
        phone: customer?.phone,
        avatarUrl: session.user.user_metadata?.avatar_url,
        
        // RBAC
        roles,
        permissions,
        isCollector,
        isVendor: roles.includes('vendor'),
        isAdmin: roles.includes('admin'),
        
        // Membership
        isMember: membershipData?.subscription?.status === 'active',
        membershipTier: membershipData?.subscription?.tier as MembershipTierId | undefined,
        membershipStatus: membershipData?.subscription?.status,
        membershipCurrentPeriodEnd: membershipData?.subscription?.current_period_end,
        creditBalance,
        creditBalanceValue,
        isMockUser,
      })
    } catch (error) {
      console.error('[useShopAuth] Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        setLoading(false)
      } else {
        checkAuth()
      }
    })

    return () => {
      subscription.unsubscribe()
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [checkAuth, supabase])

  // Permission check helper
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false
    // Admins with admin:all permission have access to everything
    if (user.permissions.includes('admin:all')) return true
    return user.permissions.includes(permission)
  }, [user])

  // Role check helper
  const hasRole = useCallback((role: Role): boolean => {
    if (!user) return false
    return user.roles.includes(role)
  }, [user])

  // Membership permission check - can use credits at checkout
  const canUseCredits = useCallback((): boolean => {
    if (!user) return false
    if (!user.isMember) return false
    if (user.creditBalance <= 0) return false
    // Check permission (admins always can, members with credits:redeem can)
    return hasPermission('credits:redeem') || hasPermission('admin:all')
  }, [user, hasPermission])

  // Refresh user data (e.g., after purchase).
  // Bypass the throttle so an explicit refresh always runs, and guarantee
  // setLoading(false) even if checkAuth returns early.
  const refreshUser = useCallback(async () => {
    setLoading(true)
    lastCheckRef.current = 0
    try {
      await checkAuth()
    } finally {
      setLoading(false)
    }
  }, [checkAuth])

  return { 
    user, 
    loading, 
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
    canUseCredits,
    refreshUser,
  }
}

export default useShopAuth
