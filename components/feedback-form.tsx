"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { analyzeCollectorFeedback } from "@/app/actions/ai"
import { Loader2, ThumbsUp } from "lucide-react"

interface FeedbackFormProps {
  artistId: string
  certificateId: string
  collectorId: string
  onClose: () => void
}

export function FeedbackForm({ artistId, certificateId, collectorId, onClose }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Analyze the feedback with AI
      const analysis = await analyzeCollectorFeedback(feedback)

      // In a real app, you would store both the feedback and analysis in Supabase
      console.log("Feedback analysis:", analysis)

      // For demo purposes, just mark as submitted
      setSubmitted(true)
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center p-6">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <ThumbsUp className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium mb-2">Thank you for your feedback!</h3>
        <p className="text-gray-500 mb-4">Your input helps artists create better content for collectors like you.</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <h3 className="text-lg font-medium">Share Your Thoughts</h3>
      <p className="text-gray-500">
        Let the artist know what you think about their exclusive content and what you'd like to see more of.
      </p>

      <Textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="What did you think of the exclusive content? Any suggestions for future perks?"
        rows={5}
        required
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !feedback.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </form>
  )
}
