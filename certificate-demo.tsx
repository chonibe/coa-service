"use client"

import { CertificatePerks } from "@/components/certificate-perks"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export default function CertificateDemo() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // In a real implementation, these IDs would come from your authentication system
  // For demo purposes, we're using fixed IDs
  const artistId = "artist123"
  const certificateId = "cert456"
  const collectorId = "collector789"

  // Ensure we have sample data in the database
  useEffect(() => {
    const setupSampleData = async () => {
      try {
        setLoading(true)

        // Check if artists table exists and create sample artist if needed
        try {
          const { data: existingArtist, error: artistError } = await supabase
            .from("artists")
            .select("id")
            .eq("id", artistId)
            .single()

          if (artistError && artistError.code !== "PGRST116") {
            console.error("Error checking for artist:", artistError)
          }

          // If artist doesn't exist and table exists, create one
          if (!existingArtist && !artistError) {
            await supabase.from("artists").insert({
              id: artistId,
              name: "Chanchal Banga",
              profile_image_url: "/creative-portrait.png",
              bio: "Digital artist exploring the intersection of technology and creativity",
            })
          }
        } catch (error) {
          console.log("Artists table might not exist yet:", error)
        }

        // Check if collectors table exists and create sample collector if needed
        try {
          const { data: existingCollector, error: collectorError } = await supabase
            .from("collectors")
            .select("id")
            .eq("id", collectorId)
            .single()

          if (collectorError && collectorError.code !== "PGRST116") {
            console.error("Error checking for collector:", collectorError)
          }

          // If collector doesn't exist and table exists, create one
          if (!existingCollector && !collectorError) {
            await supabase.from("collectors").insert({
              id: collectorId,
              name: "Art Enthusiast",
              email: "collector@example.com",
            })
          }
        } catch (error) {
          console.log("Collectors table might not exist yet:", error)
        }

        // Check if perks table exists and create sample perks if needed
        try {
          const { data: existingPerks, error: perksError } = await supabase
            .from("perks")
            .select("id")
            .eq("artist_id", artistId)
            .limit(1)

          if (perksError && perksError.code !== "PGRST116") {
            console.error("Error checking for perks:", perksError)
          }

          // If no perks exist and table exists, create some sample perks
          if ((!existingPerks || existingPerks.length === 0) && !perksError) {
            await supabase.from("perks").insert([
              {
                artist_id: artistId,
                type: "text",
                title: "Welcome Message",
                content: "Thank you for collecting my artwork! I'm excited to share exclusive content with you.",
                is_active: true,
              },
              {
                artist_id: artistId,
                type: "image",
                title: "Behind the Scenes",
                src: "/cluttered-creative-space.png",
                content: "A glimpse into my creative process and workspace.",
                is_active: true,
              },
            ])
          }
        } catch (error) {
          console.log("Perks table might not exist yet:", error)
        }
      } catch (error) {
        console.error("Error setting up sample data:", error)
        setError("Failed to set up sample data. Please check your Supabase connection.")
      } finally {
        setLoading(false)
      }
    }

    setupSampleData()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <p className="text-gray-500 mt-4">Please check your Supabase connection and database setup.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 min-h-[80vh] relative">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Certificate of Authenticity</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="aspect-square bg-gray-200 rounded-lg mb-4">
                  <img src="/chromatic-flow.png" alt="Artwork" className="w-full h-full object-cover rounded-lg" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold">Untitled #42</h2>
                <p className="text-gray-600 mb-4">By Chanchal Banga</p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Edition</h3>
                    <p>1 of 10</p>
                  </div>

                  <div>
                    <h3 className="font-medium">Created</h3>
                    <p>April 2023</p>
                  </div>

                  <div>
                    <h3 className="font-medium">Medium</h3>
                    <p>Digital Art, Giclée print on archival paper</p>
                  </div>

                  <div>
                    <h3 className="font-medium">Dimensions</h3>
                    <p>24 × 36 inches</p>
                  </div>
                </div>
              </div>
            </div>

            {/* This is where the enhanced perks experience is integrated */}
            <CertificatePerks artistId={artistId} certificateId={certificateId} collectorId={collectorId} />
          </>
        )}
      </div>
    </div>
  )
}
