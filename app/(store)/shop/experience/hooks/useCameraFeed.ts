'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraFeedStatus = 'idle' | 'loading' | 'active' | 'denied' | 'error'

export interface UseCameraFeedResult {
  /** Ref to attach to a <video> element */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Current status of the camera feed */
  status: CameraFeedStatus
  /** Error message when status is 'denied' or 'error' */
  error: string | null
  /** Request camera access and start the stream. Call when user enables AR mode. */
  requestAccess: () => Promise<void>
  /** Stop the stream and release the camera. Call when user disables AR mode or unmount. */
  stopStream: () => void
  /** Whether getUserMedia is supported (secure context + API available) */
  isSupported: boolean
}

function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.isSecureContext === true
}

function isGetUserMediaSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  const n = navigator as Navigator & { mediaDevices?: { getUserMedia?: unknown } }
  return !!(n.mediaDevices?.getUserMedia ?? (n as any).getUserMedia)
}

/**
 * Hook to manage device camera stream for AR-style preview.
 * Handles permission, lifecycle, and cleanup.
 */
export function useCameraFeed(): UseCameraFeedResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraFeedStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const isSupported = isSecureContext() && isGetUserMediaSupported()

  const stopStream = useCallback(() => {
    const stream = streamRef.current
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStatus((prev) => (prev === 'active' ? 'idle' : prev))
    setError(null)
  }, [])

  const requestAccess = useCallback(async () => {
    if (!isSupported) {
      setStatus('error')
      setError('Camera is not available (requires HTTPS)')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      stopStream()
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => {
          // Autoplay may be restricted; video often still works on first user interaction
        })
      }
      setStatus('active')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('Permission') || message.includes('denied') || message.includes('NotAllowed')) {
        setStatus('denied')
        setError('Camera permission was denied')
      } else if (message.includes('NotFound') || message.includes('no device')) {
        setStatus('error')
        setError('No camera found')
      } else {
        setStatus('error')
        setError(message || 'Could not access camera')
      }
    }
  }, [isSupported, stopStream])

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [stopStream])

  // When videoRef gets a new element and we have an active stream, attach it
  useEffect(() => {
    if (status !== 'active' || !streamRef.current) return
    const video = videoRef.current
    if (video && !video.srcObject) {
      video.srcObject = streamRef.current
      video.play().catch(() => {})
    }
  }, [status])

  return {
    videoRef,
    status,
    error,
    requestAccess,
    stopStream,
    isSupported,
  }
}
