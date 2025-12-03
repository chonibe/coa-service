"use client"

import { format, formatDistanceToNow } from "date-fns"
import { Mail, Reply, MoreVertical, Paperclip, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlatformBadge } from "@/components/crm/platform-badge"
import { EmailBodyRenderer } from "./email-body-renderer"
import { AttachmentsList } from "./attachments-list"

export interface MessageCardProps {
  message: {
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
    thread_depth?: number
    is_unread?: boolean
  }
  onReply?: (messageId: string) => void
  showThreadIndicator?: boolean
  className?: string
}

export function MessageCard({
  message,
  onReply,
  showThreadIndicator = false,
  className = "",
}: MessageCardProps) {
  const isInbound = message.direction === "inbound"
  const hasAttachments = message.metadata?.attachments && message.metadata.attachments.length > 0

  return (
    <div
      className={`group relative border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors ${
        message.is_unread ? "bg-blue-50/50" : ""
      } ${className}`}
    >
      {/* Thread indicator line */}
      {showThreadIndicator && message.thread_depth && message.thread_depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"
          style={{ left: `${message.thread_depth * 24}px` }}
        />
      )}

      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            {/* From/To */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-2 text-sm">
                {isInbound ? (
                  <>
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {message.metadata?.from || "Unknown Sender"}
                    </span>
                    <span className="text-gray-500">to</span>
                    <span className="text-gray-700">{message.metadata?.to || "You"}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-gray-900">You</span>
                    <span className="text-gray-500">to</span>
                    <span className="text-gray-700">{message.metadata?.to || "Recipient"}</span>
                  </>
                )}
              </div>
            </div>

            {/* Subject */}
            {message.metadata?.subject && (
              <div className="text-sm font-medium text-gray-900 mb-1">
                {message.metadata.subject}
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
              {message.metadata?.cc && (
                <>
                  <span>•</span>
                  <span>CC: {message.metadata.cc}</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {hasAttachments && (
              <Badge variant="outline" className="text-xs">
                <Paperclip className="h-3 w-3 mr-1" />
                {message.metadata?.attachments?.length}
              </Badge>
            )}
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(message.id)}
                className="h-8"
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Forward</DropdownMenuItem>
                <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                <DropdownMenuItem>Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Body */}
        <div className="mt-3">
          <EmailBodyRenderer
            content={message.content}
            html={message.metadata?.html}
            direction={message.direction}
          />
        </div>

        {/* Attachments */}
        {hasAttachments && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <AttachmentsList attachments={message.metadata.attachments!} />
          </div>
        )}
      </div>
    </div>
  )
}

