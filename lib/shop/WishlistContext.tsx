'use client'

import * as React from 'react'

/**
 * Wishlist Context
 * 
 * Manages saved/wishlist items with localStorage persistence.
 * No login required - works anonymously.
 * 
 * Features:
 * - Add/remove items from wishlist
 * - Persist to localStorage
 * - Check if item is in wishlist
 * - Get wishlist count
 */

export interface WishlistItem {
  productId: string
  variantId: string
  handle: string
  title: string
  price: number
  image?: string
  artistName?: string
  editionCount?: string
  addedAt: number
}

interface WishlistState {
  items: WishlistItem[]
}

type WishlistAction =
  | { type: 'ADD_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: string } // productId
  | { type: 'LOAD_WISHLIST'; payload: WishlistItem[] }
  | { type: 'CLEAR_WISHLIST' }

interface WishlistContextValue {
  items: WishlistItem[]
  itemCount: number
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

const WishlistContext = React.createContext<WishlistContextValue | undefined>(undefined)

const WISHLIST_STORAGE_KEY = 'street-collector-wishlist'

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Check if item already exists
      const existingIndex = state.items.findIndex(
        item => item.productId === action.payload.productId
      )
      
      if (existingIndex >= 0) {
        // Already in wishlist, don't add again
        return state
      }
      
      return {
        ...state,
        items: [...state.items, action.payload],
      }
    }
    
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.productId !== action.payload),
      }
    }
    
    case 'LOAD_WISHLIST': {
      return {
        ...state,
        items: action.payload,
      }
    }
    
    case 'CLEAR_WISHLIST': {
      return {
        ...state,
        items: [],
      }
    }
    
    default:
      return state
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(wishlistReducer, {
    items: [],
  })
  
  // Load wishlist from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
      if (stored) {
        const items = JSON.parse(stored) as WishlistItem[]
        dispatch({ type: 'LOAD_WISHLIST', payload: items })
      }
    } catch (error) {
      console.error('Failed to load wishlist from localStorage:', error)
    }
  }, [])
  
  // Persist wishlist to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state.items))
    } catch (error) {
      console.error('Failed to save wishlist to localStorage:', error)
    }
  }, [state.items])
  
  const addItem = React.useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        ...item,
        addedAt: Date.now(),
      },
    })
  }, [])
  
  const removeItem = React.useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }, [])
  
  const isInWishlist = React.useCallback((productId: string) => {
    return state.items.some(item => item.productId === productId)
  }, [state.items])
  
  const clearWishlist = React.useCallback(() => {
    dispatch({ type: 'CLEAR_WISHLIST' })
  }, [])
  
  const value = React.useMemo(() => ({
    items: state.items,
    itemCount: state.items.length,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlist,
  }), [state.items, addItem, removeItem, isInWishlist, clearWishlist])
  
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = React.useContext(WishlistContext)
  if (!context) {
    // During SSR or if provider is missing, return a safe default
    // This prevents build errors during static generation
    if (typeof window === 'undefined') {
      return {
        items: [],
        itemCount: 0,
        addItem: () => {},
        removeItem: () => {},
        isInWishlist: () => false,
        clearWishlist: () => {},
      }
    }
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
