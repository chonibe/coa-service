'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Scrolling Announcement Bar
 * 
 * A marquee-style announcement bar matching the Shopify Impact theme.
 * Displays multiple messages in a continuous horizontal scroll.
 * 
 * @example
 * <ScrollingAnnouncementBar
 *   messages={['Support Local Artists', 'Worldwide Delivery', 'Limited Editions']}
 * />
 */

export interface ScrollingAnnouncementBarProps {
  /** Array of messages to display in the marquee */
  messages: string[]
  /** Separator between messages (default: bullet) */
  separator?: string
  /** Animation speed in seconds for one full cycle (default: 30) */
  speed?: number
  /** Background color (default: #390000 - Impact theme maroon) */
  backgroundColor?: string
  /** Text color (default: #ffba94 - Impact theme accent) */
  textColor?: string
  /** Additional CSS classes */
  className?: string
  /** Whether the bar is visible */
  visible?: boolean
}

export function ScrollingAnnouncementBar({
  messages,
  separator = '•',
  speed = 30,
  backgroundColor = '#390000',
  textColor = '#ffba94',
  className,
  visible = true,
}: ScrollingAnnouncementBarProps) {
  if (!visible || messages.length === 0) return null

  // Create the message string with separators
  const messageString = messages.join(` ${separator} `)
  
  // Repeat the message to ensure seamless loop
  const repeatCount = 10

  // Calculate animation translate percentage
  const translatePercent = 100 / repeatCount * 2

  return (
    <div
      className={cn(
        'relative overflow-hidden py-2.5',
        className
      )}
      style={{ backgroundColor }}
      aria-label="Announcements"
    >
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `marquee ${speed}s linear infinite`,
        }}
      >
        {/* Keyframe animation via inline style tag */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-${translatePercent}%); }
            }
          `
        }} />
        {/* Render repeated messages for seamless loop */}
        {Array.from({ length: repeatCount }).map((_, index) => (
          <span
            key={index}
            className="inline-flex items-center text-sm font-medium tracking-wide"
            style={{ color: textColor }}
          >
            {messages.map((message, msgIndex) => (
              <React.Fragment key={`${index}-${msgIndex}`}>
                <span className="px-4">{message}</span>
                {msgIndex < messages.length - 1 && (
                  <span className="px-2 opacity-60">{separator}</span>
                )}
              </React.Fragment>
            ))}
            {/* Add separator after each full message set */}
            <span className="px-2 opacity-60">{separator}</span>
          </span>
        ))}
      </div>

    </div>
  )
}

/**
 * Default announcement messages matching the live site
 */
export const defaultAnnouncementMessages = [
  'Support Local Artists',
  'Worldwide Delivery',
  'Limited Editions',
  'One lamp - Endless Inspiration',
]

export default ScrollingAnnouncementBar
