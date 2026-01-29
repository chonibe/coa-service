"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { ArrowRight, Image as ImageIcon, Video as VideoIcon } from "lucide-react"
import { Button } from "@/components/ui"
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"
import Image from "next/image"

/**
 * Step 1: Media Picker
 * Select the first image or video for the slide carousel
 */
export default function Step1MediaPicker() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [showMediaLibrary, setShowMediaLibrary] = useState(true) // Auto-open on mount
  const [nextButtonContainer, setNextButtonContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setNextButtonContainer(document.getElementById('wizard-next-button'))
  }, [])

  // Handle media selection
  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    const selected = Array.isArray(media) ? media[0] : media
    setSelectedMedia(selected)
    setShowMediaLibrary(false)

    // Store in sessionStorage for next step
    sessionStorage.setItem(`slides-wizard-${productId}`, JSON.stringify({
      step: 1,
      selectedMedia: [selected],
    }))
  }

  // Navigate to Step 2
  const handleNext = () => {
    if (!selectedMedia) return
    router.push(`/slides/${productId}/create/step2`)
  }

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        {!selectedMedia ? (
          /* No media selected - show prompt */
          <div className="text-center">
            <div className="text-6xl mb-6">🎬</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Select Your First Media
            </h2>
            <p className="text-white/70 mb-8 max-w-md">
              Choose an image or video to start your slide. You can add more media in the next step.
            </p>
            <Button
              onClick={() => setShowMediaLibrary(true)}
              size="lg"
              className="bg-white text-black hover:bg-white/90"
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Choose Media
            </Button>
          </div>
        ) : (
          /* Media selected - show preview */
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-black border-2 border-white/20 mb-6">
              {selectedMedia.type === 'image' ? (
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  className="w-full h-full object-cover"
                  controls
                />
              )}

              {/* Media type indicator */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="flex items-center gap-2 text-white text-sm">
                  {selectedMedia.type === 'image' ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <VideoIcon className="w-4 h-4" />
                  )}
                  <span className="font-medium capitalize">{selectedMedia.type}</span>
                </div>
              </div>
            </div>

            <p className="text-white/70 text-center mb-4">
              {selectedMedia.name}
            </p>

            <Button
              variant="outline"
              onClick={() => setShowMediaLibrary(true)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Change Media
            </Button>
          </div>
        )}
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={showMediaLibrary}
        onOpenChange={setShowMediaLibrary}
        onSelect={handleMediaSelect}
        mode="single"
        allowedTypes={["image", "video"]}
        title="Select First Media"
      />

      {/* Next Button (portal to header) */}
      {nextButtonContainer && selectedMedia && createPortal(
        <Button
          onClick={handleNext}
          size="sm"
          className="bg-white text-black hover:bg-white/90"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>,
        nextButtonContainer
      )}
    </>
  )
}
