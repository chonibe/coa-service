'use client'

import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { openTawkChat } from '@/lib/tawk'

export type ShopChatButtonProps = {
  className?: string
  /** Experience dark header uses peach-tinted icon colors. */
  variant?: 'default' | 'experience'
}

export function ShopChatButton({ className, variant = 'default' }: ShopChatButtonProps) {
  return (
    <button
      type="button"
      onClick={openTawkChat}
      aria-label="Open chat"
      className={cn(
        'inline-flex items-center justify-center p-2 -m-2 transition-colors cursor-pointer shrink-0',
        variant === 'experience'
          ? 'text-muted-foreground hover:text-foreground'
          : 'text-muted-foreground hover:text-experience-highlight',
        className
      )}
    >
      <MessageCircle size={22} className="shrink-0" aria-hidden />
    </button>
  )
}
