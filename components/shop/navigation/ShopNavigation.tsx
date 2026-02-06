'use client'

import * as React from 'react'
import { useCallback, useState, useRef, useEffect } from 'react'
import { MinifiedNavBar } from './MinifiedNavBar'
import { AddToCartNotification } from './AddToCartNotification'
import type { NavItem } from '@/components/impact/Header'
import type { SearchResult } from '@/components/impact/SearchDrawer'
import type { CartItem } from '@/lib/shop/CartContext'

/**
 * ShopNavigation - Main navigation controller
 * 
 * Manages scroll-responsive navigation system:
 * 1. Full header (above threshold)
 * 2. Minified floating bar (scrolled)
 * 3. Unified navigation modal (expanded)
 * 
 * Features:
 * - GSAP scroll detection and transitions
 * - Integrated search, cart, and navigation
 * - Add-to-cart notifications
 */

export interface ShopNavigationProps {
  // Branding
  logo?: React.ReactNode
  logoSrc?: string
  logoHref?: string
  // Navigation
  navigation?: NavItem[]
  // Search
  onSearch: (query: string) => Promise<{ products: SearchResult[]; collections: SearchResult[] }>
  searchPlaceholder?: string
  // Cart
  cartItems: CartItem[]
  cartSubtotal: number
  cartTotal: number
  cartItemCount: number
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  onViewCart?: () => void
  cartLoading?: boolean
  // Wishlist
  wishlistCount?: number
  onWishlistClick?: () => void
  // Account
  onAccountClick?: () => void
  // Modal state control
  isModalOpen?: boolean
  onModalToggle?: () => void
  // Scroll threshold
  scrollThreshold?: number
  className?: string
}

export function ShopNavigation({
  logo,
  logoSrc,
  logoHref = '/',
  navigation = [],
  onSearch,
  searchPlaceholder,
  cartItems,
  cartSubtotal,
  cartTotal,
  cartItemCount,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onViewCart,
  cartLoading,
  wishlistCount = 0,
  onWishlistClick,
  onAccountClick,
  isModalOpen: controlledModalOpen,
  onModalToggle: controlledModalToggle,
  scrollThreshold = 80, // Reduced threshold - always show minified bar after small scroll
  className,
}: ShopNavigationProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false)
  
  // Use controlled state if provided, otherwise use internal state
  const isModalOpen = controlledModalOpen !== undefined ? controlledModalOpen : internalModalOpen
  const [showCartDrawer, setShowCartDrawer] = useState(false)
  const [addToCartNotification, setAddToCartNotification] = useState<{
    isVisible: boolean
    product?: CartItem
  }>({ isVisible: false })

  const prevCartCount = useRef(cartItemCount)

  // Detect cart additions and show notification
  useEffect(() => {
    if (cartItemCount > prevCartCount.current) {
      // Get the most recently added item (assumes last item in array)
      const recentItem = cartItems[cartItems.length - 1]
      if (recentItem) {
        setAddToCartNotification({
          isVisible: true,
          product: recentItem,
        })
      }
    }
    prevCartCount.current = cartItemCount
  }, [cartItemCount, cartItems])

  // Handle modal toggle
  const handleToggleModal = useCallback(() => {
    if (controlledModalToggle) {
      controlledModalToggle()
    } else {
      setInternalModalOpen((prev) => !prev)
    }
  }, [controlledModalToggle])

  // Handle search focus (open modal)
  const handleSearchFocus = useCallback(() => {
    if (controlledModalToggle && controlledModalOpen === false) {
      controlledModalToggle()
    } else if (!controlledModalToggle) {
      setInternalModalOpen(true)
    }
  }, [controlledModalToggle, controlledModalOpen])

  // Handle cart click - open cart drawer instead of modal
  const handleCartClick = useCallback(() => {
    if (onViewCart) {
      onViewCart()
    }
  }, [onViewCart])

  // Close notification
  const handleCloseNotification = useCallback(() => {
    setAddToCartNotification({ isVisible: false })
  }, [])

  // View cart from notification
  const handleViewCartFromNotification = useCallback(() => {
    setIsModalOpen(true)
    handleCloseNotification()
  }, [handleCloseNotification])

  return (
    <>
      {/* Transforming Navigation Chip - morphs into modal */}
      <MinifiedNavBar
        isVisible={true}
        isModalOpen={isModalOpen}
        cartCount={cartItemCount}
        wishlistCount={wishlistCount}
        logoSrc={logoSrc}
        navigation={navigation}
        onToggleModal={handleToggleModal}
        onCartClick={handleCartClick}
        onWishlistClick={onWishlistClick}
        onSearchClick={handleSearchFocus}
        onAccountClick={onAccountClick}
        onSearch={onSearch}
        className={className}
      />

      {/* Add to Cart Notification */}
      {addToCartNotification.product && (
        <AddToCartNotification
          isVisible={addToCartNotification.isVisible}
          onClose={handleCloseNotification}
          title={addToCartNotification.product.title}
          image={addToCartNotification.product.image}
          variantTitle={addToCartNotification.product.variantTitle}
          price={`$${addToCartNotification.product.price.toFixed(2)}`}
          artistName={addToCartNotification.product.artistName}
          cartCount={cartItemCount}
          onViewCart={handleViewCartFromNotification}
          onContinueShopping={handleCloseNotification}
        />
      )}
    </>
  )
}
