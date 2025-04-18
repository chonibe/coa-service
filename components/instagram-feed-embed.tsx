"use client"

import { useState } from "react"
import { InstagramEmbed } from "./instagram-embed"
import { Button } from "@/components/ui/button"
import { Instagram, ExternalLink } from "lucide-react"

interface InstagramFeedEmbedProps {
  username: string
  postUrls: string[]
}

export function InstagramFeedEmbed({ username, postUrls }: InstagramFeedEmbedProps) {
  const [visiblePosts, setVisiblePosts] = useState(3)

  const showMore = () => {
    setVisiblePosts(Math.min(visiblePosts + 3, postUrls.length))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Instagram size={18} className="text-pink-500" />
          <span>Instagram</span>
        </h3>
        <a
          href={`https://instagram.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          @{username}
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {postUrls.slice(0, visiblePosts).map((url, index) => (
          <InstagramEmbed key={index} postUrl={url} className="mx-auto" />
        ))}
      </div>

      {visiblePosts < postUrls.length && (
        <Button variant="outline" size="sm" className="w-full" onClick={showMore}>
          Show More Posts
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => window.open(`https://instagram.com/${username}`, "_blank")}
      >
        View More on Instagram
      </Button>
    </div>
  )
}
