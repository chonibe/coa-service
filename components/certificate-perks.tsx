"use client"

import { useState } from "react"
import { ArtistBubble } from "./artist-bubble"
import { PerkViewer } from "./perk-viewer"
import { mockArtist, mockPerks, mockInfluence, mockContributors, mockIdeas } from "@/lib/mock-data"

interface CertificatePerksProps {
  artistId: string
  certificateId: string
  collectorId: string
}

export function CertificatePerks({ artistId, certificateId, collectorId }: CertificatePerksProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [streak, setStreak] = useState(3)
  const [hasNewContent] = useState(true)
  const [hasUnclaimedRewards] = useState(true)

  // Record a view when the bubble is clicked
  const handleOpenViewer = () => {
    setIsViewerOpen(true)
  }

  // Handle claiming a streak reward
  const handleClaimReward = async () => {
    // In a real app, this would update the database
    console.log("Reward claimed")
  }

  // Mock function to mark a perk as viewed
  const markAsViewed = (perkId: string) => {
    console.log("Marked perk as viewed:", perkId)
  }

  // Mock function to record an action
  const recordAction = async (action: string) => {
    console.log("Action recorded:", action)
  }

  // Mock function to submit an idea
  const submitIdea = async (title: string, description: string) => {
    console.log("Idea submitted:", { title, description })
    return { id: "new-idea", title, description }
  }

  return (
    <>
      <ArtistBubble
        artist={{
          id: mockArtist.id,
          name: mockArtist.name,
          profileImageUrl: mockArtist.profile_image_url,
        }}
        onOpen={handleOpenViewer}
        hasNewContent={hasNewContent}
        expiryTime={new Date(Date.now() + 2 * 60 * 60 * 1000)} // 2 hours from now
        streak={streak}
        showScarcity={true}
        hasUnclaimedRewards={hasUnclaimedRewards}
      />

      <PerkViewer
        artist={mockArtist}
        perks={mockPerks}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onPerkViewed={markAsViewed}
        streak={streak}
        expiryTime={new Date(Date.now() + 2 * 60 * 60 * 1000)} // 2 hours from now
        hasUnclaimedRewards={hasUnclaimedRewards}
        onClaimReward={handleClaimReward}
        influence={mockInfluence}
        recentContributors={mockContributors}
        topContributors={mockContributors}
        implementedIdeas={mockIdeas}
        onSubmitIdea={submitIdea}
        onRecordAction={recordAction}
      />
    </>
  )
}
