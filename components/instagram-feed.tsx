"use client"

import { useState } from "react"
import Image from "next/image"
import { Instagram, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface InstagramFeedProps {
  artistName: string
  username: string
  posts: any[]
  profileUrl?: string
}

export function InstagramFeed({ artistName, username, posts, profileUrl }: InstagramFeedProps) {
  const [selectedPost, setSelectedPost] = useState<any | null>(null)

  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Instagram size={18} className="text-pink-500" />
          <span>Instagram</span>
        </h3>
        <a
          href={profileUrl || `https://instagram.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          @{username}
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <div
            key={post.id}
            className="aspect-square relative cursor-pointer overflow-hidden"
            onClick={() => setSelectedPost(post)}
          >
            <Image
              src={post.mediaUrl || "/placeholder.svg"}
              alt={post.caption || "Instagram post"}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => window.open(`https://instagram.com/${username}`, "_blank")}
      >
        View More on Instagram
      </Button>

      {/* Post detail dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram size={16} className="text-pink-500" />
              <span>{artistName}'s Post</span>
            </DialogTitle>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              <div className="rounded-md overflow-hidden">
                <Image
                  src={selectedPost.mediaUrl || "/placeholder.svg"}
                  alt={selectedPost.caption || "Instagram post"}
                  width={500}
                  height={500}
                  className="w-full object-cover"
                />
              </div>

              <p className="text-sm">{selectedPost.caption}</p>

              <div className="text-xs text-gray-500">{new Date(selectedPost.timestamp).toLocaleDateString()}</div>

              <Button size="sm" onClick={() => window.open(selectedPost.permalink, "_blank")} className="w-full">
                View on Instagram
                <ExternalLink size={14} className="ml-2" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
