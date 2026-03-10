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
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
}

export interface SanitizedHtmlProps {
  html: string
  className?: string
  /** Customize allowed tags/attrs; defaults to common prose-safe set */
  config?: { ALLOWED_TAGS?: string[]; ALLOWED_ATTR?: string[] }
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
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: config.ALLOWED_TAGS ?? DEFAULT_ALLOWED.ALLOWED_TAGS,
        ALLOWED_ATTR: config.ALLOWED_ATTR ?? DEFAULT_ALLOWED.ALLOWED_ATTR,
      }),
    [html, config.ALLOWED_TAGS, config.ALLOWED_ATTR]
  )

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
