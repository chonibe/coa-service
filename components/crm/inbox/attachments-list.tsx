"use client"

import { Paperclip, File, Image, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/utils"

export interface Attachment {
  filename: string
  url: string
  size: number
  content_type?: string
}

export interface AttachmentsListProps {
  attachments: Attachment[]
  className?: string
}

const getFileIcon = (contentType?: string, filename?: string) => {
  if (contentType?.startsWith("image/")) {
    return <Image className="h-4 w-4" />
  }
  if (contentType === "application/pdf" || filename?.endsWith(".pdf")) {
    return <FileText className="h-4 w-4" />
  }
  return <File className="h-4 w-4" />
}

const getFileTypeColor = (contentType?: string, filename?: string) => {
  if (contentType?.startsWith("image/")) {
    return "text-blue-600"
  }
  if (contentType === "application/pdf" || filename?.endsWith(".pdf")) {
    return "text-red-600"
  }
  return "text-gray-600"
}

export function AttachmentsList({ attachments, className = "" }: AttachmentsListProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const handleDownload = (attachment: Attachment) => {
    window.open(attachment.url, "_blank")
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={getFileTypeColor(attachment.content_type, attachment.filename)}>
              {getFileIcon(attachment.content_type, attachment.filename)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {attachment.filename}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(attachment.size)}
                {attachment.content_type && ` • ${attachment.content_type.split("/")[1]}`}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(attachment)}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

