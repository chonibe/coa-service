"use client"

import { useState, useEffect } from "react"
import { generatePersonalMessage, type ExchangeType, type PersonalExchange } from "@/lib/personal-connection"

export function usePersonalExchanges(artistId: string, artistName: string, artworkTitle: string, collectorId: string) {
  const [exchanges, setExchanges] = useState<PersonalExchange[]>([])
  const [currentExchange, setCurrentExchange] = useState<PersonalExchange | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load exchanges
  useEffect(() => {
    const loadExchanges = async () => {
      try {
        setLoading(true)

        // In a real app, fetch from database
        // For demo, create a mock exchange
        const mockExchangeType: ExchangeType = "personal_story"
        const mockMessage = generatePersonalMessage(artistName, artworkTitle, mockExchangeType)

        const mockExchange: PersonalExchange = {
          type: mockExchangeType,
          content: mockMessage,
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          respondedTo: false,
        }

        setExchanges([mockExchange])
        setCurrentExchange(mockExchange)
      } catch (err) {
        console.error("Error loading exchanges:", err)
        setError(err instanceof Error ? err : new Error("Failed to load exchanges"))
      } finally {
        setLoading(false)
      }
    }

    if (artistId && collectorId) {
      loadExchanges()
    }
  }, [artistId, artistName, artworkTitle, collectorId])

  // Mark exchange as read
  const markAsRead = async (exchange: PersonalExchange) => {
    try {
      // In a real app, update in database
      const updatedExchange = { ...exchange, readAt: new Date() }

      setExchanges((prev) => prev.map((ex) => (ex === exchange ? updatedExchange : ex)))

      setCurrentExchange(updatedExchange)

      return true
    } catch (err) {
      console.error("Error marking exchange as read:", err)
      return false
    }
  }

  // Send response to artist
  const respondToExchange = async (exchange: PersonalExchange, response: string) => {
    try {
      // In a real app, store in database
      const updatedExchange = { ...exchange, respondedTo: true }

      setExchanges((prev) => prev.map((ex) => (ex === exchange ? updatedExchange : ex)))

      setCurrentExchange(updatedExchange)

      return true
    } catch (err) {
      console.error("Error responding to exchange:", err)
      return false
    }
  }

  // Close current exchange
  const closeCurrentExchange = () => {
    setCurrentExchange(null)
  }

  return {
    exchanges,
    currentExchange,
    loading,
    error,
    markAsRead,
    respondToExchange,
    closeCurrentExchange,
  }
}
