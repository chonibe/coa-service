"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Send, Reply, CheckCircle2, Circle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Thread {
  id: string
  title: string | null
  created_at: string
  comments: Comment[]
}

interface Comment {
  id: string
  content: string
  created_by_user_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  parent_comment_id: string | null
  is_resolved?: boolean
  resolved_at?: string | null
  resolved_by_user_id?: string | null
}

interface CommentsPanelProps {
  parentType: "record" | "list_entry"
  parentId: string
}

export function CommentsPanel({ parentType, parentId }: CommentsPanelProps) {
  const { toast } = useToast()
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  useEffect(() => {
    fetchThreads()
  }, [parentType, parentId])

  const fetchThreads = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/crm/threads?parent_type=${parentType}&parent_id=${parentId}`
      )
      if (!response.ok) throw new Error("Failed to fetch threads")
      const data = await response.json()
      setThreads(data.threads || [])
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to load comments",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateThread = async () => {
    if (!newComment.trim()) return

    try {
      // Create thread with first comment
      const threadResponse = await fetch("/api/crm/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_type: parentType,
          parent_id: parentId,
        }),
      })

      if (!threadResponse.ok) throw new Error("Failed to create thread")
      const { thread } = await threadResponse.json()

      // Create comment
      const commentResponse = await fetch("/api/crm/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: thread.id,
          content: newComment,
        }),
      })

      if (!commentResponse.ok) throw new Error("Failed to create comment")

      toast({
        variant: "success",
        title: "Success",
        description: "Comment added",
      })

      setNewComment("")
      fetchThreads()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to add comment",
      })
    }
  }

  const handleReply = async (threadId: string, parentCommentId: string) => {
    if (!replyContent.trim()) return

    try {
      const response = await fetch("/api/crm/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          parent_comment_id: parentCommentId,
          content: replyContent,
        }),
      })

      if (!response.ok) throw new Error("Failed to create reply")

      toast({
        variant: "success",
        title: "Success",
        description: "Reply added",
      })

      setReplyContent("")
      setReplyingTo(null)
      fetchThreads()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to add reply",
      })
    }
  }

  const handleResolve = async (commentId: string, action: "resolve" | "unresolve") => {
    try {
      const response = await fetch(`/api/crm/comments/${commentId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) throw new Error(`Failed to ${action} comment`)

      toast({
        variant: "success",
        title: "Success",
        description: `Comment ${action === "resolve" ? "resolved" : "unresolved"}`,
      })

      fetchThreads()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || `Failed to ${action} comment`,
      })
    }
  }

  const renderComment = (comment: Comment, threadId: string, depth: number = 0) => {
    if (comment.deleted_at) {
      return (
        <div key={comment.id} className="text-sm text-muted-foreground italic ml-4">
          [Comment deleted]
        </div>
      )
    }

    const isResolved = comment.is_resolved || false

    return (
      <div key={comment.id} className={`${depth > 0 ? "ml-8 border-l-2 pl-4" : ""} ${isResolved ? "opacity-75" : ""}`}>
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isResolved && (
                <CheckCircle2 className="h-4 w-4 text-green-600" title="Resolved" />
              )}
              <Badge variant="outline" className="text-xs">
                User
              </Badge>
              {isResolved && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  Resolved
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className={`text-sm whitespace-pre-wrap ${isResolved ? "line-through" : ""}`}>
              {comment.content}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {depth === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
          {depth === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResolve(comment.id, isResolved ? "unresolve" : "resolve")}
              className="text-xs"
            >
              {isResolved ? (
                <>
                  <Circle className="h-3 w-3 mr-1" />
                  Unresolve
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Resolve
                </>
              )}
            </Button>
          )}
        </div>
        {replyingTo === comment.id && (
          <div className="mt-2 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleReply(threadId, comment.id)}>
                <Send className="h-3 w-3 mr-1" />
                Send
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(null)
                  setReplyContent("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({threads.reduce((acc, t) => acc + (t.comments?.length || 0), 0)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment */}
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
          />
          <Button onClick={handleCreateThread} disabled={!newComment.trim()}>
            <Send className="mr-2 h-4 w-4" />
            Add Comment
          </Button>
        </div>

        {/* Threads */}
        {threads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No comments yet. Start a conversation!
          </div>
        ) : (
          <div className="space-y-6">
            {threads.map((thread) => (
              <div key={thread.id} className="border-t pt-4">
                {thread.title && (
                  <h4 className="font-medium mb-3">{thread.title}</h4>
                )}
                <div className="space-y-4">
                  {thread.comments
                    ?.filter((c) => !c.parent_comment_id)
                    .map((comment) => (
                      <div key={comment.id}>
                        {renderComment(comment, thread.id)}
                        {/* Replies */}
                        {thread.comments
                          ?.filter((c) => c.parent_comment_id === comment.id)
                          .map((reply) => renderComment(reply, thread.id, 1))}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

