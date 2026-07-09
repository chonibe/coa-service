'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  experienceV3ArtworkInfoTabs,
  type ExperienceV3ProductInfoTab,
} from '@/content/experience-v3-product-info'
import { getStorePageContent } from '@/lib/content/site-content'

const experienceV3Content = getStorePageContent('experienceV3')

export function ExperienceV3ProductInfoTabs({ className }: { className?: string }) {
  const [activeId, setActiveId] = useState(experienceV3ArtworkInfoTabs[0]?.id ?? 'materials')
  const active =
    experienceV3ArtworkInfoTabs.find((t) => t.id === activeId) ?? experienceV3ArtworkInfoTabs[0]

  if (!active) return null

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-experience-surface/60',
        className
      )}
    >
      <div
        role="tablist"
        aria-label={experienceV3Content.infoTabs.ariaLabel}
        className="touch-pan-x flex gap-0.5 overflow-x-auto border-b border-border px-2 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {experienceV3ArtworkInfoTabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            selected={tab.id === activeId}
            onSelect={() => setActiveId(tab.id)}
          />
        ))}
      </div>
      <TabPanel tab={active} />
      <p className="border-t border-border px-3.5 py-2.5 text-center text-[10px] text-muted-foreground">
        <Link
          href="/shop/faq"
          className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {experienceV3Content.infoTabs.faqCta}
        </Link>
      </p>
    </div>
  )
}

function TabButton({
  tab,
  selected,
  onSelect,
}: {
  tab: ExperienceV3ProductInfoTab
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`experience-v3-info-tab-${tab.id}`}
      aria-selected={selected}
      aria-controls={`experience-v3-info-panel-${tab.id}`}
      onClick={onSelect}
      className={cn(
        'shrink-0 rounded-t-md px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
        selected
          ? 'bg-muted text-experience-highlight'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {tab.label}
    </button>
  )
}

function TabPanel({ tab }: { tab: ExperienceV3ProductInfoTab }) {
  return (
    <div
      role="tabpanel"
      id={`experience-v3-info-panel-${tab.id}`}
      aria-labelledby={`experience-v3-info-tab-${tab.id}`}
      className="px-3.5 py-3.5"
    >
      <div className="space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
        {tab.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {tab.bullets && tab.bullets.length > 0 ? (
          <ul className="space-y-1.5">
            {tab.bullets.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-experience-highlight/50" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
