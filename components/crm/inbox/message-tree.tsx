"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, MessageSquare } from "lucide-react"
import { MessageCard, MessageCardProps } from "./message-card"
import { cn } from "@/lib/utils"

export interface ThreadedMessage {
  id: string
  conversation_id: string
  direction: "inbound" | "outbound"
  content: string
  created_at: string
  metadata?: {
    subject?: string
    from?: string
    to?: string
    cc?: string
    bcc?: string
    html?: string
    attachments?: Array<{
      filename: string
      url: string
      size: number
      content_type?: string
    }>
  }
  thread_id?: string
  parent_message_id?: string
  thread_depth?: number
  thread_order?: number
  children?: ThreadedMessage[]
  is_unread?: boolean
}

export interface MessageTreeProps {
  messages: ThreadedMessage[]
  onReply?: (messageId: string) => void
  className?: string
}

/**
 * Message Tree Component
 * Displays threaded messages in a tree hierarchy with collapsible threads
 */
export function MessageTree({ messages, onReply, className = "" }: MessageTreeProps) {
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set())

  const toggleThread = (messageId: string) => {
    const newCollapsed = new Set(collapsedThreads)
    if (newCollapsed.has(messageId)) {
      newCollapsed.delete(messageId)
    } else {
      newCollapsed.add(messageId)
    }
    setCollapsedThreads(newCollapsed)
  }

  const renderMessage = (message: ThreadedMessage, depth: number = 0) => {
    const hasChildren = message.children && message.children.length > 0
    const isCollapsed = collapsedThreads.has(message.id)
    const threadDepth = message.thread_depth ?? depth

    return (
      <div key={message.id} className="relative">
        {/* Thread connector line */}
        {threadDepth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"
            style={{ left: `${threadDepth * 24 - 12}px` }}
          />
        )}

        <div
          className={cn(
            "relative",
            threadDepth > 0 && "ml-6 border-l-2 border-gray-100 pl-4"
          )}
        >
          {/* Message card */}
          <MessageCard
            message={{
              ...message,
              thread_depth: threadDepth,
            }}
            onReply={onReply}
            showThreadIndicator={threadDepth > 0}
          />

          {/* Children */}
          {hasChildren && (
            <div className="mt-0">
              {!isCollapsed ? (
                <div className="space-y-0">
                  {message.children!.map((child) => renderMessage(child, depth + 1))}
                </div>
              ) : (
                <button
                  onClick={() => toggleThread(message.id)}
                  className="ml-4 mt-2 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>{message.children!.length} more message{message.children!.length !== 1 ? 's' : ''}</span>
                </button>
              )}
            </div>
          )}

          {/* Expand/collapse button for threads */}
          {hasChildren && (
            <button
              onClick={() => toggleThread(message.id)}
              className="absolute left-0 top-3 -ml-6 flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 transition-colors"
              style={{ left: `${threadDepth * 24 - 12}px` }}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
        <p className="text-sm">No messages in this thread</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-0", className)}>
      {messages.map((message) => renderMessage(message))}
    </div>
  )
}

