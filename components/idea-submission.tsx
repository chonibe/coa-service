"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lightbulb, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface IdeaSubmissionProps {
  onSubmit: (title: string, description: string) => Promise<any>
  onClose: () => void
  artistName: string
}

export function IdeaSubmission({ onSubmit, onClose, artistName }: IdeaSubmissionProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      setError("Please fill out all fields")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await onSubmit(title, description)
      if (result) {
        setSubmitted(true)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } catch (err) {
      setError("An error occurred while submitting your idea.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        >
          {submitted ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Idea Submitted!</h3>
              <p className="text-gray-600 mb-6">
                Thank you for sharing your creative idea with {artistName}. Your contribution has been recorded and will
                be reviewed.
              </p>
              <Button onClick={onClose}>Close</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Share Your Idea with {artistName}
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="idea-title" className="text-sm font-medium">
                    Idea Title
                  </label>
                  <Input
                    id="idea-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your idea a catchy title"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="idea-description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="idea-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your idea in detail. What would you like to see the artist create or explore?"
                    rows={5}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 text-right">{description.length}/1000</p>
                </div>

                {error && <div className="text-sm text-red-500 p-2 bg-red-50 rounded">{error}</div>}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Idea"
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
