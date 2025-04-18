"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArtistNote } from "@/components/artist-note"
import { usePersonalExchanges } from "@/hooks/use-personal-exchanges"

export default function CertificateDemo() {
  const [showInsight, setShowInsight] = useState(false)

  // In a real implementation, these would come from your authentication and database
  const artistId = "artist123"
  const artistName = "Chanchal Banga"
  const artistInitials = "CB"
  const certificateId = "cert456"
  const collectorId = "collector789"
  const artworkTitle = "Chromatic Flow #42"

  // Get personal exchanges from the artist
  const { currentExchange, markAsRead, respondToExchange, closeCurrentExchange } = usePersonalExchanges(
    artistId,
    artistName,
    artworkTitle,
    collectorId,
  )

  // Mark exchange as read when it's opened
  useEffect(() => {
    if (currentExchange && !currentExchange.readAt) {
      markAsRead(currentExchange)
    }
  }, [currentExchange, markAsRead])

  // Handle response to artist
  const handleRespond = async (response: string) => {
    if (currentExchange) {
      await respondToExchange(currentExchange, response)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[80vh] relative">
        <h1 className="text-2xl font-medium mb-6">Certificate of Authenticity</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative group">
              <Image
                src="/chromatic-flow.png"
                alt="Artwork"
                width={500}
                height={500}
                className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-[1.03]"
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-medium">{artworkTitle}</h2>
            <p className="text-gray-600 mb-6">By {artistName}</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Edition</h3>
                <p>1 of 10</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p>April 2023</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Medium</h3>
                <p>Digital Art, Giclée print on archival paper</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Dimensions</h3>
                <p>24 × 36 inches</p>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  This certificate verifies the authenticity of your artwork. The artist may occasionally share personal
                  notes about the work directly with you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal note from the artist */}
        {currentExchange && (
          <ArtistNote
            artistName={artistName}
            artistInitials={artistInitials}
            message={currentExchange.content}
            sentAt={currentExchange.sentAt}
            onClose={closeCurrentExchange}
            onRespond={handleRespond}
            exchangeType={currentExchange.type}
            hasUnread={!currentExchange.readAt}
          />
        )}
      </div>
    </div>
  )
}
