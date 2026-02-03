'use client'

/**
 * Shopping Cart Context
 * 
 * Manages cart state with localStorage persistence.
 * Handles adding, removing, updating items and credit application.
 * 
 * @module lib/shop/CartContext
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react'

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

interface CartContextValue extends CartState {
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
  
  // Computed values
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
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
