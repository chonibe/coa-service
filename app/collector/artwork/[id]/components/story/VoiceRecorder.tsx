"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Play, Pause, Trash2, Loader2 } from "lucide-react"

interface VoiceRecorderProps {
  onRecorded: (audioUrl: string, duration: number) => void
  audioUrl?: string | null
}

/**
 * VoiceRecorder - Record voice notes with Safari support
 * 
 * Features:
 * - MediaRecorder API with fallback for Safari
 * - Visual recording indicator
 * - Playback preview
 * - Duration display
 */
export function VoiceRecorder({ onRecorded, audioUrl }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordedDuration, setRecordedDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Check support on mount
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false)
      setError('Voice recording is not supported on this device')
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Determine mime type (Safari compatibility)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setRecordedDuration(duration)
        onRecorded(url, duration)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms

      setIsRecording(true)
      setDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
    } catch (err: any) {
      console.error('Recording error:', err)
      setError(err.message || 'Failed to start recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
  }

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
    setRecordedDuration(0)
    onRecorded('', 0)
  }

  // Format duration as M:SS
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins}:${s.toString().padStart(2, '0')}`
  }

  if (!isSupported) {
    return (
      <div className="p-6 text-center">
        <Mic className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    )
  }

  // Show playback if we have a recording
  if (audioUrl) {
    return (
      <div className="p-6">
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        <div className="flex items-center gap-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          {/* Play/Pause button */}
          <button
            onClick={togglePlayback}
            className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 hover:bg-blue-600 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          {/* Waveform placeholder / duration */}
          <div className="flex-1">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg relative overflow-hidden">
              {/* Simple waveform visualization */}
              <div className="absolute inset-y-0 left-0 flex items-center gap-0.5 px-2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500/60 rounded-full"
                    style={{
                      height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}px`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="text-sm text-zinc-500 mt-1">
              {formatDuration(recordedDuration)}
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={deleteRecording}
            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Recording interface
  return (
    <div className="p-6 text-center">
      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {/* Recording button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${
          isRecording
            ? 'bg-red-500 animate-pulse'
            : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
        }`}
      >
        {isRecording ? (
          <Square className="w-10 h-10 text-white" />
        ) : (
          <Mic className="w-10 h-10 text-zinc-500" />
        )}
      </button>

      {/* Duration / instructions */}
      <div className="text-zinc-600 dark:text-zinc-400">
        {isRecording ? (
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-2xl font-mono">{formatDuration(duration)}</span>
          </div>
        ) : (
          <p className="text-sm">Tap to record a voice note</p>
        )}
      </div>

      {isRecording && (
        <p className="text-sm text-zinc-500 mt-4">
          Tap the button to stop recording
        </p>
      )}
    </div>
  )
}

export default VoiceRecorder
