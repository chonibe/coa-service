"use client"

import { useState, useEffect } from "react"
import { Music, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Input, Textarea, Button } from "@/components/ui"
import { processSpotifyUrl } from "@/lib/spotify"

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
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string; embedUrl?: string | null }>({ isValid: false })
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (!spotifyUrl) {
      setValidation({ isValid: false })
      return
    }

    setIsValidating(true)
    const timer = setTimeout(() => {
      const result = processSpotifyUrl(spotifyUrl)
      setValidation(result)
      setIsValidating(false)
      
      if (result.isValid) {
        onChange({ ...config, spotify_url: spotifyUrl })
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

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Music className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">Soundtrack</h3>
          <p className="text-sm text-gray-400">Set the mood with music</p>
        </div>
      </div>

      {/* Spotify URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Spotify Track URL <span className="text-red-400">*</span>
        </label>
        <Input
          type="url"
          placeholder="https://open.spotify.com/track/..."
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
        />
        
        {/* Validation Feedback */}
        <div className="flex items-center gap-2 text-sm">
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-gray-400">Validating...</span>
            </>
          ) : validation.isValid ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-500">Valid Spotify URL</span>
            </>
          ) : spotifyUrl && validation.error ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400">{validation.error}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Live Spotify Preview */}
      {validation.isValid && validation.embedUrl && (
        <div className="bg-gray-800 rounded-lg p-4 border border-green-500/20">
          <p className="text-sm text-gray-400 mb-3">Preview:</p>
          <iframe
            src={validation.embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full rounded"
          />
        </div>
      )}

      {/* Artist Note */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Why this track? <span className="text-gray-500">(optional)</span>
        </label>
        <Textarea
          placeholder="This song was on repeat while I worked on the final details..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          className="bg-gray-700 border-gray-600 text-white resize-none"
        />
        <p className="text-xs text-gray-500 text-right">
          {note.length}/500 characters
        </p>
      </div>

      {/* Helpful Tip */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Collectors love knowing the creative context. 
          Share why this track inspired you or what mood it captures.
        </p>
      </div>
    </div>
  )
}
