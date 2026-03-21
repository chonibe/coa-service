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
    <SectionWrapper spacing="lg" background="experience" className="mb-0 !pt-10 pb-16 sm:!pt-14 md:!pt-16 md:pb-0">
      <Container maxWidth="default" paddingX="gutter">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="font-serif font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFBA94] mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-[#FFBA94]/80 leading-relaxed">
            Quick answers to common questions. Can&apos;t find what you need?{' '}
            <a
              href="mailto:info@thestreetlamp.com"
              className="text-[#FFBA94] font-medium underline underline-offset-2 hover:no-underline transition-all"
            >
              Get in touch
            </a>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 pb-16 sm:pb-20 md:grid-cols-3 md:gap-6 lg:gap-8 md:pb-24">
          {groups.map((group) => {
            const Icon = groupIcons[group.title] ?? Lamp
            return (
              <section
                key={group.title}
                className="rounded-2xl border border-[#ffba94]/15 bg-[#201c1c]/55 p-6 shadow-sm transition-shadow hover:shadow-md sm:rounded-3xl sm:p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#ffba94]/20 bg-[#ffba94]/10 text-[#FFBA94]">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#FFBA94] tracking-tight">
                    {group.title}
                  </h3>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {group.items.map((item, idx) => (
                    <AccordionItem
                      key={item.question}
                      value={`${group.title}-${idx}`}
                      className={cn(
                        'border-0 border-b border-[#FFBA94]/20 last:border-0',
                        'py-4 first:pt-0 last:pb-0'
                      )}
                    >
                      <AccordionTrigger
                        className={cn(
                          'py-0 hover:no-underline group text-[#FFBA94]',
                          '[&[data-state=open]]:text-[#FFBA94] [&[data-state=open]]:font-medium',
                          'text-left text-[15px] sm:text-base',
                          'hover:text-[#FFBA94]/90 transition-colors [&>svg]:text-[#FFBA94]'
                        )}
                      >
                        <span className="pr-4 leading-snug">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-[#FFBA94]/90 text-sm sm:text-[15px] leading-relaxed pt-2 pb-0">
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
