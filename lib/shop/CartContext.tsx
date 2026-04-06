'use client'

/**
 * Shopping Cart Context
 * 
 * Manages cart state with localStorage persistence.
 * Handles adding, removing, updating items and credit application.
 * 
 * @module lib/shop/CartContext
 */

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode, useCallback } from 'react'
import { fetchStreetEditionStatesMap } from '@/lib/shop/fetch-street-edition-states-client'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'

// ============================================
// Types
// ============================================

export interface CartItem {
  id: string // Unique cart item ID
  productId: string // Shopify product ID
  variantId: string // Shopify variant ID
  handle: string // Product handle for URL
  title: string
  variantTitle?: string
  price: number // Unit price in USD
  quantity: number
  image?: string
  maxQuantity?: number // For limited editions
  artistName?: string
}

export interface CartState {
  items: CartItem[]
  creditsToUse: number // Credits to apply at checkout
  isOpen: boolean // Cart drawer state
  orderNotes: string // Customer notes for the order
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id'> }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_CREDITS_TO_USE'; payload: number }
  | { type: 'SET_ORDER_NOTES'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART'; payload?: boolean }
  | { type: 'LOAD_CART'; payload: CartState }

/** Public shipping promo (from `/api/shop/shipping-promo`); aligns cart copy with Stripe Checkout. */
export interface ShopShippingPromo {
  shippingFreeOver70: boolean
  freeOverUsd: number
  standardUnderUsd: number
}

const DEFAULT_SHIPPING_PROMO: ShopShippingPromo = {
  shippingFreeOver70: false,
  freeOverUsd: 70,
  standardUnderUsd: 10,
}

interface CartContextValue extends CartState {
  /** Unit USD for display and quick checkout: Street ladder when known, else stored cart price */
  effectiveUnitUsd: (item: CartItem) => number
  /** Tiered standard shipping enabled (free at/above freeOverUsd; standardUnderUsd below). */
  shippingPromo: ShopShippingPromo
  /** False until first `/api/shop/shipping-promo` response (success or failure). */
  shippingPromoReady: boolean
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  setCreditsToUse: (credits: number) => void
  setOrderNotes: (notes: string) => void
  clearCart: () => void
  toggleCart: (isOpen?: boolean) => void
  
  // Computed values
  itemCount: number
  subtotal: number
  creditsDiscount: number
  total: number
  isEmpty: boolean
}

// ============================================
// Constants
// ============================================

const CART_STORAGE_KEY = 'street-collector-cart'

const initialState: CartState = {
  items: [],
  creditsToUse: 0,
  isOpen: false,
  orderNotes: '',
}

// ============================================
// Reducer
// ============================================

function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Check if item with same variant already exists
      const existingIndex = state.items.findIndex(
        item => item.variantId === action.payload.variantId
      )
      
      if (existingIndex >= 0) {
        // Update quantity of existing item
        const newItems = [...state.items]
        const existing = newItems[existingIndex]
        const newQuantity = existing.quantity + action.payload.quantity
        
        // Respect max quantity if set
        const maxQty = action.payload.maxQuantity || Infinity
        newItems[existingIndex] = {
          ...existing,
          quantity: Math.min(newQuantity, maxQty),
          price: action.payload.price,
        }
        
        return { ...state, items: newItems, isOpen: true }
      }
      
      // Add new item
      const newItem: CartItem = {
        ...action.payload,
        id: generateItemId(),
      }
      
      return { 
        ...state, 
        items: [...state.items, newItem],
        isOpen: true, // Open cart when adding item
      }
    }
    
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id),
      }
    }
    
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        }
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      }
    }
    
    case 'SET_CREDITS_TO_USE': {
      return {
        ...state,
        creditsToUse: Math.max(0, action.payload),
      }
    }
    
    case 'SET_ORDER_NOTES': {
      return {
        ...state,
        orderNotes: action.payload,
      }
    }
    
    case 'CLEAR_CART': {
      return {
        ...initialState,
        isOpen: false,
      }
    }
    
    case 'TOGGLE_CART': {
      return {
        ...state,
        isOpen: action.payload !== undefined ? action.payload : !state.isOpen,
      }
    }
    
    case 'LOAD_CART': {
      return {
        ...action.payload,
        isOpen: false, // Always start closed
      }
    }
    
    default:
      return state
  }
}

// ============================================
// Context
// ============================================

const CartContext = createContext<CartContextValue | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [streetLadderUsdByProductId, setStreetLadderUsdByProductId] = useState<Record<string, number>>({})
  const [shippingPromo, setShippingPromo] = useState<ShopShippingPromo>(DEFAULT_SHIPPING_PROMO)
  const [shippingPromoReady, setShippingPromoReady] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        dispatch({ type: 'LOAD_CART', payload: parsed })
      }
    } catch (error) {
      console.warn('[CartContext] Failed to load cart from storage:', error)
    }
  }, [])
  
  // Persist cart to localStorage on changes
  useEffect(() => {
    try {
      // Don't persist isOpen state
      const toStore = {
        items: state.items,
        creditsToUse: state.creditsToUse,
        orderNotes: state.orderNotes,
        isOpen: false,
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(toStore))
    } catch (error) {
      console.warn('[CartContext] Failed to save cart to storage:', error)
    }
  }, [state.items, state.creditsToUse, state.orderNotes])

  useEffect(() => {
    const ids = Array.from(
      new Set(
        state.items
          .map((i) => normalizeShopifyProductId(i.productId))
          .filter((x): x is string => !!x)
      )
    )
    if (ids.length === 0) {
      setStreetLadderUsdByProductId({})
      return
    }
    let cancelled = false
    void fetchStreetEditionStatesMap(ids).then((map) => {
      if (cancelled) return
      const m: Record<string, number> = {}
      for (const [id, row] of Object.entries(map)) {
        if (row.priceUsd != null && row.priceUsd > 0) m[id] = row.priceUsd
      }
      setStreetLadderUsdByProductId(m)
    })
    return () => {
      cancelled = true
    }
  }, [state.items])

  useEffect(() => {
    let cancelled = false
    void fetch('/api/shop/shipping-promo')
      .then(async (res) => {
        if (!res.ok || cancelled) return
        const data = (await res.json()) as Record<string, unknown>
        if (cancelled || typeof data.shippingFreeOver70 !== 'boolean') return
        setShippingPromo({
          shippingFreeOver70: data.shippingFreeOver70,
          freeOverUsd: typeof data.freeOverUsd === 'number' ? data.freeOverUsd : DEFAULT_SHIPPING_PROMO.freeOverUsd,
          standardUnderUsd:
            typeof data.standardUnderUsd === 'number'
              ? data.standardUnderUsd
              : DEFAULT_SHIPPING_PROMO.standardUnderUsd,
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setShippingPromoReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])
  
  // Actions
  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }, [])
  
  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } })
  }, [])
  
  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }, [])
  
  const setCreditsToUse = useCallback((credits: number) => {
    dispatch({ type: 'SET_CREDITS_TO_USE', payload: credits })
  }, [])
  
  const setOrderNotes = useCallback((notes: string) => {
    dispatch({ type: 'SET_ORDER_NOTES', payload: notes })
  }, [])
  
  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])
  
  const toggleCart = useCallback((isOpen?: boolean) => {
    dispatch({ type: 'TOGGLE_CART', payload: isOpen })
  }, [])
  
  const effectiveUnitUsd = useCallback(
    (item: CartItem) => {
      const key = normalizeShopifyProductId(item.productId) ?? ''
      const ladder = streetLadderUsdByProductId[key]
      if (ladder != null && ladder > 0) return ladder
      return item.price
    },
    [streetLadderUsdByProductId]
  )

  // Computed values
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  
  const subtotal = state.items.reduce(
    (sum, item) => sum + effectiveUnitUsd(item) * item.quantity,
    0
  )
  
  // Credits discount: 10 credits = $1 (base rate)
  const creditsDiscount = Math.min(
    state.creditsToUse * 0.10, // $0.10 per credit
    subtotal // Can't exceed subtotal
  )
  
  const total = Math.max(0, subtotal - creditsDiscount)
  
  const isEmpty = state.items.length === 0
  
  const value: CartContextValue = {
    ...state,
    effectiveUnitUsd,
    shippingPromo,
    shippingPromoReady,
    addItem,
    removeItem,
    updateQuantity,
    setCreditsToUse,
    setOrderNotes,
    clearCart,
    toggleCart,
    itemCount,
    subtotal,
    creditsDiscount,
    total,
    isEmpty,
  }
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartProvider
