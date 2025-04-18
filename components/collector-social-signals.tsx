"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, ExternalLink, Map, MessageSquare, Tag, ThumbsUp, BookOpen, Music, Globe, Coffee } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CollectorSocialSignalsProps {
  collectorId: string
  collectorProfile: any
}

export function CollectorSocialSignals({ collectorId, collectorProfile }: CollectorSocialSignalsProps) {
  const [activeTab, setActiveTab] = useState("interests")

  const interestIcons: Record<string, React.ReactNode> = {
    "Contemporary Photography": <BookOpen className="w-4 h-4" />,
    Jazz: <Music className="w-4 h-4" />,
    "International Travel": <Globe className="w-4 h-4" />,
    Coffee: <Coffee className="w-4 h-4" />,
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border">
            <AvatarImage src={collectorProfile.profileImageUrl || "/placeholder.svg"} alt={collectorProfile.name} />
            <AvatarFallback>{collectorProfile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{collectorProfile.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Map className="w-3.5 h-3.5" />
              <span>
                {collectorProfile.location.city}, {collectorProfile.location.country}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-3 border-b">
          <button
            className={cn(
              "py-3 px-2 text-center text-sm",
              activeTab === "interests" ? "border-b-2 border-indigo-600 font-medium" : "text-gray-500",
            )}
            onClick={() => setActiveTab("interests")}
          >
            Interests
          </button>
          <button
            className={cn(
              "py-3 px-2 text-center text-sm",
              activeTab === "connections" ? "border-b-2 border-indigo-600 font-medium" : "text-gray-500",
            )}
            onClick={() => setActiveTab("connections")}
          >
            Circle
          </button>
          <button
            className={cn(
              "py-3 px-2 text-center text-sm",
              activeTab === "activity" ? "border-b-2 border-indigo-600 font-medium" : "text-gray-500",
            )}
            onClick={() => setActiveTab("activity")}
          >
            Activity
          </button>
        </div>

        <div className="p-4">
          {activeTab === "interests" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Key Interests:</h3>
                <div className="flex flex-wrap gap-2">
                  {collectorProfile.interests.map((interest: string) => (
                    <Badge key={interest} variant="secondary" className="flex items-center gap-1.5">
                      {interestIcons[interest] || <Tag className="w-3.5 h-3.5" />}
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Collection Focus:</h3>
                <ul className="space-y-1.5">
                  {collectorProfile.collectionFocus.map((focus: string, i: number) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      {focus}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Reading List:</h3>
                <ul className="space-y-1.5">
                  {collectorProfile.readingList.map((book: any, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>
                        "{book.title}" by {book.author}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "connections" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Artists Followed:</h3>
                <div className="space-y-2">
                  {collectorProfile.artistsFollowed.map((artist: any) => (
                    <div key={artist.id} className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={artist.profileImageUrl || "/placeholder.svg"} alt={artist.name} />
                        <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">{artist.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Favorite Galleries:</h3>
                <ul className="space-y-1.5">
                  {collectorProfile.favoriteGalleries.map((gallery: any, i: number) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <Map className="w-4 h-4 text-gray-400" />
                      <span>
                        {gallery.name}, {gallery.location}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Recent Events:</h3>
                <ul className="space-y-1.5">
                  {collectorProfile.recentEvents.map((event: any, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <span>{event.name}</span>
                        <div className="text-xs text-gray-500">{event.date}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Recent Acquisitions:</h3>
                <ul className="space-y-2">
                  {collectorProfile.recentAcquisitions.map((acquisition: any, i: number) => (
                    <li key={i} className="text-sm">
                      <div className="font-medium">{acquisition.title}</div>
                      <div className="text-gray-500">
                        {acquisition.artist}, {acquisition.year}
                      </div>
                      <div className="text-xs text-gray-400">Acquired {acquisition.date}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Social Engagement:</h3>
                <ul className="space-y-1.5">
                  {collectorProfile.socialEngagement.map((engagement: any, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      {engagement.type === "comment" ? (
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                      ) : (
                        <ThumbsUp className="w-4 h-4 text-gray-400 mt-0.5" />
                      )}
                      <div>
                        <span>{engagement.content}</span>
                        <div className="text-xs text-gray-500">{engagement.target}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">External Profiles:</h3>
                <div className="flex flex-wrap gap-2">
                  {collectorProfile.externalProfiles.map((profile: any) => (
                    <a
                      key={profile.platform}
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {profile.platform} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
