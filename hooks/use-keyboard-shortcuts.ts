"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey : !e.ctrlKey
        const metaMatch = shortcut.metaKey ? e.metaKey : !e.metaKey
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          // Don't trigger if user is typing in an input
          const target = e.target as HTMLElement
          if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable
          ) {
            continue
          }

          e.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts])
}

// Common CRM shortcuts
export function useCRMShortcuts() {
  const router = useRouter()

  useKeyboardShortcuts([
    {
      key: "n",
      metaKey: true,
      action: () => {
        const pathname = window.location.pathname
        if (pathname.includes("/crm/people")) {
          router.push("/admin/crm/people/new")
        } else if (pathname.includes("/crm/companies")) {
          router.push("/admin/crm/companies/new")
        }
      },
      description: "Create new record",
    },
    {
      key: "k",
      metaKey: true,
      action: () => {
        // Global search is handled by GlobalSearch component
        const event = new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
        })
        window.dispatchEvent(event)
      },
      description: "Open search",
    },
    {
      key: "e",
      metaKey: true,
      action: () => {
        const pathname = window.location.pathname
        const match = pathname.match(/\/(people|companies)\/([^\/]+)$/)
        if (match) {
          const [, entityType, id] = match
          router.push(`/admin/crm/${entityType}/${id}/edit`)
        }
      },
      description: "Edit current record",
    },
    {
      key: "b",
      metaKey: true,
      action: () => {
        router.back()
      },
      description: "Go back",
    },
  ])
}

