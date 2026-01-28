"use client"

import { useState, useRef, useEffect } from "react"
import { 
  X, 
  Camera, 
  Mic, 
  Type, 
  MapPin, 
  Loader2,
  Image as ImageIcon,
  Check
} from "lucide-react"
import { LocationPicker } from "./LocationPicker"
import { VoiceRecorder } from "./VoiceRecorder"
import type { StoryPost, ContentType, LocationData } from "@/lib/story/types"

interface AddToStorySheetProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  isArtist: boolean
  parentPostId?: string // For replies
  onPostCreated: (post: StoryPost) => void
}

/**
 * AddToStorySheet - Full-screen bottom sheet for creating story posts
 * 
 * Features:
 * - Text, photo, or voice note content
 * - Location picker (geolocation + manual)
 * - Safe area padding
 */
export function AddToStorySheet({
  isOpen,
  onClose,
  productId,
  isArtist,
  parentPostId,
  onPostCreated,
}: AddToStorySheetProps) {
  const [contentType, setContentType] = useState<ContentType>('text')
  const [textContent, setTextContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaThumbnail, setMediaThumbnail] = useState<string | null>(null)
  const [voiceDuration, setVoiceDuration] = useState<number>(0)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when opened with text mode
  useEffect(() => {
    if (isOpen && contentType === 'text' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, contentType])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setContentType('text')
      setTextContent('')
      setMediaUrl(null)
      setMediaThumbnail(null)
      setVoiceDuration(0)
      setLocation(null)
      setError(null)
    }
  }, [isOpen])

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // TODO: Upload to storage and get URL
    // For now, create object URL for preview
    const url = URL.createObjectURL(file)
    setMediaUrl(url)
    setMediaThumbnail(url)
    setContentType('photo')
  }

  const handleVoiceRecorded = (audioUrl: string, duration: number) => {
    setMediaUrl(audioUrl)
    setVoiceDuration(duration)
    setContentType('voice_note')
  }

  const handleSubmit = async () => {
    // Validate
    if (contentType === 'text' && !textContent.trim()) {
      setError('Please enter some text')
      return
    }
    if ((contentType === 'photo' || contentType === 'voice_note') && !mediaUrl) {
      setError(`Please add a ${contentType === 'photo' ? 'photo' : 'voice note'}`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const apiBase = isArtist 
        ? `/api/vendor/story/${productId}`
        : `/api/collector/story/${productId}`

      const response = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          content_type: contentType,
          text_content: textContent || undefined,
          media_url: mediaUrl || undefined,
          media_thumbnail_url: mediaThumbnail || undefined,
          voice_duration_seconds: voiceDuration || undefined,
          city: location?.city,
          country: location?.country,
          country_code: location?.country_code,
          parent_post_id: parentPostId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post')
      }

      onPostCreated(data.post)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = 
    (contentType === 'text' && textContent.trim()) ||
    (contentType === 'photo' && mediaUrl) ||
    (contentType === 'voice_note' && mediaUrl)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {parentPostId ? 'Reply to post' : 'Add to Story'}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Post
          </button>
        </div>

        {/* Content type tabs */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setContentType('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              contentType === 'text'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Type className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              contentType === 'photo'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Camera className="w-4 h-4" />
            Photo
          </button>
          <button
            onClick={() => setContentType('voice_note')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              contentType === 'voice_note'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Mic className="w-4 h-4" />
            Voice
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Text input */}
          {contentType === 'text' && (
            <textarea
              ref={textareaRef}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Share a moment with this artwork..."
              className="w-full h-40 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none resize-none focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
            />
          )}

          {/* Photo preview */}
          {contentType === 'photo' && mediaUrl && (
            <div className="relative">
              <img
                src={mediaUrl}
                alt="Selected photo"
                className="w-full h-64 object-cover rounded-xl"
              />
              <button
                onClick={() => {
                  setMediaUrl(null)
                  setMediaThumbnail(null)
                }}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Caption input */}
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Add a caption..."
                className="mt-3 w-full h-20 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none resize-none focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
              />
            </div>
          )}

          {/* Photo empty state */}
          {contentType === 'photo' && !mediaUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
            >
              <ImageIcon className="w-10 h-10 text-zinc-400" />
              <span className="text-sm text-zinc-500">Tap to select a photo</span>
            </button>
          )}

          {/* Voice recorder */}
          {contentType === 'voice_note' && (
            <VoiceRecorder
              onRecorded={handleVoiceRecorded}
              audioUrl={mediaUrl}
            />
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Location bar */}
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-500 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            {location ? (
              <span className="text-blue-600 dark:text-blue-400">
                {location.city ? `${location.city}, ` : ''}{location.country}
              </span>
            ) : (
              'Add location'
            )}
          </button>
        </div>
      </div>

      {/* Location picker sheet */}
      {showLocationPicker && (
        <LocationPicker
          currentLocation={location}
          onSelect={(loc) => {
            setLocation(loc)
            setShowLocationPicker(false)
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  )
}

export default AddToStorySheet
