/**
 * Accordion FAQ - Osmo-style Expandable Questions
 * 
 * Features:
 * - Smooth GSAP expand/collapse animations
 * - Auto-close siblings option
 * - Rotating plus/minus icons
 * - Categorized FAQ groups
 * - Accessible ARIA attributes
 * 
 * Based on Osmo's FAQ accordion system
 */

'use client'

import * as React from 'react'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'

export interface FAQItem {
  id: string
  question: string
  answer: string | React.ReactNode
  defaultOpen?: boolean
}

export interface FAQCategory {
  id: string
  title: string
  items: FAQItem[]
}

export interface AccordionFAQProps {
  categories: FAQCategory[]
  defaultCategory?: string
  closeSiblings?: boolean
  className?: string
}

export function AccordionFAQ({
  categories,
  defaultCategory,
  closeSiblings = true,
  className,
}: AccordionFAQProps) {
  const [activeCategory, setActiveCategory] = useState(
    defaultCategory || categories[0]?.id || ''
  )

  const activeItems = categories.find((cat) => cat.id === activeCategory)?.items || []

  return (
    <div className={cn('space-y-8', className)}>
      {/* Category Toggle Buttons */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300',
                category.id === activeCategory
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]'
              )}
            >
              {category.title}
            </button>
          ))}
        </div>
      )}

      {/* FAQ Items */}
      <AccordionGroup items={activeItems} closeSiblings={closeSiblings} />
    </div>
  )
}

/**
 * Accordion Group - manages open/close state
 */
interface AccordionGroupProps {
  items: FAQItem[]
  closeSiblings: boolean
}

function AccordionGroup({ items, closeSiblings }: AccordionGroupProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter((item) => item.defaultOpen).map((item) => item.id))
  )

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (closeSiblings) {
          next.clear()
        }
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          item={item}
          isOpen={openItems.has(item.id)}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </div>
  )
}

/**
 * Individual Accordion Item
 */
interface AccordionItemProps {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<SVGSVGElement>(null)

  // Animate open/close
  useGSAP(() => {
    if (!contentRef.current || !wrapRef.current) return

    if (isOpen) {
      // Measure content height
      const height = wrapRef.current.scrollHeight

      // Expand animation
      gsap.to(contentRef.current, {
        height,
        duration: 0.4,
        ease: 'power2.out',
      })

      // Rotate icon
      if (iconRef.current) {
        gsap.to(iconRef.current, {
          rotation: 45,
          duration: 0.3,
          ease: 'power2.out',
        })
      }
    } else {
      // Collapse animation
      gsap.to(contentRef.current, {
        height: 0,
        duration: 0.4,
        ease: 'power2.inOut',
      })

      // Reset icon rotation
      if (iconRef.current) {
        gsap.to(iconRef.current, {
          rotation: 0,
          duration: 0.3,
          ease: 'power2.out',
        })
      }
    }
  }, { dependencies: [isOpen] })

  return (
    <div
      className={cn(
        'border-b border-[#1a1a1a]/10 transition-colors duration-300',
        isOpen && 'border-[#1a1a1a]/20'
      )}
    >
      {/* Question Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-6 text-left group"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg sm:text-xl font-medium text-[#1a1a1a] pr-4 transition-colors duration-300 group-hover:text-[#803cee]">
          {item.question}
        </h3>

        {/* Plus/Minus Icon */}
        <svg
          ref={iconRef}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 13 13"
          fill="none"
          className="flex-shrink-0 text-[#1a1a1a] transition-colors duration-300 group-hover:text-[#803cee]"
        >
          <path
            d="M5.96149 12.0996V6.99217H0.839844V5.20705H5.96149V0.0996094H7.74294V5.20705H12.8398V6.99217H7.74294V12.0996H5.96149Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Answer Content */}
      <div
        ref={contentRef}
        className="overflow-hidden"
        style={{ height: isOpen ? 'auto' : 0 }}
      >
        <div ref={wrapRef} className="pb-6">
          {typeof item.answer === 'string' ? (
            <p className="text-[#1a1a1a]/70 leading-relaxed">{item.answer}</p>
          ) : (
            <div className="text-[#1a1a1a]/70 leading-relaxed prose prose-sm max-w-none">
              {item.answer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AccordionFAQ
