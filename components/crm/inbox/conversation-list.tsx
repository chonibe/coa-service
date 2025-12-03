"use client"

import { formatDistanceToNow } from "date-fns"
import { Star, Mail, MessageSquare, User, Building2, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PlatformBadge } from "@/components/crm/platform-badge"
import { cn } from "@/lib/utils"

export interface ConversationTag {
  id: string
  name: string
  color: string
}

export interface EnrichmentData {
  company?: string
  job_title?: string
  linkedin?: string
  twitter?: string
  profile_picture?: string
  location?: string
}

export interface Conversation {
  id: string
  customer_id: string
  platform: "email" | "instagram" | "facebook" | "whatsapp" | "shopify"
  status: "open" | "closed" | "pending" | "resolved"
  last_message_at: string
  tags?: ConversationTag[]
  is_starred?: boolean
  unread_count?: number
  customer?: {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
    instagram_username: string | null
    total_orders: number | null
    total_spent: number | null
    enrichment_data?: EnrichmentData
  }
  last_message?: {
    content: string
    direction: "inbound" | "outbound"
    created_at: string
  }
}

export interface ConversationListProps {
  conversations: Conversation[]
  selectedConversationId?: string | null
  onSelectConversation: (conversationId: string) => void
  className?: string
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  className = "",
}: ConversationListProps) {
  const getInitials = (customer: Conversation["customer"]) => {
    if (!customer) return "?"
    const firstName = customer.first_name || ""
    const lastName = customer.last_name || ""
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?"
    }
    if (customer.email) {
      return customer.email.charAt(0).toUpperCase()
    }
    return "?"
  }

  const getCustomerName = (customer: Conversation["customer"]) => {
    if (!customer) return "Unknown"
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
    }
    return customer.email || customer.instagram_username || "Unknown"
  }

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
        <p className="text-sm">No conversations found</p>
      </div>
    )
  }

  return (
    <div className={cn("divide-y divide-gray-100", className)}>
      {conversations.map((conversation) => {
        const isSelected = selectedConversationId === conversation.id
        const hasUnread = (conversation.unread_count || 0) > 0
        const customerName = getCustomerName(conversation.customer)
        const initials = getInitials(conversation.customer)
        const profilePicture = conversation.customer?.enrichment_data?.profile_picture

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={cn(
              "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors relative",
              isSelected && "bg-blue-50 border-l-4 border-blue-500",
              hasUnread && "bg-blue-50/30"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Avatar className="h-10 w-10 flex-shrink-0">
                {profilePicture ? (
                  <img src={profilePicture} alt={customerName} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={cn(
                        "font-medium text-sm truncate",
                        hasUnread ? "text-gray-900 font-semibold" : "text-gray-700"
                      )}
                    >
                      {customerName}
                    </span>
                    {conversation.is_starred && (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasUnread && (
                      <Badge
                        variant="default"
                        className="h-5 min-w-5 px-1.5 text-xs bg-blue-500"
                      >
                        {conversation.unread_count}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                {/* Customer info */}
                <div className="flex items-center gap-2 mb-1">
                  <PlatformBadge platform={conversation.platform} />
                  {conversation.customer?.enrichment_data?.company && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {conversation.customer.enrichment_data.company}
                    </span>
                  )}
                  {conversation.customer?.enrichment_data?.job_title && (
                    <span className="text-xs text-gray-500">
                      {conversation.customer.enrichment_data.job_title}
                    </span>
                  )}
                </div>

                {/* Last message preview */}
                {conversation.last_message && (
                  <div className="text-xs text-gray-600 truncate mb-1">
                    {conversation.last_message.direction === "inbound" ? (
                      <span className="text-gray-500">From: </span>
                    ) : (
                      <span className="text-gray-500">You: </span>
                    )}
                    {truncateText(conversation.last_message.content)}
                  </div>
                )}

                {/* Tags */}
                {conversation.tags && conversation.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    {conversation.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs h-5 px-1.5"
                        style={{
                          borderColor: tag.color,
                          color: tag.color,
                          backgroundColor: `${tag.color}10`,
                        }}
                      >
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                    {conversation.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{conversation.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

