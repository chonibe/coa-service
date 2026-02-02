'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Product Accordion Component
 * 
 * Collapsible sections for product details.
 * Used for: Included in Box, Shipping & Returns, Warranty, etc.
 */

export interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
  icon?: React.ReactNode
  defaultOpen?: boolean
}

export interface ProductAccordionProps {
  items: AccordionItem[]
  className?: string
  allowMultiple?: boolean
}

export function ProductAccordion({
  items,
  className,
  allowMultiple = true,
}: ProductAccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
    const defaultOpen = new Set<string>()
    items.forEach(item => {
      if (item.defaultOpen) defaultOpen.add(item.id)
    })
    return defaultOpen
  })
  
  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!allowMultiple) {
          next.clear()
        }
        next.add(id)
      }
      return next
    })
  }
  
  return (
    <div className={cn('divide-y divide-[#1a1a1a]/10', className)}>
      {items.map((item) => (
        <AccordionItemComponent
          key={item.id}
          item={item}
          isOpen={openItems.has(item.id)}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </div>
  )
}

interface AccordionItemComponentProps {
  item: AccordionItem
  isOpen: boolean
  onToggle: () => void
}

function AccordionItemComponent({ item, isOpen, onToggle }: AccordionItemComponentProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | undefined>(isOpen ? undefined : 0)
  
  React.useEffect(() => {
    if (isOpen) {
      setHeight(contentRef.current?.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [isOpen])
  
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {item.icon && (
            <span className="text-[#1a1a1a]/60">{item.icon}</span>
          )}
          <span className="font-medium text-[#1a1a1a]">{item.title}</span>
        </div>
        <span
          className={cn(
            'flex-shrink-0 w-6 h-6 flex items-center justify-center',
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M2 4L6 8L10 4" />
          </svg>
        </span>
      </button>
      
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ height }}
      >
        <div ref={contentRef} className="pb-4">
          <div className="text-sm text-[#1a1a1a]/70 leading-relaxed">
            {item.content}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Pre-built accordion items for Street Lamp product
 */
export const streetLampAccordionItems: AccordionItem[] = [
  {
    id: 'included',
    title: 'Included in the Box',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
    defaultOpen: true,
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>A Street Lamp</li>
        <li>150mm length USB-C Charging cable with a magnet swivel head</li>
        <li>EU/US charging wall adapter</li>
        <li>Care instruction booklet</li>
      </ul>
    ),
  },
  {
    id: 'shipping',
    title: 'Shipping & Returns',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5a2 2 0 0 1-2 2h-1" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    content: (
      <p>
        To be considered eligible for a return, a return claim must be submitted within 14 days from the date you received your order. 
        Street Collector will accept returns in good and unused condition. The cost of the return shipping will be at your own expense.
        <br /><br />
        Should you require a faster shipping timeline, please select our Express shipping option.
      </p>
    ),
  },
  {
    id: 'warranty',
    title: '1-year warranty',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    content: (
      <div className="space-y-4">
        <p>
          We stand by the quality and craftsmanship of The Street Lamp. That&apos;s why every lamp comes with a 1-year warranty, 
          so you can enjoy your artwork with confidence.
        </p>
        <div>
          <p className="font-medium text-[#1a1a1a] mb-2">Our 1-year warranty covers:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Manufacturing defects in the lamp body or components.</li>
            <li>Issues with the light source or dimmer functionality.</li>
            <li>Faults in the artwork mounting mechanism.</li>
          </ul>
        </div>
        <p>If any of these issues arise within the first year of your purchase, we&apos;ll repair or replace your lamp at no cost to you.</p>
        <div>
          <p className="font-medium text-[#1a1a1a] mb-2">What&apos;s Not Covered?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Normal wear and tear.</li>
            <li>Damage caused by misuse, accidents, or improper installation.</li>
            <li>Modifications or repairs done by unauthorized third parties.</li>
          </ul>
        </div>
      </div>
    ),
  },
]

/**
 * Pre-built accordion items for Artwork products
 */
export const artworkAccordionItems: AccordionItem[] = [
  {
    id: 'print',
    title: 'The Print',
    defaultOpen: true,
    content: (
      <p>
        Each artwork is printed on premium vinyl material, designed specifically for The Street Lamp. 
        The print is made to showcase vibrant colors when illuminated, bringing your art to life.
      </p>
    ),
  },
  {
    id: 'support-artist',
    title: 'Buy a Print Support an Artist',
    content: (
      <p>
        When you purchase an artwork, a portion of the sale goes directly to the artist. 
        We believe in supporting the creative community and ensuring artists are fairly compensated for their work.
      </p>
    ),
  },
  {
    id: 'certificate',
    title: 'Certificate of Authenticity',
    content: (
      <p>
        Each artwork comes with a digital Certificate of Authenticity, verifying the edition number 
        and authenticity of your purchase. This certificate can be accessed through your collector account.
      </p>
    ),
  },
]

export default ProductAccordion
