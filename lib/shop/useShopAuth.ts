'use client'

/**
 * Shop Authentication Hook with RBAC Integration
 * 
 * Provides authentication state, roles, permissions, and membership status
 * for the shop/storefront experience.
 * 
 * @module lib/shop/useShopAuth
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Role, Permission } from '@/lib/rbac'
import type { MembershipTierId } from '@/lib/membership/tiers'

export interface ShopUser {
  id: string
  email: string
  collectorIdentifier: string
  firstName?: string
  lastName?: string
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
  const supabase = createClient()

  const checkAuth = useCallback(async () => {
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

      // Fetch membership status and credit balance (only if collector role)
      let membershipData = null
      let creditBalance = 0
      let creditBalanceValue = 0
      
      if (isCollector) {
        try {
          const [memberRes, balanceRes] = await Promise.all([
            fetch('/api/membership/status'),
            fetch(`/api/banking/balance?collector_identifier=${encodeURIComponent(session.user.email || '')}`)
          ])
          
          if (memberRes.ok) {
            membershipData = await memberRes.json()
          }
          
          if (balanceRes.ok) {
            const balanceData = await balanceRes.json()
            creditBalance = balanceData?.balance?.creditsBalance || 0
            // Calculate USD value (base rate $0.10 per credit)
            creditBalanceValue = creditBalance * 0.10
          }
        } catch (fetchError) {
          console.warn('[useShopAuth] Error fetching membership/balance:', fetchError)
        }
      }

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        collectorIdentifier: session.user.email || '',
        firstName: session.user.user_metadata?.first_name,
        lastName: session.user.user_metadata?.last_name,
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
      })
    } catch (error) {
      console.error('[useShopAuth] Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
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

    return () => subscription.unsubscribe()
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

  // Refresh user data (e.g., after purchase)
  const refreshUser = useCallback(async () => {
    setLoading(true)
    await checkAuth()
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
