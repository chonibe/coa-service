'use client'

/**
 * Shop Auth Context Provider
 * 
 * Provides shop authentication state to all components in the shop.
 * Wraps useShopAuth hook in a React Context for broader access.
 * 
 * @module lib/shop/ShopAuthContext
 */

import React, { createContext, useContext, ReactNode } from 'react'
import { useShopAuth, type ShopUser } from './useShopAuth'
import type { Role, Permission } from '@/lib/rbac'

interface ShopAuthContextValue {
  user: ShopUser | null
  loading: boolean
  isAuthenticated: boolean
  hasPermission: (permission: Permission) => boolean
  hasRole: (role: Role) => boolean
  canUseCredits: () => boolean
  refreshUser: () => Promise<void>
}

const ShopAuthContext = createContext<ShopAuthContextValue | undefined>(undefined)

interface ShopAuthProviderProps {
  children: ReactNode
}

export function ShopAuthProvider({ children }: ShopAuthProviderProps) {
  const auth = useShopAuth()
  
  return (
    <ShopAuthContext.Provider value={auth}>
      {children}
    </ShopAuthContext.Provider>
  )
}

export function useShopAuthContext(): ShopAuthContextValue {
  const context = useContext(ShopAuthContext)
  if (context === undefined) {
    throw new Error('useShopAuthContext must be used within a ShopAuthProvider')
  }
  return context
}

export default ShopAuthProvider
