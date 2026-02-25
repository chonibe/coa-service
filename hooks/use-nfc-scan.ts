"use client"

import { useState, useCallback, useRef, useEffect } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NDEFRecordData {
  recordType: string
  mediaType?: string
  data: string
}

export interface NFCTagData {
  serialNumber: string
  records: NDEFRecordData[]
}

export interface UseNFCScanOptions {
  onSuccess?: (tagData: NFCTagData) => void
  onError?: (error: Error) => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useNFCScan = ({ onSuccess, onError }: UseNFCScanOptions = {}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Persist the NDEFReader instance so stopScanning can abort it
  const readerRef = useRef<NDEFReader | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const isSupported =
    typeof window !== "undefined" && "NDEFReader" in window

  const isWriteSupported = isSupported // write uses the same NDEFReader API

  // --- Vibration helper ---
  const triggerVibration = useCallback((pattern: number | number[] = 200) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  // --- Start scanning ---
  const startScanning = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = "Web NFC is not supported in this browser"
      setError(errorMsg)
      onError?.(new Error(errorMsg))
      return
    }

    try {
      setIsScanning(true)
      setError(null)

      const controller = new AbortController()
      abortRef.current = controller

      const ndef = new NDEFReader()
      readerRef.current = ndef

      await ndef.scan({ signal: controller.signal })

      ndef.addEventListener(
        "reading",
        ((event: NDEFReadingEvent) => {
          const serialNumber = event.serialNumber ?? "unknown"

          // Parse all NDEF message records
          const records: NDEFRecordData[] = []
          if (event.message?.records) {
            for (const record of event.message.records) {
              const decoder = new TextDecoder()
              records.push({
                recordType: record.recordType,
                mediaType: record.mediaType || undefined,
                data: record.data ? decoder.decode(record.data) : "",
              })
            }
          }

          const tagData: NFCTagData = { serialNumber, records }

          triggerVibration([100, 50, 100]) // triple pulse
          onSuccess?.(tagData)
          setIsScanning(false)
        }) as EventListener,
        { signal: controller.signal }
      )

      ndef.addEventListener(
        "readingerror",
        (() => {
          const errorMsg = "Could not read NFC tag. Try again."
          setError(errorMsg)
          // Don't stop scanning – user can adjust position
        }) as EventListener,
        { signal: controller.signal }
      )
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "NFC scanning failed"
      setError(errorMsg)
      onError?.(new Error(errorMsg))
      setIsScanning(false)
    }
  }, [onSuccess, onError, isSupported, triggerVibration])

  // --- Stop scanning ---
  const stopScanning = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    readerRef.current = null
    setIsScanning(false)
    setError(null)
  }, [])

  // --- Write a URL to an NFC tag ---
  const writeTag = useCallback(
    async (url: string): Promise<boolean> => {
      if (!isSupported) {
        const errorMsg = "Web NFC is not supported in this browser"
        setError(errorMsg)
        onError?.(new Error(errorMsg))
        return false
      }

      try {
        setError(null)
        const ndef = new NDEFReader()
        await ndef.write({
          records: [{ recordType: "url", data: url }],
        })
        triggerVibration([100, 50, 200])
        return true
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to write NFC tag"
        setError(errorMsg)
        onError?.(new Error(errorMsg))
        return false
      }
    },
    [isSupported, onError, triggerVibration]
  )

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return {
    startScanning,
    stopScanning,
    isScanning,
    isSupported,
    isWriteSupported,
    triggerVibration,
    writeTag,
    error,
  }
}
