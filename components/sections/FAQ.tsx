'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { SectionWrapper, Container, Button } from '@/components/impact'

/**
 * FAQ Accordion Section
 * 
 * Collapsible FAQ section, matching the Impact theme faq section.
 */

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface FAQSectionProps {
  items: FAQItem[]
  title?: string
  subtitle?: string
  content?: string
  textPosition?: 'start' | 'center'
  supportInfo?: {
    avatarUrl?: string
    avatarWidth?: number
    hours?: string
    answerTime?: string
  }
  cta?: {
    text: string
    url: string
  }
  backgroundColor?: string
  textColor?: string
  accordionBackgroundColor?: string
  accordionTextColor?: string
  fullWidth?: boolean
  className?: string
}

export function FAQSection({
  items,
  title = 'FAQ',
  subtitle,
  content,
  textPosition = 'start',
  supportInfo,
  cta,
  backgroundColor = '#ffffff',
  textColor,
  accordionBackgroundColor,
  accordionTextColor,
  fullWidth = false,
  className,
}: FAQSectionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <SectionWrapper
      spacing="md"
      fullWidth={fullWidth}
      className={className}
      style={{ backgroundColor }}
    >
      <Container maxWidth="default" paddingX="gutter">
        <div className={cn(
          'grid gap-8 lg:gap-12',
          textPosition === 'start' ? 'lg:grid-cols-[1fr,2fr]' : 'lg:grid-cols-1'
        )}>
          {/* Header */}
          <div className={cn(
            textPosition === 'center' && 'text-center max-w-2xl mx-auto mb-4'
          )}>
            {title && (
              <h2
                className="font-heading text-impact-h2 xl:text-impact-h2-lg font-semibold tracking-[-0.02em]"
                style={{ color: textColor || '#1a1a1a' }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="mt-3 text-base sm:text-lg"
                style={{ color: textColor ? `${textColor}99` : '#1a1a1a99' }}
              >
                {subtitle}
              </p>
            )}
            {content && (
              <div
                className="mt-4 prose prose-sm"
                style={{ color: textColor ? `${textColor}cc` : '#1a1a1acc' }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}

            {/* Support info */}
            {supportInfo && (
              <div className="mt-6 space-y-2">
                {supportInfo.avatarUrl && (
                  <img
                    src={supportInfo.avatarUrl}
                    alt="Support team"
                    className="rounded-full"
                    style={{ width: supportInfo.avatarWidth || 160 }}
                  />
                )}
                {supportInfo.hours && (
                  <p className="text-sm" style={{ color: textColor ? `${textColor}99` : '#1a1a1a99' }}>
                    {supportInfo.hours}
                  </p>
                )}
                {supportInfo.answerTime && (
                  <p className="text-sm font-medium" style={{ color: textColor || '#1a1a1a' }}>
                    {supportInfo.answerTime}
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            {cta && (
              <div className="mt-6">
                <a href={cta.url}>
                  <Button variant="primary">{cta.text}</Button>
                </a>
              </div>
            )}
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {items.map((item) => (
              <AccordionItem
                key={item.id}
                item={item}
                isOpen={openItems.has(item.id)}
                onToggle={() => toggleItem(item.id)}
                backgroundColor={accordionBackgroundColor}
                textColor={accordionTextColor || textColor}
              />
            ))}
          </div>
        </div>
      </Container>
    </SectionWrapper>
  )
}

/**
 * Accordion Item Component
 */
interface AccordionItemProps {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
  backgroundColor?: string
  textColor?: string
}

function AccordionItem({ item, isOpen, onToggle, backgroundColor, textColor }: AccordionItemProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | undefined>(0)

  React.useEffect(() => {
    if (isOpen) {
      setHeight(contentRef.current?.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [isOpen])

  return (
    <div
      className="rounded-[16px] overflow-hidden"
      style={{ backgroundColor: backgroundColor || '#f5f5f5' }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
        aria-expanded={isOpen}
      >
        <span
          className="font-heading text-base sm:text-lg font-medium pr-4"
          style={{ color: textColor || '#1a1a1a' }}
        >
          {item.question}
        </span>
        <span
          className={cn(
            'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full',
            'bg-white transition-transform duration-200',
            isOpen && 'rotate-45'
          )}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 1v10M1 6h10" />
          </svg>
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ height }}
      >
        <div ref={contentRef} className="px-5 pb-5">
          <div
            className="prose prose-sm max-w-none"
            style={{ color: textColor ? `${textColor}cc` : '#1a1a1acc' }}
            dangerouslySetInnerHTML={{ __html: item.answer }}
          />
        </div>
      </div>
    </div>
  )
}

export default FAQSection
