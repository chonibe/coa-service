"use client"

import { useState } from "react"
import { Music, Upload, Mic, Search, X, Loader2 } from "lucide-react"
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { SlideAudio, AudioType } from "@/lib/slides/types"

interface AudioPickerProps {
  isOpen: boolean
  onClose: () => void
  currentAudio: SlideAudio | undefined
  onSelect: (audio: SlideAudio | null) => void
}

/**
 * AudioPicker - Bottom sheet for adding audio to a slide
 * 
 * Options:
 * - Spotify search (uses existing Spotify integration)
 * - Upload audio file
 * - Record voice note
 */
export function AudioPicker({
  isOpen,
  onClose,
  currentAudio,
  onSelect,
}: AudioPickerProps) {
  const [activeTab, setActiveTab] = useState("spotify")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search Spotify
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`
      )
      const data = await response.json()
      setSearchResults(data.tracks?.items || [])
    } catch (error) {
      console.error("Spotify search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSpotifySelect = (track: any) => {
    onSelect({
      type: "spotify",
      url: track.external_urls?.spotify || track.uri,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(", "),
    })
  }

  const handleRemoveAudio = () => {
    onSelect(null)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[70vh] bg-zinc-900 border-zinc-800">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white">Audio</SheetTitle>
            {currentAudio && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAudio}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Current audio preview */}
        {currentAudio && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {currentAudio.title || "Audio"}
                </p>
                {currentAudio.artist && (
                  <p className="text-white/60 text-sm truncate">
                    {currentAudio.artist}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            <TabsTrigger value="spotify" className="data-[state=active]:bg-zinc-700">
              <Music className="w-4 h-4 mr-2" />
              Spotify
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-zinc-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="record" className="data-[state=active]:bg-zinc-700">
              <Mic className="w-4 h-4 mr-2" />
              Record
            </TabsTrigger>
          </TabsList>

          {/* Spotify search */}
          <TabsContent value="spotify" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for a song..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleSpotifySelect(track)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    {track.album?.images?.[0] && (
                      <img
                        src={track.album.images[0].url}
                        alt=""
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {track.name}
                      </p>
                      <p className="text-white/60 text-sm truncate">
                        {track.artists?.map((a: any) => a.name).join(", ")}
                      </p>
                    </div>
                  </button>
                ))}

                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <p className="text-center text-white/40 py-4">
                    No results found
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Upload audio */}
          <TabsContent value="upload" className="mt-4">
            <div className="text-center py-8">
              <Upload className="w-12 h-12 mx-auto mb-3 text-white/50" />
              <p className="text-white/60 text-sm mb-4">
                Upload an audio file (MP3, WAV, M4A)
              </p>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  // TODO: Open file picker
                  console.log("Open file picker for audio")
                }}
              >
                Choose File
              </Button>
            </div>
          </TabsContent>

          {/* Record voice note */}
          <TabsContent value="record" className="mt-4">
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-10 h-10 text-red-500" />
              </div>
              <p className="text-white/60 text-sm mb-4">
                Record a personal message for your collectors
              </p>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={() => {
                  // TODO: Start recording
                  console.log("Start voice recording")
                }}
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

export default AudioPicker
