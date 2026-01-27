"use client"

import { useState, useRef } from "react"
import { Mic, Square, Play, Pause, Upload, Trash2, Loader2 } from "lucide-react"
import { Button, Input, Textarea } from "@/components/ui"
import { useToast } from "@/components/ui/use-toast"

interface VoiceNoteRecorderProps {
  title: string
  contentUrl?: string
  transcript?: string
  onUpdate: (updates: { title?: string; transcript?: string }) => void
  onFileUpload: (file: File, type: string) => void
}

export default function VoiceNoteRecorder({
  title: initialTitle,
  contentUrl,
  transcript: initialTranscript,
  onUpdate,
  onFileUpload
}: VoiceNoteRecorderProps) {
  const [title, setTitle] = useState(initialTitle || "")
  const [transcript, setTranscript] = useState(initialTranscript || "")
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

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
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
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

  const uploadRecording = () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" })
      onFileUpload(file, "audio")
      setRecordedBlob(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file, "audio")
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    setTimeout(() => onUpdate({ title: newTitle }), 500)
  }

  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTranscript = e.target.value
    setTranscript(newTranscript)
    setTimeout(() => onUpdate({ transcript: newTranscript }), 500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Mic className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">Voice Note</h3>
          <p className="text-sm text-gray-400">Leave a personal message for collectors</p>
        </div>
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Title</label>
        <Input
          type="text"
          placeholder="About this piece"
          value={title}
          onChange={handleTitleChange}
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      {/* Recording Interface */}
      <div className="bg-gradient-to-br from-purple-900/20 to-gray-800 rounded-lg p-6 border border-purple-500/30">
        {!contentUrl && !recordedBlob ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              {isRecording ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-500 animate-pulse flex items-center justify-center mb-4">
                    <Mic className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-white text-xl font-mono">{formatTime(recordingTime)}</p>
                  <Button
                    onClick={stopRecording}
                    variant="outline"
                    className="mt-4 bg-gray-800 border-gray-700"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-500"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                  <p className="text-gray-400 text-sm mt-4">Or</p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("audio-file-input")?.click()}
                    className="mt-2 bg-gray-800 border-gray-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Audio File
                  </Button>
                  <input
                    id="audio-file-input"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>
        ) : recordedBlob ? (
          <div className="space-y-4">
            <audio
              ref={audioRef}
              src={URL.createObjectURL(recordedBlob)}
              onEnded={() => setIsPlaying(false)}
            />
            <div className="flex items-center gap-4">
              <Button
                onClick={togglePlayback}
                variant="outline"
                className="bg-purple-600 hover:bg-purple-500 border-0"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <p className="text-gray-300">Recording ready</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={uploadRecording} className="flex-1 bg-green-600 hover:bg-green-500">
                <Upload className="h-4 w-4 mr-2" />
                Upload Recording
              </Button>
              <Button
                onClick={() => setRecordedBlob(null)}
                variant="outline"
                className="bg-gray-800 border-gray-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-green-500">Audio uploaded successfully</p>
            <Button
              onClick={() => document.getElementById("audio-file-input")?.click()}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700"
            >
              Replace
            </Button>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Transcript <span className="text-gray-500">(optional)</span>
        </label>
        <Textarea
          placeholder="Transcript of your voice note (for accessibility)"
          value={transcript}
          onChange={handleTranscriptChange}
          rows={4}
          className="bg-gray-700 border-gray-600 text-white resize-none"
        />
      </div>

      {/* Tip */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Keep it personal - 1-3 minutes is ideal. Share your inspiration, process, or a message to collectors.
        </p>
      </div>
    </div>
  )
}
