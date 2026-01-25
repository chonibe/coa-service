"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface ArtistBioBlockProps {
  name: string
  bio: string | null
  profileImageUrl: string | null
}

export function ArtistBioBlock({ name, bio, profileImageUrl }: ArtistBioBlockProps) {
  if (!bio) return null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {profileImageUrl && (
            <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={profileImageUrl}
                alt={name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">About {name}</h2>
            <p className="text-muted-foreground whitespace-pre-line">{bio}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
