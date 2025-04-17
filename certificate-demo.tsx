"use client"

import { useState } from "react"
import { ArtistInsight } from "@/components/artist-insight"
import { ConnectionContext } from "@/components/connection-context"
import Image from "next/image"

export default function CertificateDemo() {
  const [showInsight, setShowInsight] = useState(false)

  // In a real implementation, these would come from your authentication and database
  const artistId = "artist123"
  const certificateId = "cert456"
  const collectorId = "collector789"

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

              {/* Subtle indicator that there's more to discover */}
              <button
                onClick={() => setShowInsight(true)}
                className="absolute bottom-4 right-4 bg-black/10 hover:bg-black/20 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="View artist insight"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-medium">Chromatic Flow #42</h2>
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

              <div className="pt-4">
                <button
                  onClick={() => setShowInsight(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 group"
                >
                  <span className="border-b border-dashed border-gray-300 group-hover:border-gray-600 transition-colors">
                    View artist's insight
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-60 group-hover:translate-x-0.5 transition-transform"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* This is where the connection context is integrated */}
        <ConnectionContext artistId={artistId} certificateId={certificateId} collectorId={collectorId} />

        {/* Artist insight modal */}
        <ArtistInsight
          isOpen={showInsight}
          onClose={() => setShowInsight(false)}
          artistId={artistId}
          certificateId={certificateId}
          collectorId={collectorId}
        />
      </div>
    </div>
  )
}
