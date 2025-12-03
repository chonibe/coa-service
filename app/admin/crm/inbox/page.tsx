"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Loader2, MessageSquare, Mail, Instagram, Send, Facebook, MessageCircle, 
  ShoppingBag, Search, Filter, MoreVertical, Tag, User, Building2,
  ChevronRight, Star, Archive, CheckCircle2, Clock, XCircle
} from "lucide-react"
import { PlatformBadge } from "@/components/crm/platform-badge"
import { EmptyState } from "@/components/crm/empty-state"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Conversation {
  id: string
  customer_id: string
  platform: "email" | "instagram" | "facebook" | "whatsapp" | "shopify"
  status: "open" | "closed" | "pending" | "resolved"
  last_message_at: string
  tags?: string[]
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
  }
  last_message?: {
    content: string
    direction: "inbound" | "outbound"
    created_at: string
  }
}

interface Message {
  id: string
  conversation_id: string
  direction: "inbound" | "outbound"
  content: string
  created_at: string
  metadata?: {
    subject?: string
    from?: string
    to?: string
    html?: string
    attachments?: Array<{
      filename: string
      url: string
      size: number
    }>
  }
  thread_id?: string
  parent_message_id?: string
}

function InboxContent() {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"recent" | "unread" | "starred">("recent")

  const platform = searchParams.get("platform") as "email" | "instagram" | "facebook" | "whatsapp" | "shopify" | null
  const status = searchParams.get("status") as "open" | "closed" | "pending" | "resolved" | null

  useEffect(() => {
    async function fetchConversations() {
      try {
        setIsLoading(true)
        setError(null)

        let url = "/api/crm/conversations?limit=100"
        if (platform || platformFilter !== "all") {
          url += `&platform=${platform || platformFilter}`
        }
        if (status || statusFilter !== "all") {
          url += `&status=${status || statusFilter}`
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
        if (sortBy === "unread") {
          convs = convs.sort((a: Conversation, b: Conversation) => 
            (b.unread_count || 0) - (a.unread_count || 0)
          )
        } else if (sortBy === "starred") {
          convs = convs.sort((a: Conversation, b: Conversation) => 
            (b.is_starred ? 1 : 0) - (a.is_starred ? 1 : 0)
          )
        } else {
          convs = convs.sort((a: Conversation, b: Conversation) => 
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          )
        }
        
        setConversations(convs)
      } catch (err: any) {
        console.error("Error fetching conversations:", err)
        setError(err.message || "Failed to load conversations")
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [platform, status, searchQuery, statusFilter, platformFilter, sortBy])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-3 w-3 text-orange-500" />
      case "resolved":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />
      case "closed":
        return <Archive className="h-3 w-3 text-gray-500" />
      default:
        return <XCircle className="h-3 w-3 text-yellow-500" />
    }
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)]">
        <div className="w-80 border-r bg-muted/30 p-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-xs">!</span>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background">
      {/* Left Panel: Conversation List */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        {/* Search and Filters */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="shopify">Shopify</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setSortBy("recent")}
            >
              Recent
            </Button>
            <Button
              variant={sortBy === "unread" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setSortBy("unread")}
            >
              Unread
            </Button>
            <Button
              variant={sortBy === "starred" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setSortBy("starred")}
            >
              Starred
            </Button>
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState type="inbox" />
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedConversation === conv.id ? "bg-muted border-l-4 border-l-blue-500" : ""
                  }`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PlatformBadge platform={conv.platform} variant="outline" className="text-xs" />
                        {conv.is_starred && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                        <span className="font-medium text-sm truncate">
                          {conv.customer?.first_name && conv.customer?.last_name
                            ? `${conv.customer.first_name} ${conv.customer.last_name}`
                            : conv.customer?.email || conv.customer?.instagram_username || "Unknown"}
                        </span>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {conv.last_message.content}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {getStatusIcon(conv.status)}
                        <span>{formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}</span>
                        {conv.tags && conv.tags.length > 0 && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <div className="flex gap-1">
                              {conv.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Middle Panel: Message Thread */}
      <div className="flex-1 flex flex-col border-r">
        {selectedConversation ? (
          <MessageThreadView conversationId={selectedConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Contact Details */}
      {selectedConversation && (
        <ContactSidebar conversationId={selectedConversation} />
      )}
    </div>
  )
}

function MessageThreadView({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        
        // Fetch conversation details
        const convRes = await fetch(`/api/crm/conversations?conversation_id=${conversationId}`)
        if (convRes.ok) {
          const convData = await convRes.json()
          setConversation(convData.conversations?.[0] || null)
        }
        
        // Fetch messages
        const msgRes = await fetch(`/api/crm/messages?conversation_id=${conversationId}`)
        if (!msgRes.ok) {
          throw new Error("Failed to fetch messages")
        }
        const msgData = await msgRes.json()
        setMessages(msgData.messages || [])
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [conversationId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

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
      const msgRes = await fetch(`/api/crm/messages?conversation_id=${conversationId}`)
      if (msgRes.ok) {
        const data = await msgRes.json()
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
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {conversation && (
              <>
                <PlatformBadge platform={conversation.platform} />
                <div>
                  <h3 className="font-semibold">
                    {conversation.customer?.first_name && conversation.customer?.last_name
                      ? `${conversation.customer.first_name} ${conversation.customer.last_name}`
                      : conversation.customer?.email || conversation.customer?.instagram_username || "Unknown"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {conversation.customer?.email || conversation.customer?.instagram_username}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={conversation?.status === "open" ? "default" : "secondary"}>
              {conversation?.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Star className="mr-2 h-4 w-4" />
                  {conversation?.is_starred ? "Unstar" : "Star"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Tag className="mr-2 h-4 w-4" />
                  Add Tag
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.direction === "outbound" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.direction === "outbound"
                      ? "bg-blue-600 text-white"
                      : "bg-muted"
                  }`}
                >
                  {msg.metadata?.subject && (
                    <div className="font-semibold mb-2 text-sm">
                      {msg.metadata.subject}
                    </div>
                  )}
                  <div
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={
                      msg.metadata?.html
                        ? { __html: msg.metadata.html }
                        : undefined
                    }
                  >
                    {!msg.metadata?.html && <p>{msg.content}</p>}
                  </div>
                  <div className="text-xs opacity-70 mt-2">
                    {format(new Date(msg.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply Box */}
      <div className="p-4 border-t bg-background">
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
            className="flex-1 min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || isSending}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
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

function ContactSidebar({ conversationId }: { conversationId: string }) {
  const [customer, setCustomer] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCustomer() {
      try {
        setIsLoading(true)
        const convRes = await fetch(`/api/crm/conversations?conversation_id=${conversationId}`)
        if (convRes.ok) {
          const convData = await convRes.json()
          const conversation = convData.conversations?.[0]
          if (conversation?.customer_id) {
            const customerRes = await fetch(`/api/crm/people/${conversation.customer_id}`)
            if (customerRes.ok) {
              const customerData = await customerRes.json()
              setCustomer(customerData.person)
            }
          }
        }
      } catch (err) {
        console.error("Error fetching customer:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomer()
  }, [conversationId])

  if (isLoading) {
    return (
      <div className="w-80 border-l bg-muted/30 p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="w-80 border-l bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">No customer data</p>
      </div>
    )
  }

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-4">Contact Details</h3>
        <Link href={`/admin/crm/people/${customer.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            View Full Profile
          </Button>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Contact Info</h4>
            <div className="space-y-2 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {customer.total_orders && customer.total_orders > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Order History</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-medium">{customer.total_orders}</span>
                </div>
                {customer.total_spent && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Spent</span>
                    <span className="font-medium">
                      ${parseFloat(customer.total_spent.toString()).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {customer.tags && customer.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default function InboxPage() {
  return (
    <div className="h-full">
      <div className="p-6 border-b bg-background">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Inbox
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage conversations across all platforms
        </p>
      </div>

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
