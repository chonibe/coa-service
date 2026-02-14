'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X, Image as ImageIcon, Layers, Upload, FileText } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

// ============================================================================
// Create Action Sheet
//
// Slide-up bottom sheet shown when vendor taps the "+" create button.
// Presents creation options before launching the full create flow:
// - New Artwork (primary action)
// - New Series
// - Upload Media
//
// Uses framer-motion for smooth slide-up/fade animations.
// ============================================================================

export interface CreateOption {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
}

export interface CreateActionSheetProps {
  isOpen: boolean
  onClose: () => void
  options?: CreateOption[]
  className?: string
}

const defaultOptions: CreateOption[] = [
  {
    id: 'artwork',
    label: 'New Artwork',
    description: 'Create a new artwork with blocks',
    icon: <ImageIcon className="w-6 h-6" />,
  },
  {
    id: 'series',
    label: 'New Series',
    description: 'Organize artworks into a series',
    icon: <Layers className="w-6 h-6" />,
  },
  {
    id: 'media',
    label: 'Upload Media',
    description: 'Add images, video, or audio',
    icon: <Upload className="w-6 h-6" />,
  },
]

export function CreateActionSheet({
  isOpen,
  onClose,
  options = defaultOptions,
  className,
}: CreateActionSheetProps) {
  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[61]',
              'bg-white rounded-t-[24px]',
              'pb-[var(--app-safe-bottom)]',
              'max-h-[80vh] overflow-y-auto',
              className
            )}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-lg font-heading font-semibold text-gray-900 tracking-tight">
                Create
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  'flex items-center justify-center',
                  'w-8 h-8 rounded-full',
                  'bg-gray-100 text-gray-500',
                  'hover:bg-gray-200 active:bg-gray-300',
                  'transition-colors duration-200'
                )}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options */}
            <div className="px-5 pb-6 space-y-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    option.onClick?.()
                    onClose()
                  }}
                  className={cn(
                    'flex items-center gap-4 w-full',
                    'p-4 rounded-impact-block-sm',
                    'bg-gray-50 hover:bg-gray-100 active:bg-gray-150',
                    'transition-colors duration-200',
                    'text-left'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center shrink-0',
                      'w-12 h-12 rounded-xl',
                      'bg-[#390000] text-[#ffba94]'
                    )}
                  >
                    {option.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 font-body">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 font-body mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
