'use client'

import * as React from 'react'
import { Lamp, Palette, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Container, SectionWrapper } from '@/components/impact'

export interface FAQGroup {
  title: string
  items: { question: string; answer: string }[]
}

export interface StreetCollectorFAQProps {
  title: string
  groups: FAQGroup[]
}

const groupIcons: Record<string, React.ElementType> = {
  'About the Lamp': Lamp,
  'About the Street Lamp': Lamp,
  'About Artworks': Palette,
  'About the Artworks': Palette,
  'Shipping & Delivery': Truck,
}

export function StreetCollectorFAQ({ title, groups }: StreetCollectorFAQProps) {
  return (
    <SectionWrapper
      spacing="md"
      background="transparent"
      className="mb-0 !pt-8 pb-10 sm:!pt-10 md:!pt-12 md:pb-14"
    >
      <Container maxWidth="default" paddingX="gutter">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#FFBA94] sm:text-4xl md:text-5xl lg:text-6xl">
            {title}
          </h1>
        </div>

        <div className="mx-auto max-w-2xl space-y-4 pb-4 text-left sm:space-y-5 sm:pb-6">
          {groups.map((group) => {
            const Icon = groupIcons[group.title] ?? Lamp
            const groupKey = group.title.trim() || 'faq'
            return (
              <section
                key={groupKey}
                className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0909] p-4 sm:rounded-2xl sm:p-5"
              >
                {group.title.trim() ? (
                  <div className="mb-4 flex items-center justify-start gap-3 border-b border-white/[0.06] pb-4 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#FFBA94]">
                      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#FFBA94] sm:text-base">
                      {group.title}
                    </h2>
                  </div>
                ) : null}

                <Accordion type="single" collapsible className="w-full">
                  {group.items.map((item, idx) => (
                    <AccordionItem
                      key={item.question}
                      value={`${groupKey}-${idx}`}
                      className={cn(
                        'border-b border-white/[0.06] last:border-b-0',
                        'py-3.5 first:pt-0 last:pb-0 sm:py-4'
                      )}
                    >
                      <AccordionTrigger
                        className={cn(
                          'flex w-full flex-row items-center justify-between gap-3 py-0 text-left hover:no-underline',
                          'text-sm font-medium text-[#FFBA94] sm:text-[15px]',
                          '[&[data-state=open]]:text-[#FFBA94]',
                          'hover:text-[#FFBA94]/90 transition-colors',
                          '[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-[#FFBA94]/70'
                        )}
                      >
                        <span className="min-w-0 flex-1 pr-2 text-left leading-snug">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-1 pt-2 text-left text-[13px] leading-relaxed text-white/55 sm:text-sm">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )
          })}
        </div>
      </Container>
    </SectionWrapper>
  )
}
