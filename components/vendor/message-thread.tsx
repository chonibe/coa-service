"use client"

import { useState, useEffect, useRef } from "react"



import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { EmptyState } from "./empty-state"
import { MessageSquare } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, Button, Textarea } from "@/components/ui"
interface Message {
  id: string
  sender_type: string
  sender_id: string | null
  recipient_type: string
  recipient_id: string | null
  subject: string | null
  body: string
  is_read: boolean
  created_at: string
}

interface MessageThreadProps {
  threadId: string
  onBack: () => void
}

/**
 * Message thread component for viewing and sending messages
 */
export function MessageThread({ threadId, onBack }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [messageBody, setMessageBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/vendor/messages?thread_id=${threadId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const data = await response.json()
      setMessages(data.messages || [])

      // Mark thread as read
      await fetch(`/api/vendor/messages/${threadId}/read`, { method: "PUT" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [threadId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!messageBody.trim()) return

    try {
      setIsSending(true)
      const response = await fetch("/api/vendor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          body: messageBody,
          recipientType: "admin",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setMessageBody("")
      await fetchMessages()
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to send",
        description: err instanceof Error ? err.message : "Failed to send message",
      })
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading messages...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Messages</CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No messages"
              description="Start the conversation by sending a message below."
            />
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isVendor = message.sender_type === "vendor"
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col gap-2 max-w-[80%]",
                      isVendor ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg p-3",
                        isVendor
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-4 space-y-2">
          <Textarea
            placeholder="Type your message..."
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={!messageBody.trim() || isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

