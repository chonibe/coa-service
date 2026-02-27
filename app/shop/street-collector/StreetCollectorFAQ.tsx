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
    <SectionWrapper spacing="lg" background="muted">
      <Container maxWidth="default" paddingX="gutter">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-neutral-900 mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
            Quick answers to common questions. Can&apos;t find what you need?{' '}
            <a
              href="mailto:hello@thestreetcollector.com"
              className="text-neutral-900 font-medium underline underline-offset-2 hover:no-underline transition-all"
            >
              Get in touch
            </a>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {groups.map((group) => {
            const Icon = groupIcons[group.title] ?? Lamp
            return (
              <section
                key={group.title}
                className="rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-neutral-100 hover:shadow-md hover:border-neutral-200/80 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight">
                    {group.title}
                  </h3>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {group.items.map((item, idx) => (
                    <AccordionItem
                      key={item.question}
                      value={`${group.title}-${idx}`}
                      className={cn(
                        'border-0 border-b border-neutral-100 last:border-0',
                        'py-4 first:pt-0 last:pb-0'
                      )}
                    >
                      <AccordionTrigger
                        className={cn(
                          'py-0 hover:no-underline group',
                          '[&[data-state=open]]:text-neutral-900 [&[data-state=open]]:font-medium',
                          'text-left text-[15px] sm:text-base text-neutral-700',
                          'hover:text-neutral-900 transition-colors'
                        )}
                      >
                        <span className="pr-4 leading-snug">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-neutral-600 text-sm sm:text-[15px] leading-relaxed pt-2 pb-0">
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
