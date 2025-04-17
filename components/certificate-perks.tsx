"use client"

import { useState } from "react"
import { ArtistBubble } from "./artist-bubble"
import { PerkViewer } from "./perk-viewer"
import { useArtistPerks } from "@/hooks/use-artist-perks"
import { useEngagement } from "@/hooks/use-engagement"
import { useCollectorInfluence } from "@/hooks/use-collector-influence"
import { supabase } from "@/lib/supabase/client"

interface CertificatePerksProps {
  artistId: string
  certificateId: string
  collectorId: string
}

export function CertificatePerks({ artistId, certificateId, collectorId }: CertificatePerksProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const { perks, loading, error, hasNewContent, markAsViewed } = useArtistPerks(artistId, certificateId, collectorId)
  const { streak, expiryTime, showScarcity, hasUnclaimedRewards, recordView } = useEngagement(
    artistId,
    certificateId,
    collectorId,
  )
  const { influence, recordAction, submitIdea, recentContributors, topContributors, implementedIdeas } =
    useCollectorInfluence(artistId, collectorId)

  // Record a view when the bubble is clicked
  const handleOpenViewer = () => {
    setIsViewerOpen(true)
    recordView()
    recordAction("view_content")
  }

  // Handle claiming a streak reward
  const handleClaimReward = async () => {
    try {
      // Mark rewards as claimed
      await supabase
        .from("streak_rewards")
        .update({ claimed: true })
        .eq("collector_id", collectorId)
        .eq("claimed", false)

      // Record the action for influence points
      await recordAction("streak_milestone")

      // In a real app, you might also unlock special content here
    } catch (error) {
      console.error("Error claiming reward:", error)
    }
  }

  if (loading || error || !perks) {
    return null // Don't show anything while loading or if there's an error
  }

  return (
    <>
      <ArtistBubble
        artist={{
          id: perks.artist.id,
          name: perks.artist.name,
          profileImageUrl: perks.artist.profile_image_url,
        }}
        onOpen={handleOpenViewer}
        hasNewContent={hasNewContent}
        expiryTime={expiryTime}
        streak={streak}
        showScarcity={showScarcity}
        hasUnclaimedRewards={hasUnclaimedRewards}
      />

      <PerkViewer
        artist={perks.artist}
        perks={perks.perks}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onPerkViewed={markAsViewed}
        streak={streak}
        expiryTime={expiryTime}
        hasUnclaimedRewards={hasUnclaimedRewards}
        onClaimReward={handleClaimReward}
        influence={influence}
        recentContributors={recentContributors}
        topContributors={topContributors}
        implementedIdeas={implementedIdeas}
        onSubmitIdea={submitIdea}
        onRecordAction={recordAction}
      />
    </>
  )
}
