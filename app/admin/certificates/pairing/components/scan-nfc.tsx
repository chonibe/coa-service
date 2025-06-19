"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface NFCTagData {
  serialNumber: string
  id?: string
}

interface ScanNFCProps {
  onTagScanned: (tagData: NFCTagData) => void
  isScanning: boolean
}

export function ScanNFC({ onTagScanned, isScanning }: ScanNFCProps) {
  const [error, setError] = useState<string>()
  const [isWaiting, setIsWaiting] = useState(false)

  const startScanning = async () => {
    if (!("NDEFReader" in window)) {
      setError("NFC is not supported on this device")
      return
    }

    try {
      setError(undefined)
      setIsWaiting(true)

      const ndef = new window.NDEFReader()
      await ndef.scan()

      ndef.addEventListener("reading", (event: NDEFReadingEvent) => {
        if (event.serialNumber) {
          onTagScanned({ serialNumber: event.serialNumber })
        } else {
          setError("Could not read NFC tag serial number")
        }
      })

      ndef.addEventListener("readingerror", () => {
        setError("Error reading NFC tag")
      })
    } catch (err) {
      console.error("Error scanning NFC:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start NFC scanning. Please try again."
      )
    } finally {
      setIsWaiting(false)
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup function - could be used to abort NFC scanning if needed
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan NFC Tag</CardTitle>
        <CardDescription>
          Hold an NFC tag close to your device to scan it
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center p-6">
          {isScanning ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating tag...</span>
            </div>
          ) : isWaiting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for NFC tag...</span>
            </div>
          ) : (
            <Button onClick={startScanning} size="lg">
              Start Scanning
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 