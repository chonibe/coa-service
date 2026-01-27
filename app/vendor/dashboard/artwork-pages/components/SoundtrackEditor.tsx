"use client"

import React, { useState, useEffect } from "react"
import { Music, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { Input, Textarea, Label, Button } from "@/components/ui"
import { isValidSpotifyUrl, getSpotifyEmbedUrl } from "@/lib/spotify"

interface SoundtrackEditorProps {
  blockId: number
  config: {
    spotify_url?: string
    note?: string
  }
  onChange: (config: { spotify_url?: string; note?: string }) => void
}

/**
 * SoundtrackEditor - Editor for Spotify track with live preview
 * 
 * Features:
 * - Spotify URL validation
 * - Live embed preview
 * - Optional artist note
 * - Character count for note
 */
const SoundtrackEditor: React.FC<SoundtrackEditorProps> = ({
  blockId,
  config,
  onChange,
}) => {
  const [spotifyUrl, setSpotifyUrl] = useState(config.spotify_url || "")
  const [note, setNote] = useState(config.note || "")
  const [isValid, setIsValid] = useState(false)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)

  useEffect(() => {
    // Validate URL and get embed URL
    if (spotifyUrl) {
      const valid = isValidSpotifyUrl(spotifyUrl)
      setIsValid(valid)
      if (valid) {
        setEmbedUrl(getSpotifyEmbedUrl(spotifyUrl))
      } else {
        setEmbedUrl(null)
      }
    } else {
      setIsValid(false)
      setEmbedUrl(null)
    }
  }, [spotifyUrl])

  const handleSpotifyUrlChange = (value: string) => {
    setSpotifyUrl(value)
    onChange({ spotify_url: value, note })
  }

  const handleNoteChange = (value: string) => {
    setNote(value)
    onChange({ spotify_url: spotifyUrl, note: value })
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
          <Music className="h-6 w-6 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Soundtrack</h3>
          <p className="text-sm text-gray-400">Set the mood with music</p>
        </div>
      </div>

      {/* Spotify URL Input */}
      <div className="space-y-2">
        <Label htmlFor={`spotify-url-${blockId}`} className="text-white">
          Spotify Track URL
        </Label>
        <Input
          id={`spotify-url-${blockId}`}
          type="url"
          placeholder="https://open.spotify.com/track/..."
          value={spotifyUrl}
          onChange={(e) => handleSpotifyUrlChange(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white"
        />
        
        {/* Validation Status */}
        {spotifyUrl && (
          <div className="flex items-center gap-2 text-sm">
            {isValid ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Valid Spotify URL</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-500">
                  Invalid URL. Use a Spotify track link.
                </span>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Open Spotify, find a track, click Share → Copy Song Link
        </p>
      </div>

      {/* Live Preview */}
      {embedUrl && (
        <div className="space-y-2">
          <Label className="text-white">Preview</Label>
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <iframe
              src={embedUrl}
              width="100%"
              height="152"
              allow="encrypted-media"
              loading="lazy"
              className="w-full"
              style={{ border: 0 }}
            />
          </div>
        </div>
      )}

      {/* Artist Note */}
      <div className="space-y-2">
        <Label htmlFor={`note-${blockId}`} className="text-white">
          Why this track? <span className="text-gray-500">(optional but recommended)</span>
        </Label>
        <Textarea
          id={`note-${blockId}`}
          placeholder="This song was on repeat while I worked on the final details. The rhythm mirrors the visual flow I was going for..."
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          rows={4}
          maxLength={500}
          className="bg-gray-800 border-gray-700 text-white resize-none"
        />
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">
            💡 Collectors love knowing the creative context
          </span>
          <span className="text-gray-500">
            {note.length}/500 characters
          </span>
        </div>
      </div>

      {/* Help Text */}
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-400 leading-relaxed">
          <strong className="text-gray-300">Tip:</strong> Choose a track that captures 
          the mood or energy of your artwork. Music creates a powerful emotional connection 
          with collectors.
        </p>
      </div>
    </div>
  )
}

export default SoundtrackEditor
