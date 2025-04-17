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
    // Check if the collector owns this certificate
    const { data: ownership, error: ownershipError } = await supabase
      .from("certificates")
      .select("id")
      .eq("id", certificateId)
      .eq("collector_id", collectorId)
      .single()

    if (ownershipError || !ownership) {
      console.error("Collector does not own this certificate:", ownershipError)
      return null
    }

    // Fetch artist data
    const { data: artist, error: artistError } = await supabase
      .from("artists")
      .select("id, name, profile_image_url, bio")
      .eq("id", artistId)
      .single()

    if (artistError || !artist) {
      console.error("Error fetching artist:", artistError)
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

    // Fetch collector's viewed perks
    const { data: viewedPerks, error: viewedError } = await supabase
      .from("collector_perks")
      .select("perk_id, viewed_at")
      .eq("collector_id", collectorId)
      .eq("certificate_id", certificateId)

    if (viewedError) {
      console.error("Error fetching viewed perks:", viewedError)
    }

    // Check if there are new perks the collector hasn't seen
    const viewedPerkIds = new Set((viewedPerks || []).map((vp) => vp.perk_id))
    const hasNewContent = perks.some((perk) => !viewedPerkIds.has(perk.id))

    // Fetch collector info for personalization
    const { data: collector } = await supabase.from("collectors").select("name, email").eq("id", collectorId).single()

    // Check if there's a personal message from the artist
    const personalMessageExists = perks.some((p) => p.type === "personal-message")

    // If no personal message exists yet, generate one
    const allPerks = [...perks]

    if (!personalMessageExists && collector) {
      try {
        const personalMessage = await generatePersonalMessage(artist as Artist, collector, certificateId)

        if (personalMessage) {
          // Store the personal message in Supabase
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
    // Check if this perk view already exists
    const { data: existingView } = await supabase
      .from("collector_perks")
      .select("id")
      .eq("perk_id", perkId)
      .eq("collector_id", collectorId)
      .eq("certificate_id", certificateId)
      .single()

    if (existingView) {
      // Update the viewed_at timestamp
      await supabase.from("collector_perks").update({ viewed_at: new Date().toISOString() }).eq("id", existingView.id)
    } else {
      // Create a new record
      await supabase.from("collector_perks").insert({
        collector_id: collectorId,
        perk_id: perkId,
        certificate_id: certificateId,
        viewed_at: new Date().toISOString(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error marking perk as viewed:", error)
    return { success: false, error }
  }
}
