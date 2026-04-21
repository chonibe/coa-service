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
  'About Artworks': Palette,
  'Shipping & Delivery': Truck,
}

export function StreetCollectorFAQ({ title, groups }: StreetCollectorFAQProps) {
  return (
    <SectionWrapper spacing="md" background="experience" className="mb-0 !pt-6 pb-10 sm:!pt-8 md:!pt-10 md:pb-0">
      <Container maxWidth="default" paddingX="gutter">
        <div className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-stone-900 dark:text-[#FFBA94] sm:text-4xl md:text-5xl lg:text-6xl">
            {title}
          </h2>
        </div>

        <div className="mx-auto max-w-2xl space-y-5 pb-10 text-left sm:pb-12 md:pb-14">
          {groups.map((group) => {
            const Icon = groupIcons[group.title] ?? Lamp
            const groupKey = group.title.trim() || 'faq'
            return (
              <section
                key={groupKey}
                className="rounded-xl border border-stone-200/80 bg-white/90 p-4 sm:rounded-2xl sm:p-5 dark:border-transparent dark:bg-[#201c1c]/55"
              >
                {group.title.trim() ? (
                  <div className="mb-3 flex items-center justify-start gap-2.5 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-950 dark:bg-[#ffba94]/10 dark:text-[#FFBA94]">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-stone-900 dark:text-[#FFBA94] sm:text-lg">
                      {group.title}
                    </h3>
                  </div>
                ) : null}

                <Accordion type="single" collapsible className="w-full">
                  {group.items.map((item, idx) => (
                    <AccordionItem
                      key={item.question}
                      value={`${groupKey}-${idx}`}
                      className={cn(
                        'border-0',
                        'py-3.5 first:pt-0 last:pb-0 sm:py-4'
                      )}
                    >
                      <AccordionTrigger
                        className={cn(
                          'group flex w-full flex-row items-center justify-between gap-3 py-0 text-left text-stone-900 hover:no-underline dark:text-[#FFBA94]',
                          '[&[data-state=open]]:font-medium [&[data-state=open]]:text-stone-950 dark:[&[data-state=open]]:text-[#FFBA94]',
                          'text-sm sm:text-[15px]',
                          'transition-colors hover:text-stone-800 dark:hover:text-[#FFBA94]/90',
                          '[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-stone-700 dark:[&>svg]:text-[#FFBA94]'
                        )}
                      >
                        <span className="min-w-0 flex-1 pr-2 text-left leading-snug">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pt-1.5 text-left text-xs leading-snug text-stone-600 dark:text-[#FFBA94]/90 sm:text-sm">
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
