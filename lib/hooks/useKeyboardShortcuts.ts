'use client'

import { useEffect } from 'react'

/**
 * Keyboard Shortcuts Hook
 * 
 * Apple-style keyboard shortcuts for the shop:
 * - / : Open search
 * - C : Open cart
 * - Esc : Close any open drawer/modal
 * - ⌘K / Ctrl+K : Command palette (future)
 * 
 * Respects input focus - shortcuts don't trigger when typing.
 */

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  callback: () => void
  description: string
}

export interface UseKeyboardShortcutsOptions {
  onOpenSearch?: () => void
  onOpenCart?: () => void
  onCloseAll?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onOpenSearch,
  onOpenCart,
  onCloseAll,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      
      // Esc always works (to close things)
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseAll?.()
        return
      }
      
      // Other shortcuts only work when not in an input
      if (isInput) return
      
      // Forward slash: Open search
      if (e.key === '/') {
        e.preventDefault()
        onOpenSearch?.()
        return
      }
      
      // C: Open cart (lowercase or uppercase)
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        onOpenCart?.()
        return
      }
      
      // Cmd+K or Ctrl+K: Command palette (future feature)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Future: open command palette
        console.log('Command palette shortcut triggered')
        return
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, onOpenSearch, onOpenCart, onCloseAll])
}

/**
 * Hook to show keyboard shortcut hints
 */
export function useKeyboardShortcutHints() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      callback: () => {},
      description: 'Search',
    },
    {
      key: 'C',
      callback: () => {},
      description: 'Open cart',
    },
    {
      key: 'Esc',
      callback: () => {},
      description: 'Close',
    },
  ]
  
  return shortcuts
}
