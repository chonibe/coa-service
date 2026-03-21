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
          <h2 className="mb-2 font-serif text-2xl font-medium tracking-tight text-[#FFBA94] sm:text-3xl md:text-4xl">
            {title}
          </h2>
          <p className="text-sm leading-snug text-[#FFBA94]/80 sm:text-base">
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

        <div className="grid grid-cols-1 gap-5 pb-10 sm:pb-12 md:grid-cols-3 md:gap-5 md:pb-14 lg:gap-6">
          {groups.map((group) => {
            const Icon = groupIcons[group.title] ?? Lamp
            return (
              <section
                key={group.title}
                className="rounded-xl bg-[#201c1c]/55 p-4 sm:rounded-2xl sm:p-5"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffba94]/10 text-[#FFBA94]">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight text-[#FFBA94] sm:text-lg">
                    {group.title}
                  </h3>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {group.items.map((item, idx) => (
                    <AccordionItem
                      key={item.question}
                      value={`${group.title}-${idx}`}
                      className={cn(
                        'border-0',
                        'py-3.5 first:pt-0 last:pb-0 sm:py-4'
                      )}
                    >
                      <AccordionTrigger
                        className={cn(
                          'gap-2 py-0 hover:no-underline group text-[#FFBA94]',
                          '[&[data-state=open]]:text-[#FFBA94] [&[data-state=open]]:font-medium',
                          'text-left text-sm sm:text-[15px]',
                          'hover:text-[#FFBA94]/90 transition-colors [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-[#FFBA94]'
                        )}
                      >
                        <span className="pr-2 leading-snug">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pt-1.5 text-xs leading-snug text-[#FFBA94]/90 sm:text-sm">
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
