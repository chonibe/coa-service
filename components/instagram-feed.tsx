"use client"

import { useState } from "react"
import Image from "next/image"
import { Instagram, ExternalLink, Play, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface InstagramFeedProps {
  artistName: string
  username: string
  posts: any[]
  profileUrl?: string
}

export function InstagramFeed({ artistName, username, posts, profileUrl }: InstagramFeedProps) {
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)

  if (!posts || posts.length === 0) {
    return null
  }

  // Function to get the appropriate media URL for display
  const getMediaUrl = (post: any) => {
    if (post.media_type === "VIDEO") {
      return post.thumbnail_url || "/abstract-thumbnail.png"
    }
    return post.media_url || "/cozy-cafe-corner.png"
  }

  // Function to handle carousel navigation
  const handleCarouselNav = (direction: "next" | "prev") => {
    if (!selectedPost || !selectedPost.children || !selectedPost.children.data) return

    const maxIndex = selectedPost.children.data.length - 1

    if (direction === "next") {
      setCurrentCarouselIndex((prev) => (prev < maxIndex ? prev + 1 : 0))
    } else {
      setCurrentCarouselIndex((prev) => (prev > 0 ? prev - 1 : maxIndex))
    }
  }

  // Function to render the appropriate media in the dialog
  const renderPostMedia = () => {
    if (!selectedPost) return null

    // For carousel albums, show the current item
    if (selectedPost.media_type === "CAROUSEL_ALBUM" && selectedPost.children && selectedPost.children.data) {
      const currentItem = selectedPost.children.data[currentCarouselIndex]

      if (currentItem.media_type === "VIDEO") {
        return (
          <div className="relative w-full">
            <video src={currentItem.media_url} controls className="w-full rounded-md" autoPlay playsInline />
            <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2">
              {selectedPost.children.data.map((_: any, i: number) => (
                <div
                  key={i}
                  className={cn("w-2 h-2 rounded-full", i === currentCarouselIndex ? "bg-white" : "bg-white/50")}
                />
              ))}
            </div>
            {selectedPost.children.data.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                  onClick={() => handleCarouselNav("prev")}
                >
                  <ChevronLeft size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                  onClick={() => handleCarouselNav("next")}
                >
                  <ChevronRight size={20} />
                </Button>
              </>
            )}
          </div>
        )
      }

      return (
        <div className="relative">
          <Image
            src={currentItem.media_url || "/placeholder.svg?height=500&width=500&query=instagram post"}
            alt={selectedPost.caption || "Instagram post"}
            width={500}
            height={500}
            className="w-full rounded-md"
          />
          <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2">
            {selectedPost.children.data.map((_: any, i: number) => (
              <div
                key={i}
                className={cn("w-2 h-2 rounded-full", i === currentCarouselIndex ? "bg-white" : "bg-white/50")}
              />
            ))}
          </div>
          {selectedPost.children.data.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                onClick={() => handleCarouselNav("prev")}
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                onClick={() => handleCarouselNav("next")}
              >
                <ChevronRight size={20} />
              </Button>
            </>
          )}
        </div>
      )
    }

    // For videos
    if (selectedPost.media_type === "VIDEO") {
      return <video src={selectedPost.media_url} controls className="w-full rounded-md" autoPlay playsInline />
    }

    // For images
    return (
      <Image
        src={selectedPost.media_url || "/placeholder.svg?height=500&width=500&query=instagram post"}
        alt={selectedPost.caption || "Instagram post"}
        width={500}
        height={500}
        className="w-full rounded-md"
      />
    )
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
            className="aspect-square relative cursor-pointer overflow-hidden group"
            onClick={() => {
              setSelectedPost(post)
              setCurrentCarouselIndex(0) // Reset carousel index when opening a new post
            }}
          >
            <Image
              src={getMediaUrl(post) || "/placeholder.svg"}
              alt={post.caption || "Instagram post"}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />

            {/* Video indicator */}
            {post.media_type === "VIDEO" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 rounded-full p-2">
                  <Play size={20} className="text-white" />
                </div>
              </div>
            )}

            {/* Carousel indicator */}
            {post.media_type === "CAROUSEL_ALBUM" && (
              <div className="absolute top-2 right-2">
                <div className="bg-black/50 rounded-full p-1 text-white text-xs">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="6" width="18" height="12" rx="2" />
                    <rect x="6" y="10" width="12" height="8" rx="1" />
                  </svg>
                </div>
              </div>
            )}
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
              <div className="rounded-md overflow-hidden">{renderPostMedia()}</div>

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
