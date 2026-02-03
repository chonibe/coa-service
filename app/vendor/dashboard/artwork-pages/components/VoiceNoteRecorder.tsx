"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Play, Pause, Upload, Trash2, Loader2, Pencil, X, CheckCircle, RotateCcw } from "lucide-react"
import { Button, Input, Textarea } from "@/components/ui"
import { useToast } from "@/components/ui/use-toast"

interface VoiceNoteRecorderProps {
  blockId: number
  config: {
    title?: string
    audio_url?: string
    transcript?: string
  }
  onChange: (config: any) => void
}

export default function VoiceNoteRecorder({
  blockId,
  config,
  onChange
}: VoiceNoteRecorderProps) {
  const [title, setTitle] = useState(config.title || "")
  const [transcript, setTranscript] = useState(config.transcript || "")
  const contentUrl = config.audio_url
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Sync audio time
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [contentUrl, recordedBlob])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setRecordedBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to record your voice note.",
        variant: "destructive"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "audio")

      const response = await fetch("/api/vendor/media-library/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Upload failed")
      }

      const data = await response.json()
      return data.file.url
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const uploadRecording = async () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" })
      const url = await uploadFile(file)
      if (url) {
        onChange({ ...config, audio_url: url })
        setRecordedBlob(null)
        toast({ title: "Voice note saved!", description: "Collectors will hear your personal message" })
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = await uploadFile(file)
      if (url) {
        onChange({ ...config, audio_url: url })
        toast({ title: "Audio uploaded!", description: "Your voice note is ready" })
      }
    }
    e.target.value = ""
  }

  const togglePlayback = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = parseFloat(e.target.value)
    }
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    onChange({ ...config, title: newTitle })
  }

  const handleTranscriptChange = (newTranscript: string) => {
    setTranscript(newTranscript)
    onChange({ ...config, transcript: newTranscript })
  }

  const removeAudio = () => {
    onChange({ ...config, audio_url: undefined })
  }

  // Has uploaded audio - show preview-first player
  if (contentUrl) {
    return (
      <div className="space-y-4">
        {/* Collector-style Audio Player Preview */}
        <div className="bg-gradient-to-br from-purple-100 to-violet-50 rounded-2xl p-6 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Large Play Button */}
            <button
              onClick={togglePlayback}
              className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center shadow-lg transition-all active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 text-white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-1" />
              )}
            </button>

            {/* Progress and Time */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{title || "Voice Note"}</span>
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              
              {/* Progress Bar */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>
          
          <audio ref={audioRef} src={contentUrl} preload="metadata" />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex-1"
          >
            {showTranscript ? "Hide" : "Add"} Transcript
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`audio-replace-${blockId}`)?.click()}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Replace
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeAudio}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Title Input (collapsible) */}
        <Input
          type="text"
          placeholder="Title (e.g., 'A Note from the Artist')"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="bg-white border-gray-200"
        />

        {/* Transcript (collapsible) */}
        {showTranscript && (
          <Textarea
            placeholder="Add a transcript for accessibility..."
            value={transcript}
            onChange={(e) => handleTranscriptChange(e.target.value)}
            rows={3}
            className="bg-white border-gray-200 resize-none"
          />
        )}

        <input
          id={`audio-replace-${blockId}`}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  // Recording in progress
  if (isRecording) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-200 text-center">
          {/* Pulsing recording indicator */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute w-24 h-24 rounded-full bg-red-400/30 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-red-500 flex items-center justify-center">
              <Mic className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <p className="text-3xl font-mono text-gray-900 mb-4">{formatTime(recordingTime)}</p>
          <p className="text-sm text-gray-600 mb-6">Recording your message...</p>
          
          <Button
            onClick={stopRecording}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white px-8"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop Recording
          </Button>
        </div>
      </div>
    )
  }

  // Recorded but not uploaded
  if (recordedBlob) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={togglePlayback}
              className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center shadow-md transition-all"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Recording Preview</p>
              <p className="text-sm text-gray-500">{formatTime(recordingTime)} recorded</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          
          <audio ref={audioRef} src={URL.createObjectURL(recordedBlob)} />
          
          <div className="flex gap-2">
            <Button 
              onClick={uploadRecording} 
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Voice Note
                </>
              )}
            </Button>
            <Button
              onClick={() => setRecordedBlob(null)}
              variant="outline"
              className="bg-white"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Re-record
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state - big record button
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border-2 border-dashed border-purple-200 text-center">
        {/* Large Record Button */}
        <button
          onClick={startRecording}
          className="w-24 h-24 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center mx-auto mb-4 shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Mic className="w-12 h-12 text-white" />
        </button>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-1">Record a Voice Note</h4>
        <p className="text-sm text-gray-600 mb-6">
          Leave a personal message for your collectors
        </p>
        
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-400">or</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => document.getElementById(`audio-upload-${blockId}`)?.click()}
            className="text-purple-600 hover:text-purple-700"
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload Audio File
          </Button>
        </div>
      </div>

      <input
        id={`audio-upload-${blockId}`}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Quick tip */}
      <p className="text-xs text-center text-gray-400">
        Tip: 1-3 minutes is ideal. Share your inspiration or a message to collectors.
      </p>
    </div>
  )
}
