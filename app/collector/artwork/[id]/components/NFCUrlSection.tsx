"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, QrCode, Download, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface NFCUrlSectionProps {
  artworkId: string
}

export function NFCUrlSection({ artworkId }: NFCUrlSectionProps) {
  const [nfcUrl, setNfcUrl] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchNfcUrl = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/collector/artwork/${artworkId}/nfc-url`, {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setNfcUrl(data.nfcUrl)
          setInstructions(data.instructions || [])
        }
      } catch (err) {
        console.error("Failed to fetch NFC URL:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNfcUrl()
  }, [artworkId])

  const handleCopy = async () => {
    if (!nfcUrl) return

    try {
      await navigator.clipboard.writeText(nfcUrl)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "NFC URL copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the URL manually",
      })
    }
  }

  if (!nfcUrl) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Your Own NFC Tag</CardTitle>
        <CardDescription>
          Use this URL with any NFC writing app to program your own tag
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">NFC Authentication URL</Label>
          <div className="flex gap-2">
            <Input
              value={nfcUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {instructions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Instructions</Label>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {instructions.map((instruction, idx) => (
                <li key={idx}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Open QR code generator or download NFC file
              window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(nfcUrl)}`, "_blank")
            }}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Show QR Code
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
