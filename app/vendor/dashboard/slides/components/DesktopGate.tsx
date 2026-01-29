"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Smartphone, Monitor } from "lucide-react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"

interface DesktopGateProps {
  /** Current URL to encode in QR code */
  currentUrl?: string
  /** Title shown to user */
  title?: string
  /** Description text */
  description?: string
  /** Callback when user clicks "Continue on Desktop" (dev mode only) */
  onContinueDesktop?: () => void
  /** Show dev mode bypass button */
  showDevBypass?: boolean
}

/**
 * Desktop Gate component
 * 
 * Shows a QR code and message prompting users to open the slide editor on mobile.
 * The slide editor uses touch gestures (drag, pinch, rotate) that work best on mobile.
 * 
 * In development mode, shows a "Continue on Desktop" button to bypass.
 */
export function DesktopGate({
  currentUrl,
  title = "Open on Mobile",
  description = "The slide editor uses touch gestures for the best creative experience. Scan the QR code to continue on your phone.",
  onContinueDesktop,
  showDevBypass = false,
}: DesktopGateProps) {
  const [url, setUrl] = useState<string>("")

  useEffect(() => {
    if (currentUrl) {
      setUrl(currentUrl)
    } else if (typeof window !== "undefined") {
      // Add ?dev=1 to the URL for dev bypass
      const baseUrl = window.location.href
      setUrl(baseUrl)
    }
  }, [currentUrl])

  const handleContinueDesktop = () => {
    if (onContinueDesktop) {
      onContinueDesktop()
    } else if (typeof window !== "undefined") {
      // Add ?dev=1 query param to bypass
      const url = new URL(window.location.href)
      url.searchParams.set("dev", "1")
      window.location.href = url.toString()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* QR Code */}
          {url && (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <QRCodeSVG
                  value={url}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. Open your camera app</p>
            <p>2. Point at the QR code</p>
            <p>3. Tap the notification to open</p>
          </div>

          {/* Dev bypass */}
          {showDevBypass && (
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleContinueDesktop}
                className="text-muted-foreground hover:text-foreground"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Continue on Desktop (Dev Mode)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DesktopGate
