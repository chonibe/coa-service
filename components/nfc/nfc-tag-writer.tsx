"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Nfc,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react"

import { useNFCScan } from "@/hooks/use-nfc-scan"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NfcTagWriterProps {
  /** The URL to write to the NFC tag (should be a permanent redirect URL). */
  url: string
  /** Optional label shown above the URL. */
  label?: string
  /** Optional class names. */
  className?: string
}

type WriteState = "idle" | "ready" | "writing" | "success" | "error"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NfcTagWriter({ url, label, className }: NfcTagWriterProps) {
  const [writeState, setWriteState] = useState<WriteState>("idle")
  const { toast } = useToast()

  const { writeTag, isWriteSupported, error: nfcError } = useNFCScan()

  // --- Copy URL to clipboard (fallback) ---
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Copied",
        description: "URL copied to clipboard",
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // --- Write flow ---
  const handleWriteStart = () => setWriteState("ready")

  const handleWrite = async () => {
    setWriteState("writing")
    const ok = await writeTag(url)
    if (ok) {
      setWriteState("success")
    } else {
      setWriteState("error")
    }
  }

  const handleReset = () => setWriteState("idle")

  // ---- Render ----
  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Nfc className="h-5 w-5 text-primary" />
          {label || "NFC Tag Writer"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {/* ---- IDLE ---- */}
          {writeState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono break-all select-all">
                {url}
              </div>

              {isWriteSupported ? (
                <Button onClick={handleWriteStart} className="w-full">
                  <Nfc className="mr-2 h-4 w-4" />
                  Write to NFC Tag
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Web NFC is not supported on this device. Copy the URL and use an external NFC writer app.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleCopy}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ---- READY (confirm) ---- */}
          {writeState === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 text-center"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Nfc className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Hold your NFC tag against the back of the device, then tap "Write Now".
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleWrite}>
                  Write Now
                </Button>
              </div>
            </motion.div>
          )}

          {/* ---- WRITING ---- */}
          {writeState === "writing" && (
            <motion.div
              key="writing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Writing to tag...</p>
            </motion.div>
          )}

          {/* ---- SUCCESS ---- */}
          {writeState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm font-medium">Tag written successfully!</p>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Write Another
              </Button>
            </motion.div>
          )}

          {/* ---- ERROR ---- */}
          {writeState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-sm text-destructive">{nfcError || "Failed to write tag"}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleWrite}>
                  Retry
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
