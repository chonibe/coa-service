"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Play, Pause, Trash2, Loader2 } from "lucide-react"

interface VoiceRecorderProps {
  onRecorded: (audioUrl: string, duration: number) => void
  audioUrl?: string | null
}

/**
 * VoiceRecorder - Record voice notes with Safari support and Supabase upload
 * 
 * Features:
 * - MediaRecorder API with fallback for Safari
 * - Visual recording indicator
 * - Uploads to Supabase storage for persistence
 * - Playback preview
 * - Duration display
 */
export function VoiceRecorder({ onRecorded, audioUrl }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [recordedDuration, setRecordedDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string>('audio/webm')

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const uploadToSupabase = async (blob: Blob, durationSecs: number): Promise<string> => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Determine file extension based on mime type
      const ext = mimeTypeRef.current.includes('mp4') ? 'mp4' 
        : mimeTypeRef.current.includes('webm') ? 'webm' 
        : 'wav'
      
      const fileName = `voice-note-${Date.now()}.${ext}`
      const file = new File([blob], fileName, { type: mimeTypeRef.current })

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
        setRecordedDuration(durationSecs)
        return data.url
      }
      
      throw new Error('No URL returned from upload')
    } catch (err: any) {
      console.error('Voice upload error:', err)
      setError(err.message || 'Failed to upload voice note')
      throw err
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Determine mime type (Safari compatibility)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav'

      mimeTypeRef.current = mimeType

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const finalDuration = duration
        const blob = new Blob(chunksRef.current, { type: mimeType })
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null

        try {
          // Upload to Supabase and get persistent URL
          const uploadedUrl = await uploadToSupabase(blob, finalDuration)
          onRecorded(uploadedUrl, finalDuration)
        } catch {
          // Error already handled in uploadToSupabase
          // Create local URL as fallback for preview
          const localUrl = URL.createObjectURL(blob)
          setRecordedDuration(finalDuration)
          // Don't call onRecorded - let user retry
        }
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
        <Mic className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  // Show upload progress
  if (isUploading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Uploading voice note...</span>
              <span className="text-sm font-medium text-indigo-600">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
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

        <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl">
          {/* Play/Pause button */}
          <button
            onClick={togglePlayback}
            className="w-14 h-14 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 hover:bg-indigo-600 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          {/* Waveform placeholder / duration */}
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded-lg relative overflow-hidden">
              {/* Simple waveform visualization */}
              <div className="absolute inset-y-0 left-0 flex items-center gap-0.5 px-2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-indigo-500/60 rounded-full"
                    style={{
                      height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}px`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatDuration(recordedDuration)}
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={deleteRecording}
            className="p-3 text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        {isRecording ? (
          <Square className="w-10 h-10 text-white" />
        ) : (
          <Mic className="w-10 h-10 text-gray-500" />
        )}
      </button>

      {/* Duration / instructions */}
      <div className="text-gray-600">
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
        <p className="text-sm text-gray-500 mt-4">
          Tap the button to stop recording
        </p>
      )}
    </div>
  )
}

export default VoiceRecorder
