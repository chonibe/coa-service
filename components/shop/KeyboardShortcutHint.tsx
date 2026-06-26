'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import gsap from 'gsap'

/**
 * Keyboard Shortcut Hint
 * 
 * Subtle hint showing keyboard shortcuts.
 * Apple-style design with smooth animations.
 */

export interface KeyboardShortcutHintProps {
  shortcut: string
  description: string
  className?: string
}

export function KeyboardShortcutHint({ shortcut, description, className }: KeyboardShortcutHintProps) {
  return (
    <div className={cn('inline-flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <kbd className="px-2 py-0.5 text-xs font-semibold bg-muted border border-border rounded">
        {shortcut}
      </kbd>
      <span>{description}</span>
    </div>
  )
}

/**
 * Keyboard Shortcuts Modal
 * 
 * Show all available shortcuts in a modal (triggered by ? key)
 */

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = React.useState(false)
  const modalRef = React.useRef<HTMLDivElement>(null)
  const backdropRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? key to show shortcuts
      if (e.key === '?' && !isInputFocused()) {
        e.preventDefault()
        setIsOpen(true)
      }
      
      // Esc to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])
  
  React.useEffect(() => {
    if (isOpen && modalRef.current && backdropRef.current) {
      // Animate in
      gsap.to(backdropRef.current, {
        opacity: 1,
        duration: 0.2,
        ease: 'power2.out',
      })
      gsap.from(modalRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 20,
        duration: 0.3,
        ease: 'back.out(1.7)',
      })
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  const shortcuts = [
    { key: '/', description: 'Open search' },
    { key: 'C', description: 'Open cart' },
    { key: 'Esc', description: 'Close drawer/modal' },
    { key: '?', description: 'Show keyboard shortcuts' },
  ]
  
  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50 bg-black/50 opacity-0"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors"
            >
              <span className="text-foreground">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted border border-border rounded-lg">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        
        <p className="mt-6 text-xs text-center text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> to close
        </p>
      </div>
    </>
  )
}

function isInputFocused(): boolean {
  const target = document.activeElement as HTMLElement
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.contentEditable === 'true'
  )
}
