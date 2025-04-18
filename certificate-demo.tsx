"use client"

import { useState } from "react"
import { ArtistMessage } from "@/components/artist-message"
import { PersonalNotes } from "@/components/personal-notes"
import Image from "next/image"
import { CircleContext } from "@/components/circle-context"
import { useCircleProximity } from "@/hooks/use-circle-proximity"

export default function CertificateDemo() {
  const [showMessage, setShowMessage] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  // In a real implementation, these would come from your authentication and database
  const artistId = "artist123"
  const certificateId = "cert456"
  const collectorId = "collector789"
  const artworkTitle = "Chromatic Flow #42"

  // Get information about the collector-artist relationship
  const { proximity, reflection, hasUnreadMessage, lastViewedAt } = useCircleProximity(
    artistId,
    certificateId,
    collectorId,
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[80vh] relative">
        <h1 className="text-2xl font-medium mb-6">Certificate of Authenticity</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
              <Image
                src="/chromatic-flow.png"
                alt="Artwork"
                width={500}
                height={500}
                className="w-full h-full object-cover"
              />

              {/* Subtle indication of unread message */}
              {hasUnreadMessage && (
                <button
                  onClick={() => setShowMessage(true)}
                  className="absolute bottom-4 right-4 bg-white/90 text-gray-800 rounded-full px-3 py-1 text-xs shadow-sm"
                >
                  New message from artist
                </button>
              )}
            </div>

            {/* Show when the collector last viewed the certificate */}
            {lastViewedAt && (
              <div className="text-xs text-gray-500 mt-1">
                Last viewed: {new Date(lastViewedAt).toLocaleDateString()}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-medium">{artworkTitle}</h2>
            <p className="text-gray-600 mb-6">By Chanchal Banga</p>

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

              {/* Simple, non-decorative actions */}
              <div className="pt-6 space-y-3">
                <button
                  onClick={() => setShowMessage(true)}
                  className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 hover:underline"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                    <line x1="4" y1="22" x2="4" y2="15"></line>
                  </svg>
                  Message from Chanchal
                </button>

                <button
                  onClick={() => setShowNotes(true)}
                  className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 hover:underline"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Your personal notes
                </button>
              </div>

              {/* Relationship reflection */}
              {proximity && reflection && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 italic">{reflection}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* This provides context about the relationship */}
        <CircleContext artistId={artistId} certificateId={certificateId} collectorId={collectorId} />

        {/* Artist message modal */}
        <ArtistMessage
          isOpen={showMessage}
          onClose={() => setShowMessage(false)}
          artistId={artistId}
          certificateId={certificateId}
          collectorId={collectorId}
        />

        {/* Personal notes modal */}
        <PersonalNotes
          isOpen={showNotes}
          onClose={() => setShowNotes(false)}
          artistId={artistId}
          certificateId={certificateId}
          collectorId={collectorId}
        />
      </div>
    </div>
  )
}
