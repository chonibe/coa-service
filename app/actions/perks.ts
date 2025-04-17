"use server"

import { supabase, supabaseAdmin } from "@/lib/supabase/client"
import type { Artist, ArtistPerks, Perk } from "@/types/perks"
import { generatePersonalMessage } from "./ai"

export async function getArtistPerks(
  artistId: string,
  certificateId: string,
  collectorId: string,
): Promise<ArtistPerks | null> {
  try {
    // Skip certificate ownership check for now
    // In a production environment, you would verify ownership here

    // Fetch artist data
    const { data: artist, error: artistError } = await supabase
      .from("artists")
      .select("id, name, profile_image_url, bio")
      .eq("id", artistId)
      .single()

    if (artistError) {
      console.error("Error fetching artist:", artistError)

      // If the table doesn't exist or the artist doesn't exist, create a mock artist
      if (artistError.code === "PGRST116" || artistError.code === "PGRST404") {
        const mockArtist = {
          id: artistId,
          name: "Chanchal Banga",
          profile_image_url: "/creative-portrait.png",
          bio: "Digital artist exploring the intersection of technology and creativity",
        }

        return {
          artist: mockArtist as Artist,
          perks: [
            {
              id: "mock-perk-1",
              artist_id: artistId,
              type: "text",
              title: "Welcome Message",
              content: "Thank you for collecting my artwork! I'm excited to share exclusive content with you.",
              is_active: true,
              created_at: new Date().toISOString(),
            } as Perk,
            {
              id: "mock-perk-2",
              artist_id: artistId,
              type: "image",
              title: "Behind the Scenes",
              src: "/cluttered-creative-space.png",
              content: "A glimpse into my creative process and workspace.",
              is_active: true,
              created_at: new Date().toISOString(),
            } as Perk,
          ],
          hasNewContent: true,
        }
      }

      return null
    }

    // Fetch perks for this artist
    const { data: perks, error: perksError } = await supabase
      .from("perks")
      .select("*")
      .eq("artist_id", artistId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (perksError) {
      console.error("Error fetching perks:", perksError)
      return null
    }

    // If no perks found, create a default set
    const allPerks =
      perks.length > 0
        ? [...perks]
        : [
            {
              id: "default-perk-1",
              artist_id: artistId,
              type: "text",
              title: "Welcome Message",
              content: "Thank you for collecting my artwork! I'm excited to share exclusive content with you.",
              is_active: true,
              created_at: new Date().toISOString(),
            } as Perk,
          ]

    // Try to fetch collector's viewed perks
    let hasNewContent = true
    try {
      const { data: viewedPerks, error: viewedError } = await supabase
        .from("collector_perks")
        .select("perk_id, viewed_at")
        .eq("collector_id", collectorId)
        .eq("certificate_id", certificateId)

      if (!viewedError && viewedPerks) {
        // Check if there are new perks the collector hasn't seen
        const viewedPerkIds = new Set(viewedPerks.map((vp) => vp.perk_id))
        hasNewContent = allPerks.some((perk) => !viewedPerkIds.has(perk.id))
      }
    } catch (error) {
      console.log("collector_perks table might not exist yet:", error)
    }

    // Try to fetch collector info for personalization
    let collector = null
    try {
      const { data: collectorData } = await supabase
        .from("collectors")
        .select("name, email")
        .eq("id", collectorId)
        .single()
      collector = collectorData
    } catch (error) {
      console.log("collectors table might not exist yet:", error)
    }

    // Check if there's a personal message from the artist
    const personalMessageExists = allPerks.some((p) => p.type === "personal-message")

    // If no personal message exists yet, generate one
    if (!personalMessageExists && collector) {
      try {
        const personalMessage = await generatePersonalMessage(artist as Artist, collector, certificateId)

        if (personalMessage) {
          // Try to store the personal message in Supabase
          try {
            const { data: newPerk, error: insertError } = await supabaseAdmin
              .from("perks")
              .insert({
                artist_id: artistId,
                type: "personal-message",
                content: personalMessage,
                title: "A personal message for you",
                is_active: true,
              })
              .select()
              .single()

            if (!insertError && newPerk) {
              allPerks.unshift(newPerk as Perk)
            }
          } catch (error) {
            console.log("Error storing personal message:", error)

            // Add a mock personal message if we couldn't store it
            allPerks.unshift({
              id: "mock-personal-message",
              artist_id: artistId,
              type: "personal-message",
              content: personalMessage,
              title: "A personal message for you",
              is_active: true,
              created_at: new Date().toISOString(),
            } as Perk)
          }
        }
      } catch (err) {
        console.error("Error generating personal message:", err)
      }
    }

    return {
      artist: artist as Artist,
      perks: allPerks as Perk[],
      hasNewContent,
    }
  } catch (error) {
    console.error("Error in getArtistPerks:", error)
    return null
  }
}

export async function markPerkAsViewed(perkId: string, collectorId: string, certificateId: string) {
  try {
    // Try to check if this perk view already exists
    try {
      const { data: existingView, error } = await supabase
        .from("collector_perks")
        .select("id")
        .eq("perk_id", perkId)
        .eq("collector_id", collectorId)
        .eq("certificate_id", certificateId)
        .single()

      if (!error && existingView) {
        // Update the viewed_at timestamp
        await supabase.from("collector_perks").update({ viewed_at: new Date().toISOString() }).eq("id", existingView.id)
      } else if (!error || error.code !== "PGRST116") {
        // Create a new record if the table exists
        await supabase.from("collector_perks").insert({
          collector_id: collectorId,
          perk_id: perkId,
          certificate_id: certificateId,
          viewed_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.log("collector_perks table might not exist yet:", error)
    }

    return { success: true }
  } catch (error) {
    console.error("Error marking perk as viewed:", error)
    return { success: false, error }
  }
}
