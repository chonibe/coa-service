"use client"

import { useState, useEffect } from "react"
import { ConversationList, Conversation } from "./conversation-list"
import { MessageThreadView } from "./message-thread-view"
import { FilterBar } from "./filter-bar"
import { SortDropdown, SortOption } from "./sort-dropdown"
import { EnrichmentPanel } from "./enrichment-panel"
import { TagsPanel } from "./tags-panel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface AttioInboxProps {
  initialPlatform?: string
  initialStatus?: string
  className?: string
}

export function AttioInbox({
  initialPlatform,
  initialStatus,
  className = "",
}: AttioInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState(initialPlatform || "all")
  const [statusFilter, setStatusFilter] = useState(initialStatus || "all")
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("recent")

  // Auto-sync Gmail on component mount if needed
  useEffect(() => {
    async function checkAndSync() {
      try {
        // Check if sync is needed (only for email platform)
        if (platformFilter === "email" || platformFilter === "all") {
          const statusRes = await fetch("/api/crm/check-sync-status")
          if (statusRes.ok) {
            const statusData = await statusRes.json()
            if (statusData.needsSync) {
              // Trigger sync silently in background
              console.log("[Inbox] Auto-syncing Gmail...")
              fetch("/api/crm/sync-gmail", { method: "POST" }).catch((err) => {
                console.error("[Inbox] Auto-sync error:", err)
                // Silently fail - don't show error to user
              })
            }
          }
        }
      } catch (err) {
        // Silently fail - don't block inbox load
        console.error("[Inbox] Error checking sync status:", err)
      }
    }

    checkAndSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let url = "/api/crm/conversations?limit=100"
      
      if (platformFilter !== "all") {
        url += `&platform=${platformFilter}`
      }
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`
      }
      if (unreadOnly) {
        url += `&unread_only=true`
      }
      if (starredOnly) {
        url += `&is_starred=true`
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to fetch conversations: ${res.statusText}`)
      }

      const data = await res.json()
      let convs = data.conversations || []

      // Apply sorting
      convs = sortConversations(convs, sortBy)

      setConversations(convs)

      // Auto-select first conversation if none selected
      if (!selectedConversationId && convs.length > 0) {
        setSelectedConversationId(convs[0].id)
      }
    } catch (err: any) {
      console.error("Error fetching conversations:", err)
      setError(err.message || "Failed to load conversations")
    } finally {
      setIsLoading(false)
    }
  }

  const sortConversations = (convs: Conversation[], sort: SortOption): Conversation[] => {
    const sorted = [...convs]

    switch (sort) {
      case "recent":
        return sorted.sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        )
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.last_message_at).getTime() - new Date(b.last_message_at).getTime()
        )
      case "unread":
        return sorted.sort(
          (a, b) => (b.unread_count || 0) - (a.unread_count || 0)
        )
      case "starred":
        return sorted.sort((a, b) => (b.is_starred ? 1 : 0) - (a.is_starred ? 1 : 0))
      case "customer_name":
        return sorted.sort((a, b) => {
          const nameA = getCustomerName(a.customer).toLowerCase()
          const nameB = getCustomerName(b.customer).toLowerCase()
          return nameA.localeCompare(nameB)
        })
      case "last_message":
        return sorted.sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        )
      default:
        return sorted
    }
  }

  const getCustomerName = (customer: Conversation["customer"]) => {
    if (!customer) return "Unknown"
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
    }
    return customer.email || customer.instagram_username || "Unknown"
  }

  useEffect(() => {
    fetchConversations()

    // Poll for new conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [platformFilter, statusFilter, unreadOnly, starredOnly, searchQuery, sortBy])

  // Re-sort when sortBy changes
  useEffect(() => {
    if (conversations.length > 0) {
      const sorted = sortConversations(conversations, sortBy)
      setConversations(sorted)
    }
  }, [sortBy])

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Left Panel: Conversation List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Header with sort */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
          <SortDropdown value={sortBy} onValueChange={setSortBy} />
        </div>

        {/* Filters */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          platformFilter={platformFilter}
          onPlatformFilterChange={setPlatformFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          unreadOnly={unreadOnly}
          onUnreadOnlyChange={setUnreadOnly}
          starredOnly={starredOnly}
          onStarredOnlyChange={setStarredOnly}
        />

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-gray-500">Loading conversations...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={fetchConversations}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
            />
          )}
        </ScrollArea>
      </div>

      {/* Middle Panel: Message Thread */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {selectedConversationId ? (
          <MessageThreadView conversationId={selectedConversationId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Enrichment & Tags */}
      {selectedConversationId && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <Tabs defaultValue="enrichment" className="flex flex-col h-full">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="enrichment" className="flex-1">
                Contact
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex-1">
                Tags
              </TabsTrigger>
            </TabsList>
            <TabsContent value="enrichment" className="flex-1 overflow-auto px-4 pb-4">
              <ScrollArea className="h-full">
                {(() => {
                  const selectedConv = conversations.find(
                    (c) => c.id === selectedConversationId
                  )
                  if (selectedConv?.customer) {
                    return <EnrichmentPanel customer={selectedConv.customer} />
                  }
                  return (
                    <div className="text-sm text-gray-500 py-8 text-center">
                      No customer data available
                    </div>
                  )
                })()}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="tags" className="flex-1 overflow-auto px-4 pb-4">
              <ScrollArea className="h-full">
                <TagsPanel
                  conversationId={selectedConversationId}
                  onTagAdded={() => {
                    // Refresh conversations to show updated tags
                    fetchConversations()
                  }}
                  onTagRemoved={() => {
                    // Refresh conversations to show updated tags
                    fetchConversations()
                  }}
                />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

