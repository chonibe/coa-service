import { useState } from 'react'
import { toast } from '@/components/ui/use-toast'

interface NFCTagData {
  serialNumber: string
  id?: string
}

interface UseNFCScanOptions {
  onSuccess?: (tagData: NFCTagData) => void
  onError?: (error: string) => void
}

export function useNFCScan({ onSuccess, onError }: UseNFCScanOptions = {}) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>()

  const startScanning = async () => {
    if (!("NDEFReader" in window)) {
      const errorMsg = "NFC is not supported on this device"
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    try {
      setError(undefined)
      setIsScanning(true)

      const ndef = new window.NDEFReader()
      await ndef.scan()

      ndef.addEventListener("reading", (event: NDEFReadingEvent) => {
        if (event.serialNumber) {
          const tagData = { serialNumber: event.serialNumber }
          onSuccess?.(tagData)
        } else {
          const errorMsg = "Could not read NFC tag serial number"
          setError(errorMsg)
          onError?.(errorMsg)
        }
      })

      ndef.addEventListener("readingerror", () => {
        const errorMsg = "Error reading NFC tag"
        setError(errorMsg)
        onError?.(errorMsg)
      })
    } catch (err) {
      console.error("Error scanning NFC:", err)
      const errorMsg = err instanceof Error
        ? err.message
        : "Failed to start NFC scanning. Please try again."
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    setError(undefined)
  }

  return {
    startScanning,
    stopScanning,
    isScanning,
    error
  }
} 