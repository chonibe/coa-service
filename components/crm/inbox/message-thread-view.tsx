"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Loader2 } from "lucide-react"


import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageTree, ThreadedMessage } from "./message-tree"
import { useToast } from "@/hooks/use-toast"

import { Button, Textarea } from "@/components/ui"
export interface MessageThreadViewProps {
  conversationId: string
  className?: string
}

export function MessageThreadView({
  conversationId,
  className = "",
}: MessageThreadViewProps) {
  const [messages, setMessages] = useState<ThreadedMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fetch messages with thread hierarchy
  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/crm/messages/thread?conversation_id=${conversationId}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err: any) {
      console.error("Error fetching messages:", err)
      setError(err.message || "Failed to load messages")
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (conversationId) {
      fetchMessages()

      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [conversationId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) {
      // Focus reply textarea
      return
    }

    try {
      setIsSending(true)

      const response = await fetch("/api/crm/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: replyText,
          direction: "outbound",
          metadata: {
            parent_message_id: messageId,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setReplyText("")
      await fetchMessages()

      toast({
        title: "Message sent",
        description: "Your reply has been sent successfully",
      })
    } catch (err: any) {
      console.error("Error sending message:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSendReply = () => {
    if (!replyText.trim() || isSending) return

    // Find the last message ID to reply to
    const lastMessage = findLastMessage(messages)
    if (lastMessage) {
      handleReply(lastMessage.id)
    } else {
      // If no messages, create a new message
      handleReply("")
    }
  }

  const findLastMessage = (msgs: ThreadedMessage[]): ThreadedMessage | null => {
    if (msgs.length === 0) return null

    const lastRoot = msgs[msgs.length - 1]
    if (lastRoot.children && lastRoot.children.length > 0) {
      return findLastMessage(lastRoot.children)
    }
    return lastRoot
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchMessages} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <MessageTree messages={messages} onReply={handleReply} />
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply box */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSendReply()
              }
            }}
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || isSending}
            className="self-end"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Cmd/Ctrl + Enter to send
        </p>
      </div>
    </div>
  )
}

