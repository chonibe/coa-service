"use client"

import { useMemo, useState } from "react"

export interface EmailBodyRendererProps {
  content: string
  html?: string
  direction?: "inbound" | "outbound"
  className?: string
}

/**
 * Renders email body with HTML support and sanitization
 * Falls back to plain text if HTML is not available
 */
export function EmailBodyRenderer({
  content,
  html,
  direction = "inbound",
  className = "",
}: EmailBodyRendererProps) {
  const sanitizedHtml = useMemo(() => {
    if (html) {
      // Basic HTML sanitization - remove script tags and dangerous attributes
      // For production, consider using a library like DOMPurify
      let sanitized = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
      
      return sanitized
    }
    return null
  }, [html])

  const formattedText = useMemo(() => {
    if (!content) return ""
    
    // Convert plain text to HTML with line breaks
    return content
      .replace(/\n/g, "<br />")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
  }, [content])

  // Detect quoted text (common email patterns)
  const hasQuotedText = useMemo(() => {
    const text = html || content
    return (
      text.includes("On ") &&
      (text.includes("wrote:") || text.includes("sent:") || text.includes("said:"))
    )
  }, [html, content])

  if (sanitizedHtml) {
    return (
      <div
        className={`prose prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        style={{
          fontSize: "14px",
          lineHeight: "1.6",
          color: "#374151",
        }}
      />
    )
  }

  return (
    <div
      className={`text-sm text-gray-700 whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  )
}

/**
 * Collapsible quoted text component
 */
export function QuotedText({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <span>{isExpanded ? "▼" : "▶"}</span>
        <span>Quoted text</span>
      </button>
      {isExpanded && (
        <div className="mt-2 text-sm text-gray-500 italic pl-4 border-l-2 border-gray-200">
          {content}
        </div>
      )}
    </div>
  )
}

