'use client'

import { useEffect, useState, useCallback } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Inbox - Messages — Phase 2.7
//
// API: /api/vendor/messages
// Render: Thread list with avatar, last message preview, timestamp, unread badge
// Tap thread: Opens thread detail
// Old source: app/vendor/dashboard/messages/page.tsx
// ============================================================================

const inboxTabs: SubTab[] = [
  { id: 'messages', label: 'Messages', href: '/vendor/inbox' },
  { id: 'notifications', label: 'Notifications', href: '/vendor/inbox/notifications' },
]

interface MessageThread {
  id: string
  collectorName: string
  collectorAvatar?: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function VendorInboxPage() {
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/vendor/messages', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        setThreads(
          (json.threads || json.messages || []).map((t: any) => ({
            id: t.id || t.thread_id,
            collectorName: t.collector_name || t.collectorName || t.name || 'Unknown',
            collectorAvatar: t.collector_avatar || t.collectorAvatar || t.avatar_url || null,
            lastMessage: t.last_message || t.lastMessage || t.preview || '',
            lastMessageAt: t.last_message_at || t.lastMessageAt || t.updated_at || '',
            unreadCount: t.unread_count || t.unreadCount || 0,
          }))
        )
      }
    } catch (err) {
      console.error('[Messages] Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    // Poll every 30 seconds
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  const filtered = searchQuery
    ? threads.filter((t) => t.collectorName.toLowerCase().includes(searchQuery.toLowerCase()))
    : threads

  return (
    <div>
      <SubTabBar tabs={inboxTabs} />

      <div className="px-4 py-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-impact-block-sm text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-impact-primary/20"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto">
            <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-3">
              {searchQuery ? 'No matches' : 'Your inbox'}
            </p>
            <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em] mb-3">
              {searchQuery ? 'Nothing matches that search.' : 'No messages yet.'}
            </h3>
            <p className="font-body text-sm text-[#1a1a1a]/60 leading-relaxed">
              {searchQuery
                ? 'Try a different name or clear the search to see every conversation.'
                : 'When a collector reaches out about one of your pieces, their conversation will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-impact-block-sm transition-colors cursor-pointer',
                  'hover:bg-gray-50 active:bg-gray-100',
                  thread.unreadCount > 0 ? 'bg-blue-50/50' : 'bg-white'
                )}
              >
                {/* Avatar */}
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0">
                  {thread.collectorAvatar ? (
                    <img
                      src={thread.collectorAvatar}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-600 font-body">
                      {thread.collectorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {thread.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-impact-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      'text-sm font-body truncate',
                      thread.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                    )}>
                      {thread.collectorName}
                    </p>
                    <span className="text-[10px] text-gray-400 font-body shrink-0 ml-2">
                      {formatRelativeTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs font-body truncate mt-0.5',
                    thread.unreadCount > 0 ? 'text-gray-700' : 'text-gray-500'
                  )}>
                    {thread.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
