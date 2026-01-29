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
  Check,
  Video
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
 * - Text, photo, video, or voice note content
 * - Supabase storage upload for media
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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
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
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [isOpen])

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'story-media')

      // Use XMLHttpRequest for upload progress
      const xhr = new XMLHttpRequest()
      
      const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } catch {
              reject(new Error('Invalid response'))
            }
          } else {
            reject(new Error('Upload failed'))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

        xhr.open('POST', '/api/vendor/media-library/upload')
        xhr.withCredentials = true
        xhr.send(formData)
      })

      const data = await uploadPromise

      if (data.url) {
        setMediaUrl(data.url)
        setMediaThumbnail(data.url)
        
        // Detect content type from file
        if (file.type.startsWith('video/')) {
          setContentType('video')
        } else {
          setContentType('photo')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload media')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
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
    if ((contentType === 'photo' || contentType === 'video' || contentType === 'voice_note') && !mediaUrl) {
      setError(`Please add a ${contentType === 'photo' ? 'photo' : contentType === 'video' ? 'video' : 'voice note'}`)
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
    (contentType === 'video' && mediaUrl) ||
    (contentType === 'voice_note' && mediaUrl)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {parentPostId ? 'Reply to post' : 'Add to Story'}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting || isUploading}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 overflow-x-auto">
          <button
            onClick={() => setContentType('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
              contentType === 'text'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Type className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
              contentType === 'photo'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Camera className="w-4 h-4" />
            Photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
              contentType === 'video'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Video className="w-4 h-4" />
            Video
          </button>
          <button
            onClick={() => setContentType('voice_note')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
              contentType === 'voice_note'
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Mic className="w-4 h-4" />
            Voice
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleMediaSelect}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Upload progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Uploading...</span>
                <span className="text-sm font-medium text-indigo-600">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Text input */}
          {contentType === 'text' && (
            <textarea
              ref={textareaRef}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Share a moment with this artwork..."
              className="w-full h-40 p-3 bg-gray-50 rounded-xl border-none resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400"
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
                className="mt-3 w-full h-20 p-3 bg-gray-50 rounded-xl border-none resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
          )}

          {/* Video preview */}
          {contentType === 'video' && mediaUrl && (
            <div className="relative">
              <video
                src={mediaUrl}
                className="w-full h-64 object-cover rounded-xl"
                controls
                muted
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
                className="mt-3 w-full h-20 p-3 bg-gray-50 rounded-xl border-none resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
          )}

          {/* Photo/Video empty state */}
          {(contentType === 'photo' || contentType === 'video') && !mediaUrl && !isUploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors"
            >
              {contentType === 'video' ? (
                <Video className="w-10 h-10 text-gray-400" />
              ) : (
                <ImageIcon className="w-10 h-10 text-gray-400" />
              )}
              <span className="text-sm text-gray-500">
                Tap to select a {contentType === 'video' ? 'video' : 'photo'}
              </span>
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
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Location bar */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            {location ? (
              <span className="text-indigo-600">
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
