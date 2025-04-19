"use client"

import { useState } from "react"
import Image from "next/image"
import { Instagram, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InstagramStoriesPreview } from "./instagram-stories-preview"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface InstagramFeedProps {
  artistName: string
  username: string
  posts: any[]
  stories?: any[]
  profilePicture?: string
  profileUrl?: string
}

export function InstagramFeed({
  artistName,
  username,
  posts,
  stories = [],
  profilePicture = "/creative-portrait.png",
  profileUrl,
}: InstagramFeedProps) {
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)

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

  // Always show profile and stories section, even if there are no posts
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <InstagramStoriesPreview
              artistName={artistName}
              username={username}
              profilePicture={profilePicture}
              stories={stories}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium">{artistName}</h3>
            <a
              href={profileUrl || `https://instagram.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              @{username}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {posts && posts.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div
                key={post.id}
                className="aspect-square relative cursor-pointer overflow-hidden"
                onClick={() => {
                  setSelectedPost(post)
                  setCurrentCarouselIndex(0) // Reset carousel index when opening a new post
                }}
              >
                {post.media_type === "VIDEO" ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={
                        post.thumbnail_url ||
                        post.media_url ||
                        "/placeholder.svg?height=300&width=300&query=instagram post"
                      }
                      alt={post.caption || "Instagram post"}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded-full px-1.5 py-0.5">
                      Video
                    </div>
                  </div>
                ) : post.media_type === "CAROUSEL_ALBUM" ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={post.media_url || "/placeholder.svg?height=300&width=300&query=instagram post"}
                      alt={post.caption || "Instagram post"}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded-full px-1.5 py-0.5">
                      Album
                    </div>
                  </div>
                ) : (
                  <Image
                    src={post.media_url || "/placeholder.svg?height=300&width=300&query=instagram post"}
                    alt={post.caption || "Instagram post"}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
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
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Instagram size={32} className="text-gray-400 mb-2" />
          <p className="text-gray-500">No posts available</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.open(`https://instagram.com/${username}`, "_blank")}
          >
            View Profile on Instagram
          </Button>
        </div>
      )}

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
                {selectedPost.media_type === "VIDEO" ? (
                  <video src={selectedPost.media_url} controls autoPlay playsInline className="w-full h-auto" />
                ) : selectedPost.media_type === "CAROUSEL_ALBUM" ? (
                  // For simplicity, just show the first image of the carousel
                  <Image
                    src={selectedPost.media_url || "/placeholder.svg?height=500&width=500&query=instagram post"}
                    alt={selectedPost.caption || "Instagram post"}
                    width={500}
                    height={500}
                    className="w-full object-cover"
                  />
                ) : (
                  <Image
                    src={selectedPost.media_url || "/placeholder.svg?height=500&width=500&query=instagram post"}
                    alt={selectedPost.caption || "Instagram post"}
                    width={500}
                    height={500}
                    className="w-full object-cover"
                  />
                )}
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
