"use client"

import { useState, useEffect, useRef } from "react"
import { Music, CheckCircle, AlertCircle, Loader2, ExternalLink, Pencil, X, Sparkles } from "lucide-react"
import { Input, Textarea, Button } from "@/components/ui"
import { processSpotifyUrl, getSpotifyContentTypeLabel } from "@/lib/spotify"

interface SoundtrackEditorProps {
  blockId: number
  config: {
    spotify_url?: string
    note?: string
  }
  onChange: (config: any) => void
}

export default function SoundtrackEditor({ blockId, config, onChange }: SoundtrackEditorProps) {
  const [spotifyUrl, setSpotifyUrl] = useState(config.spotify_url || "")
  const [note, setNote] = useState(config.note || "")
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string; embedUrl?: string | null; contentType?: string | null }>({ isValid: false })
  const [isValidating, setIsValidating] = useState(false)
  const [isEditing, setIsEditing] = useState(!config.spotify_url) // Start in edit mode if no URL
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  useEffect(() => {
    if (!spotifyUrl) {
      setValidation({ isValid: false })
      return
    }

    setIsValidating(true)
    const timer = setTimeout(() => {
      const result = processSpotifyUrl(spotifyUrl)
      setValidation({
        isValid: result.isValid,
        error: result.error,
        embedUrl: result.embedUrl,
        contentType: result.contentType,
      })
      setIsValidating(false)
      
      if (result.isValid) {
        onChange({ ...config, spotify_url: spotifyUrl })
        // Auto-collapse edit mode after successful validation
        setTimeout(() => setIsEditing(false), 500)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [spotifyUrl])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (note !== config.note) {
        onChange({ ...config, note })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [note])

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.includes("spotify.com")) {
        setSpotifyUrl(text)
      }
    } catch (err) {
      // Clipboard access denied - user will type manually
    }
  }

  // If we have a valid URL, show preview-first
  const hasValidTrack = validation.isValid && validation.embedUrl

  return (
    <div className="space-y-4">
      {/* Preview-First: Show the Spotify embed prominently when we have a valid URL */}
      {hasValidTrack && !isEditing ? (
        <div className="space-y-4">
          {/* Collector Preview - Exactly what they'll see */}
          <div className="relative group">
            <div className="rounded-xl overflow-hidden shadow-lg bg-black">
              <iframe
                src={validation.embedUrl!}
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="w-full"
                style={{ borderRadius: "12px" }}
              />
            </div>
            
            {/* Edit overlay on hover */}
            <button
              onClick={() => setIsEditing(true)}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
            >
              <div className="flex items-center gap-2 text-white font-medium">
                <Pencil className="w-5 h-5" />
                Change Track
              </div>
            </button>
          </div>

          {/* Artist Note Preview */}
          {note ? (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-gray-700 italic">"{note}"</p>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
            >
              + Add a note about this track
            </button>
          )}

          {/* Quick edit button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
        </div>
      ) : (
        /* Edit Mode / Empty State */
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Music className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Soundtrack</h3>
                <p className="text-sm text-gray-500">Set the mood with music</p>
              </div>
            </div>
            {hasValidTrack && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Empty State with Paste Helper */}
          {!spotifyUrl && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center border border-green-100">
              <Sparkles className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Add a Spotify Track</h4>
              <p className="text-sm text-gray-600 mb-4">
                Share the music that inspired this artwork
              </p>
              <Button onClick={handlePaste} className="bg-green-600 hover:bg-green-700 text-white">
                Paste Spotify Link
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                or type/paste below
              </p>
            </div>
          )}

          {/* Spotify URL Input */}
          <div className="space-y-2">
            <Input
              ref={inputRef}
              type="url"
              placeholder="Paste Spotify link here..."
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              className="bg-white border-gray-300 text-gray-900 text-base py-3"
            />
            
            {/* Validation Feedback */}
            <div className="flex items-center gap-2 text-sm min-h-[24px]">
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                  <span className="text-gray-500">Checking link...</span>
                </>
              ) : validation.isValid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">
                    {validation.contentType ? getSpotifyContentTypeLabel(validation.contentType as any) : "Track"} found!
                  </span>
                </>
              ) : spotifyUrl && validation.error ? (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600">{validation.error}</span>
                </>
              ) : (
                <span className="text-gray-400 text-xs">
                  Works with tracks, albums, playlists, podcasts, and artists
                </span>
              )}
            </div>
          </div>

          {/* Live Preview while editing */}
          {validation.isValid && validation.embedUrl && (
            <div className="rounded-xl overflow-hidden shadow-md bg-black">
              <iframe
                src={validation.embedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="w-full"
              />
            </div>
          )}

          {/* Artist Note */}
          {(validation.isValid || note) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Why this track? <span className="text-gray-400">(optional)</span>
              </label>
              <Textarea
                placeholder="This song was on repeat while I worked on the final details..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                className="bg-white border-gray-300 text-gray-900 resize-none"
              />
              <p className="text-xs text-gray-400 text-right">
                {note.length}/500
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
