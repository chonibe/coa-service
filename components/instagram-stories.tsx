"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Instagram } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface InstagramStory {
  id: string
  media_type: string
  media_url: string
  permalink: string
  timestamp: string
}

interface InstagramProfile {
  username: string
  profile_picture_url: string
  name: string
}

interface InstagramStoriesProps {
  username: string
  className?: string
}

export function InstagramStories({ username, className = "" }: InstagramStoriesProps) {
  const [stories, setStories] = useState<InstagramStory[]>([])
  const [profile, setProfile] = useState<InstagramProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStory, setCurrentStory] = useState<InstagramStory | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!username) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch profile
        const profileResponse = await fetch(`/api/instagram/profile?username=${username}`)

        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch Instagram profile: ${profileResponse.statusText}`)
        }

        const profileData = await profileResponse.json()
        setProfile(profileData.profile)

        // Fetch stories
        const storiesResponse = await fetch(`/api/instagram/stories?username=${username}`)

        if (!storiesResponse.ok) {
          throw new Error(`Failed to fetch Instagram stories: ${storiesResponse.statusText}`)
        }

        const storiesData = await storiesResponse.json()
        setStories(storiesData.stories || [])
      } catch (err: any) {
        console.error("Error fetching Instagram data:", err)
        setError(err.message || "Failed to fetch Instagram data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [username])

  const handleStoryClick = (story: InstagramStory) => {
    setCurrentStory(story)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-4 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-muted-foreground text-sm">No stories available</p>
      </div>
    )
  }

  return (
    <>
      <div className={`flex space-x-4 overflow-x-auto py-2 ${className}`}>
        {profile && (
          <div className="flex flex-col items-center">
            <Avatar
              className="w-16 h-16 border-2 border-primary cursor-pointer"
              onClick={() => stories.length > 0 && handleStoryClick(stories[0])}
            >
              <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt={profile.username} />
              <AvatarFallback>
                <Instagram className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs mt-1 truncate max-w-[64px] text-center">
              {profile.name || `@${profile.username}`}
            </span>
          </div>
        )}
      </div>

      {currentStory && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black">
            <div className="relative aspect-[9/16] w-full">
              {currentStory.media_type === "VIDEO" ? (
                <video src={currentStory.media_url} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <img
                  src={currentStory.media_url || "/placeholder.svg"}
                  alt="Instagram story"
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute top-4 left-4 flex items-center">
                {profile && (
                  <>
                    <Avatar className="w-8 h-8 border border-white">
                      <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt={profile.username} />
                      <AvatarFallback>
                        <Instagram className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white text-sm ml-2">{profile.username}</span>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
