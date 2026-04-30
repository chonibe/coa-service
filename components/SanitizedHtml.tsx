"use client"

import { useMemo } from "react"
import DOMPurify from "dompurify"

const DEFAULT_ALLOWED = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "img",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "colspan", "rowspan", "scope"],
}

export interface SanitizedHtmlProps {
  html: string
  className?: string
  /** Customize allowed tags/attrs; defaults to common prose-safe set */
  config?: { ALLOWED_TAGS?: string[]; ALLOWED_ATTR?: string[] }
}

function stripDangerousBlock(html: string, tagName: "script" | "style"): string {
  let output = html
  const openNeedle = `<${tagName}`
  const closeNeedle = `</${tagName}>`
  let start = output.toLowerCase().indexOf(openNeedle)

  while (start >= 0) {
    const end = output.toLowerCase().indexOf(closeNeedle, start)
    if (end < 0) {
      output = output.slice(0, start)
      break
    }

    output = output.slice(0, start) + output.slice(end + closeNeedle.length)
    start = output.toLowerCase().indexOf(openNeedle)
  }

  return output
}

function sanitizeHtmlServer(html: string): string {
  return stripDangerousBlock(stripDangerousBlock(html, "script"), "style")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)=(["'])\s*javascript:[\s\S]*?\2/gi, "")
}

/**
 * Renders HTML sanitized with DOMPurify to prevent XSS.
 * Use for any HTML from CMS, API, or user input.
 */
export function SanitizedHtml({
  html,
  className = "",
  config = DEFAULT_ALLOWED,
}: SanitizedHtmlProps) {
  const sanitized = useMemo(
    () => {
      if (typeof window === "undefined" || typeof DOMPurify.sanitize !== "function") {
        return sanitizeHtmlServer(html)
      }

      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: config.ALLOWED_TAGS ?? DEFAULT_ALLOWED.ALLOWED_TAGS,
        ALLOWED_ATTR: config.ALLOWED_ATTR ?? DEFAULT_ALLOWED.ALLOWED_ATTR,
      })
    },
    [html, config.ALLOWED_TAGS, config.ALLOWED_ATTR]
  )

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
