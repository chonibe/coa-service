'use client'

import * as React from 'react'

/**
 * Wishlist Context
 * 
 * Manages saved/wishlist items with localStorage persistence.
 * 
 * For authenticated users: syncs with server API, localStorage as offline cache.
 * For guests: localStorage-only behavior (no login required).
 * On first login: merges localStorage wishlist into server (dedup by product_id).
 * 
 * @module lib/shop/WishlistContext
 * @see app/api/collector/wishlist/route.ts - Server API
 * @see supabase/migrations/20260214100000_collector_wishlist_items.sql - DB schema
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
  serverSynced: boolean
}

type WishlistAction =
  | { type: 'ADD_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: string } // productId
  | { type: 'LOAD_WISHLIST'; payload: WishlistItem[] }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'SET_SYNCED'; payload: boolean }

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
      const existingIndex = state.items.findIndex(
        item => item.productId === action.payload.productId
      )
      
      if (existingIndex >= 0) {
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

    case 'SET_SYNCED': {
      return {
        ...state,
        serverSynced: action.payload,
      }
    }
    
    default:
      return state
  }
}

// ── Server sync helpers ──

async function fetchServerWishlist(): Promise<WishlistItem[] | null> {
  try {
    const res = await fetch('/api/collector/wishlist', { credentials: 'include' })
    if (!res.ok) return null
    const data = await res.json()
    return (data.items || []).map((item: any) => ({
      productId: item.product_id,
      variantId: item.variant_id || '',
      handle: item.handle,
      title: item.title,
      price: item.price || 0,
      image: item.image,
      artistName: item.artist_name,
      addedAt: new Date(item.added_at).getTime(),
    }))
  } catch {
    return null
  }
}

async function addToServer(item: Omit<WishlistItem, 'addedAt'>) {
  try {
    await fetch('/api/collector/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        productId: item.productId,
        variantId: item.variantId,
        handle: item.handle,
        title: item.title,
        price: item.price,
        image: item.image,
        artistName: item.artistName,
      }),
    })
  } catch (error) {
    console.warn('[Wishlist] Server add failed (offline?):', error)
  }
}

async function removeFromServer(productId: string) {
  try {
    await fetch(`/api/collector/wishlist?productId=${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  } catch (error) {
    console.warn('[Wishlist] Server remove failed (offline?):', error)
  }
}

/**
 * Merge localStorage wishlist into server (dedup by productId, newest wins).
 */
async function mergeLocalToServer(localItems: WishlistItem[], serverItems: WishlistItem[]): Promise<WishlistItem[]> {
  const serverProductIds = new Set(serverItems.map(i => i.productId))
  const itemsToSync = localItems.filter(item => !serverProductIds.has(item.productId))

  // Upload local items that aren't on server
  for (const item of itemsToSync) {
    await addToServer(item)
  }

  // Merged list: server items + local-only items
  const merged = [...serverItems]
  for (const item of itemsToSync) {
    merged.push(item)
  }

  return merged.sort((a, b) => b.addedAt - a.addedAt)
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(wishlistReducer, {
    items: [],
    serverSynced: false,
  })
  
  // Load wishlist: try server first, fall back to localStorage
  React.useEffect(() => {
    let cancelled = false

    async function loadWishlist() {
      // Always load localStorage first (instant)
      let localItems: WishlistItem[] = []
      try {
        const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
        if (stored) {
          localItems = JSON.parse(stored) as WishlistItem[]
          dispatch({ type: 'LOAD_WISHLIST', payload: localItems })
        }
      } catch (error) {
        console.error('Failed to load wishlist from localStorage:', error)
      }

      // Try server sync (authenticated users)
      const serverItems = await fetchServerWishlist()
      if (cancelled) return

      if (serverItems !== null) {
        // User is authenticated — merge local into server
        const merged = await mergeLocalToServer(localItems, serverItems)
        if (!cancelled) {
          dispatch({ type: 'LOAD_WISHLIST', payload: merged })
          dispatch({ type: 'SET_SYNCED', payload: true })
          // Update localStorage to reflect merged state
          try {
            localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(merged))
          } catch {}
        }
      }
      // If server fetch returned null, user is a guest — localStorage-only is fine
    }

    loadWishlist()
    return () => { cancelled = true }
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
    const fullItem: WishlistItem = { ...item, addedAt: Date.now() }
    dispatch({ type: 'ADD_ITEM', payload: fullItem })

    // Sync to server if authenticated
    if (state.serverSynced) {
      addToServer(item)
    }
  }, [state.serverSynced])
  
  const removeItem = React.useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })

    // Sync to server if authenticated
    if (state.serverSynced) {
      removeFromServer(productId)
    }
  }, [state.serverSynced])
  
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
