"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { ExchangeType } from "@/lib/personal-connection"

interface ArtistNoteProps {
  artistName: string
  artistInitials: string
  message: string
  sentAt: Date
  onClose: () => void
  onRespond: (response: string) => void
  exchangeType: ExchangeType
  hasUnread?: boolean
}

export function ArtistNote({
  artistName,
  artistInitials,
  message,
  sentAt,
  onClose,
  onRespond,
  exchangeType,
  hasUnread = false,
}: ArtistNoteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)

  // Open the note after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async () => {
    if (!response.trim()) return

    setIsSubmitting(true)
    try {
      await onRespond(response)
      setHasResponded(true)
    } catch (error) {
      console.error("Error sending response:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Different styling based on exchange type
  const noteStyles: Record<ExchangeType, string> = {
    process_note: "bg-blue-50 border-blue-200",
    inspiration: "bg-purple-50 border-purple-200",
    personal_story: "bg-amber-50 border-amber-200",
    question: "bg-green-50 border-green-200",
    recommendation: "bg-red-50 border-red-200",
    gratitude: "bg-teal-50 border-teal-200",
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50 max-w-md w-full"
        >
          <div className={cn("rounded-lg border p-4 shadow-md", noteStyles[exchangeType])}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                  {artistInitials}
                </div>
                <div>
                  <div className="font-medium">{artistName}</div>
                  <div className="text-xs text-gray-500">{formatDate(sentAt)}</div>
                </div>
                {hasUnread && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="whitespace-pre-wrap mb-4 text-gray-700">{message}</div>

            {!hasResponded ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Write a response... (optional)"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Maybe Later
                  </Button>
                  <Button size="sm" onClick={handleSubmit} disabled={!response.trim() || isSubmitting}>
                    {isSubmitting ? "Sending..." : "Respond"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-green-600 italic">You responded to this note.</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
