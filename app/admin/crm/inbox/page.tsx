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
              conversations.map((conv) => {
                // Get contact name prominently
                const contactName = conv.customer?.first_name && conv.customer?.last_name
                  ? `${conv.customer.first_name} ${conv.customer.last_name}`
                  : conv.customer?.email || conv.customer?.instagram_username || "Unknown Contact"
                
                // Get email subject from last message if available
                const emailSubject = (conv.last_message as any)?.metadata?.subject
                
                return (
                  <div
                    key={conv.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation === conv.id ? "bg-muted border-l-4 border-l-blue-500" : ""
                    }`}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                          {contactName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Contact Name - Prominent */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {contactName}
                          </span>
                          {conv.is_starred && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />}
                          {conv.unread_count && conv.unread_count > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs flex-shrink-0">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Email Subject or Preview */}
                        {emailSubject ? (
                          <p className="text-xs font-medium text-foreground mb-1 truncate">
                            {emailSubject}
                          </p>
                        ) : conv.last_message && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                            {conv.last_message.content}
                          </p>
                        )}
                        
                        {/* Metadata Row */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <PlatformBadge platform={conv.platform} variant="outline" className="text-xs" />
                          {getStatusIcon(conv.status)}
                          <span>{formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}</span>
                          {conv.tags && conv.tags.length > 0 && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <div className="flex gap-1">
                                {conv.tags.slice(0, 1).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </div>
                )
              })
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
  
  // Get email subject from first message
  const emailSubject = messages.find(m => m.metadata?.subject)?.metadata?.subject || 
                       messages[0]?.metadata?.subject

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

  const contactName = conversation?.customer?.first_name && conversation?.customer?.last_name
    ? `${conversation.customer.first_name} ${conversation.customer.last_name}`
    : conversation?.customer?.email || conversation?.customer?.instagram_username || "Unknown Contact"
  
  const contactEmail = conversation?.customer?.email || conversation?.customer?.instagram_username

  return (
    <div className="flex flex-col h-full">
      {/* Header with Contact Info */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
              {contactName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {contactName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <PlatformBadge platform={conversation?.platform || "email"} />
                {contactEmail && (
                  <p className="text-sm text-muted-foreground">
                    {contactEmail}
                  </p>
                )}
              </div>
            </div>
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
        
        {/* Pinned Email Subject */}
        {emailSubject && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm text-foreground">{emailSubject}</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOutbound = msg.direction === "outbound"
              const senderName = isOutbound 
                ? "You" 
                : contactName
              const senderEmail = isOutbound
                ? msg.metadata?.to || "you@example.com"
                : msg.metadata?.from || contactEmail
              
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    isOutbound ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar for inbound messages */}
                  {!isOutbound && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
                        {contactName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${isOutbound ? "" : "flex-1"}`}>
                    {/* Sender Info */}
                    <div className={`flex items-center gap-2 mb-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
                      <span className="text-xs font-medium text-foreground">
                        {senderName}
                      </span>
                      {senderEmail && (
                        <span className="text-xs text-muted-foreground">
                          {senderEmail}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    
                    {/* Message Bubble */}
                    <div
                      className={`rounded-lg p-4 ${
                        isOutbound
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-auto"
                          : "bg-muted border border-border"
                      }`}
                    >
                      {/* Email metadata for clarity */}
                      {msg.metadata?.from && msg.metadata?.to && (
                        <div className={`text-xs mb-2 pb-2 border-b ${
                          isOutbound ? "border-white/20" : "border-border"
                        }`}>
                          <div className="space-y-1">
                            <div>
                              <span className={isOutbound ? "text-white/80" : "text-muted-foreground"}>From: </span>
                              <span className={isOutbound ? "text-white" : "text-foreground"}>{msg.metadata.from}</span>
                            </div>
                            <div>
                              <span className={isOutbound ? "text-white/80" : "text-muted-foreground"}>To: </span>
                              <span className={isOutbound ? "text-white" : "text-foreground"}>{msg.metadata.to}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Message Content */}
                      <div
                        className={`text-sm whitespace-pre-wrap ${
                          isOutbound ? "text-white" : "text-foreground"
                        }`}
                        dangerouslySetInnerHTML={
                          msg.metadata?.html
                            ? { __html: msg.metadata.html }
                            : undefined
                        }
                      >
                        {!msg.metadata?.html && <p>{msg.content}</p>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Avatar for outbound messages */}
                  {isOutbound && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs">
                        Y
                      </div>
                    </div>
                  )}
                </div>
              )
            })
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
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCustomer() {
      try {
        setIsLoading(true)
        const convRes = await fetch(`/api/crm/conversations?conversation_id=${conversationId}`)
        if (convRes.ok) {
          const convData = await convRes.json()
          const conv = convData.conversations?.[0]
          setConversation(conv)
          if (conv?.customer_id) {
            const customerRes = await fetch(`/api/crm/people/${conv.customer_id}`)
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

  const contactName = customer?.first_name && customer?.last_name
    ? `${customer.first_name} ${customer.last_name}`
    : customer?.email || customer?.instagram_username || "Unknown Contact"

  return (
    <div className="w-80 border-l bg-background flex flex-col">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold mb-4">Contact Details</h3>
        <Link href={`/admin/crm/people/${customer?.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            View Full Profile
          </Button>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Contact Header */}
          <div className="text-center pb-4 border-b">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-3">
              {contactName.charAt(0).toUpperCase()}
            </div>
            <h4 className="font-semibold text-base mb-1">{contactName}</h4>
            {conversation && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <PlatformBadge platform={conversation.platform} />
                <Badge variant={conversation.status === "open" ? "default" : "secondary"}>
                  {conversation.status}
                </Badge>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Contact Information</h4>
            <div className="space-y-3 text-sm">
              {customer?.email && (
                <div className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-0.5">Email</div>
                    <div className="text-foreground break-all">{customer.email}</div>
                  </div>
                </div>
              )}
              {customer?.phone && (
                <div className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                  <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-0.5">Phone</div>
                    <div className="text-foreground">{customer.phone}</div>
                  </div>
                </div>
              )}
              {customer?.instagram_username && (
                <div className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                  <Instagram className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-0.5">Instagram</div>
                    <div className="text-foreground">@{customer.instagram_username}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order History */}
          {customer?.total_orders && customer.total_orders > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-foreground">Order History</h4>
              <div className="space-y-2 p-3 rounded-md bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <span className="font-semibold text-foreground">{customer.total_orders}</span>
                </div>
                {customer.total_spent && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Spent</span>
                    <span className="font-semibold text-foreground">
                      ${parseFloat(customer.total_spent.toString()).toFixed(2)}
                    </span>
                  </div>
                )}
                {customer.last_order_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Order</span>
                    <span className="text-sm text-foreground">
                      {format(new Date(customer.last_order_date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {customer?.tags && customer.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-foreground">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Company Info */}
          {customer?.crm_companies && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-foreground">Company</h4>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{customer.crm_companies.name}</span>
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
