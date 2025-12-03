"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Mail, Instagram, Send, Facebook, MessageCircle, ShoppingBag } from "lucide-react"
import { PlatformBadge } from "@/components/crm/platform-badge"
import Link from "next/link"

interface Conversation {
  id: string
  customer_id: string
  platform: "email" | "instagram" | "facebook" | "whatsapp" | "shopify"
  status: "open" | "closed" | "pending" | "resolved"
  last_message_at: string
  customer?: {
    email: string | null
    first_name: string | null
    last_name: string | null
    instagram_username: string | null
  }
  last_message?: {
    content: string
    direction: "inbound" | "outbound"
    created_at: string
  }
}

function InboxContent() {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

  const platform = searchParams.get("platform") as "email" | "instagram" | "facebook" | "whatsapp" | "shopify" | null
  const status = searchParams.get("status") as "open" | "closed" | "pending" | "resolved" | null

  useEffect(() => {
    async function fetchConversations() {
      try {
        setIsLoading(true)
        setError(null)

        let url = "/api/crm/conversations?limit=100"
        if (platform) {
          url += `&platform=${platform}`
        }
        if (status) {
          url += `&status=${status}`
        }

        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`Failed to fetch conversations: ${res.statusText}`)
        }

        const data = await res.json()
        setConversations(data.conversations || [])
      } catch (err: any) {
        console.error("Error fetching conversations:", err)
        setError(err.message || "Failed to load conversations")
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [platform, status])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>
            {platform ? `${platform.charAt(0).toUpperCase() + platform.slice(1)} ` : ""}
            {status ? `${status} ` : ""}
            conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversations found</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-muted ${
                    selectedConversation === conv.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                              <PlatformBadge platform={conv.platform} variant="outline" className="text-xs" />
                              <span className="font-medium">
                                {conv.customer?.first_name || conv.customer?.email || conv.customer?.instagram_username || "Unknown"}
                              </span>
                              <Badge variant={conv.status === "open" ? "default" : "secondary"}>
                                {conv.status}
                              </Badge>
                            </div>
                      {conv.last_message && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {conv.last_message.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.last_message_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedConversation && (
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Conversation details</CardDescription>
          </CardHeader>
          <CardContent>
            <ConversationMessages conversationId={selectedConversation} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ConversationMessages({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    async function fetchMessages() {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/crm/messages?conversation_id=${conversationId}`)
        if (!res.ok) {
          throw new Error("Failed to fetch messages")
        }
        const data = await res.json()
        setMessages(data.messages || [])
      } catch (err) {
        console.error("Error fetching messages:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [conversationId])

  const handleSendReply = async () => {
    if (!replyText.trim()) return

    try {
      setIsSending(true)
      const res = await fetch("/api/crm/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: replyText,
          direction: "outbound",
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to send message")
      }

      setReplyText("")
      // Refresh messages
      const messagesRes = await fetch(`/api/crm/messages?conversation_id=${conversationId}`)
      if (messagesRes.ok) {
        const data = await messagesRes.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Error sending message:", err)
      alert("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-2 overflow-y-auto max-h-96 mb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg ${
                msg.direction === "outbound" 
                  ? "bg-blue-50 dark:bg-blue-950/20 ml-8" 
                  : "bg-gray-50 dark:bg-gray-900 mr-8"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {msg.direction === "outbound" ? (
                  <Send className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-xs font-medium">
                  {msg.direction === "outbound" ? "You" : "Customer"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}
      </div>
      
      {/* Reply Box */}
      <div className="border-t pt-4">
        <div className="flex gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSendReply()
              }
            }}
            placeholder="Type your reply... (Cmd+Enter to send)"
            className="flex-1 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function FilterButtons() {
  const searchParams = useSearchParams()
  const platform = searchParams.get("platform")

  return (
    <div className="mb-4 flex gap-2">
      <Link href="/admin/crm/inbox">
        <Button variant={!platform ? "default" : "outline"}>
          All
        </Button>
      </Link>
      <Link href="/admin/crm/inbox?platform=email">
        <Button variant={platform === "email" ? "default" : "outline"}>
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
      </Link>
            <Link href="/admin/crm/inbox?platform=instagram">
              <Button variant={platform === "instagram" ? "default" : "outline"}>
                <Instagram className="mr-2 h-4 w-4" />
                Instagram
              </Button>
            </Link>
            <Link href="/admin/crm/inbox?platform=facebook">
              <Button variant={platform === "facebook" ? "default" : "outline"}>
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
            </Link>
            <Link href="/admin/crm/inbox?platform=whatsapp">
              <Button variant={platform === "whatsapp" ? "default" : "outline"}>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </Link>
            <Link href="/admin/crm/inbox?platform=shopify">
              <Button variant={platform === "shopify" ? "default" : "outline"}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Shopify
              </Button>
            </Link>
    </div>
  )
}

export default function InboxPage() {
  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">CRM Inbox</h1>
        <p className="text-muted-foreground mt-2">
          Manage customer conversations across Email and Instagram
        </p>
      </div>

      <Suspense fallback={
        <div className="mb-4 flex gap-2">
          <Button variant="outline" disabled>All</Button>
          <Button variant="outline" disabled>Email</Button>
          <Button variant="outline" disabled>Instagram</Button>
        </div>
      }>
        <FilterButtons />
      </Suspense>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <InboxContent />
      </Suspense>
    </div>
  )
}
