"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Search, Plus, Loader2 } from "lucide-react"
import { SidebarLayout } from "../../components/sidebar-layout"
import { MessageThread } from "@/components/vendor/message-thread"
import { EmptyState } from "@/components/vendor/empty-state"
import { LoadingSkeleton } from "@/components/vendor/loading-skeleton"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface MessageThread {
  threadId: string
  subject: string | null
  lastMessage: string
  lastMessageAt: string
  senderType: string
  senderId: string | null
  unreadCount: number
}

export default function MessagesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [totalUnread, setTotalUnread] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchThreads = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/vendor/messages", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const data = await response.json()
      setThreads(data.threads || [])
      setTotalUnread(data.totalUnread || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages")
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load messages",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchThreads()
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchThreads, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleNewMessage = async () => {
    try {
      const response = await fetch("/api/vendor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject: "New Conversation",
          body: "Hello, I have a question.",
          recipientType: "admin",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create message")
      }

      const data = await response.json()
      setSelectedThreadId(data.threadId)
      await fetchThreads()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create message",
      })
    }
  }

  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      thread.subject?.toLowerCase().includes(query) ||
      thread.lastMessage.toLowerCase().includes(query) ||
      thread.senderId?.toLowerCase().includes(query)
    )
  })

  if (selectedThreadId) {
    return (
      <SidebarLayout>
        <div className="p-6">
          <MessageThread
            threadId={selectedThreadId}
            onBack={() => {
              setSelectedThreadId(null)
              fetchThreads()
            }}
          />
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Messages</h1>
            <p className="text-muted-foreground">Communicate with customers and the platform team</p>
          </div>
          <Button 
            onClick={handleNewMessage}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>

        {error && (
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inbox</CardTitle>
                <CardDescription>
                  {totalUnread > 0 && (
                    <Badge variant="destructive" className="mt-2">
                      {totalUnread} unread
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSkeleton variant="list" count={5} />
            ) : filteredThreads.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={searchQuery ? "No messages found" : "No messages yet"}
                description={
                  searchQuery
                    ? "Try adjusting your search query"
                    : "When you receive messages from customers or the platform team, they will appear here."
                }
                action={
                  !searchQuery
                    ? {
                        label: "New Message",
                        onClick: handleNewMessage,
                      }
                    : undefined
                }
              />
            ) : (
              <div className="space-y-2">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.threadId}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                      thread.unreadCount > 0 && "bg-accent/50 border-primary/20"
                    )}
                    onClick={() => setSelectedThreadId(thread.threadId)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {thread.subject || "No subject"}
                        </h3>
                        {thread.unreadCount > 0 && (
                          <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center p-0">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{thread.lastMessage}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(thread.lastMessageAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}
