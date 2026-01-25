"use client"

import React, { useState, useEffect } from "react"
import { Drawer } from "vaul"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Loader2, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Smartphone,
  ChevronLeft,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNFCScan } from "@/hooks/use-nfc-scan"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { WhyUnlockStep } from "./why-unlock-step"
import { ManualAuthInput } from "./manual-auth-input"
import { NFCTroubleshooting } from "./nfc-troubleshooting"

interface NFCAuthSheetProps {
  isOpen: boolean
  onClose: () => void
  item: {
    line_item_id: string
    order_id: string
    name: string
    edition_number?: number | string | null
    img_url?: string | null
  }
  artistInfo?: {
    name: string
    photo?: string | null
  }
  contentPreview?: {
    type: string
    label: string
  }[]
  onSuccess?: () => void
}

type ViewState = "why" | "howto" | "scanning" | "manual" | "success"

export function NFCAuthSheet({ 
  isOpen, 
  onClose, 
  item, 
  artistInfo,
  contentPreview = [],
  onSuccess 
}: NFCAuthSheetProps) {
  const [view, setView] = useState<ViewState>("why")
  const [isPairing, setIsPairing] = useState(false)
  const [rewardData, setRewardData] = useState<any>(null)
  const [manualAuthError, setManualAuthError] = useState<string | null>(null)
  const [isManualAuthLoading, setIsManualAuthLoading] = useState(false)
  const { toast } = useToast()

  const { startScanning, stopScanning, isScanning, isSupported, error: nfcError, triggerVibration } = useNFCScan({
    onSuccess: async (tagData) => {
      try {
        setIsPairing(true)
        const response = await fetch('/api/nfc-tags/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tagId: tagData.serialNumber,
            lineItemId: item.line_item_id,
            orderId: item.order_id,
          })
        })

        const result = await response.json()

        if (result.success) {
          triggerVibration([100, 50, 100, 50, 200])
          setRewardData(result.reward)
          setView("success")
          onSuccess?.()
        } else {
          toast({
            title: "Authentication Failed",
            description: result.message || "Unable to pair NFC tag",
            variant: "destructive"
          })
          setView("howto")
        }
      } catch (error) {
        console.error("NFC Claim Error:", error)
        toast({
          title: "Connection Error",
          description: "Failed to reach the server. Please check your connection.",
          variant: "destructive"
        })
      } finally {
        setIsPairing(false)
        stopScanning()
      }
    },
    onError: (err) => {
      console.error("NFC Hook Error:", err)
    }
  })

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView("why")
        setIsPairing(false)
        setRewardData(null)
        setManualAuthError(null)
        stopScanning()
      }, 300)
    }
  }, [isOpen, stopScanning])

  const handleManualAuth = async (code: string) => {
    setIsManualAuthLoading(true)
    setManualAuthError(null)
    
    try {
      const response = await fetch(`/api/collector/artwork/${item.line_item_id}/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ authCode: code }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Authentication failed')
      }

      const result = await response.json()
      setRewardData(result.reward)
      setView("success")
      onSuccess?.()
    } catch (err: any) {
      setManualAuthError(err.message || 'Invalid code. Please try again.')
    } finally {
      setIsManualAuthLoading(false)
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[20px] h-[85vh] max-h-[650px] fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-4" />
          
          <div className="flex-1 overflow-y-auto px-6 pb-safe-4">
            <AnimatePresence mode="wait">
              {/* Success View */}
              {view === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-6 py-10"
                >
                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200 }}
                      className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
                    >
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -inset-4 bg-green-500 rounded-full -z-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Authenticated!</h2>
                    <p className="text-muted-foreground">
                      Artwork "{item.name}" is now officially yours.
                    </p>
                  </div>

                  {rewardData && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 w-full max-w-xs"
                    >
                      <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xl mb-1">
                        <Sparkles className="w-5 h-5" />
                        <span>+{rewardData.amount || 50} Credits</span>
                      </div>
                      <p className="text-amber-700/70 dark:text-amber-400/70 text-sm">
                        Ink-O-Gatchi Reward
                      </p>
                    </motion.div>
                  )}

                  <Button 
                    onClick={onClose} 
                    className="w-full max-w-xs h-14 rounded-xl text-lg font-semibold"
                  >
                    Done
                  </Button>
                </motion.div>
              )}

              {/* Unsupported View */}
              {!isSupported && view !== "success" && view !== "manual" && (
                <motion.div
                  key="unsupported"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center">
                    <WifiOff className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Native Scan Required</h2>
                    <p className="text-muted-foreground text-sm px-4">
                      Your browser doesn't support direct NFC scanning. Please use your phone's native NFC feature.
                    </p>
                  </div>
                  
                  <div className="w-full bg-muted/50 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center flex-shrink-0">1</div>
                      <p>Close your browser</p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center flex-shrink-0">2</div>
                      <p>Hold the back of your phone near the artwork tag</p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center flex-shrink-0">3</div>
                      <p>Tap the notification to return here</p>
                    </div>
                  </div>

                  <Button onClick={() => setView("manual")} variant="outline" className="w-full rounded-xl">
                    Enter code manually instead
                  </Button>
                </motion.div>
              )}

              {/* Why Step */}
              {view === "why" && isSupported && (
                <WhyUnlockStep
                  artistName={artistInfo?.name || "the artist"}
                  artistPhoto={artistInfo?.photo}
                  contentBlocks={contentPreview}
                  onContinue={() => setView("howto")}
                />
              )}

              {/* How-To Step */}
              {view === "howto" && (
                <motion.div
                  key="howto"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full py-6"
                >
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className="w-32 h-32 bg-muted rounded-3xl flex items-center justify-center">
                      <Smartphone className="w-16 h-16 text-primary" />
                    </div>

                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-semibold">
                        Hold your phone near the tag
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-[280px]">
                        Place your phone near the NFC tag on your artwork
                      </p>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 w-full">
                      {["Back", "Certificate", "Frame"].map((location) => (
                        <div key={location} className="flex-shrink-0 w-20 h-20 bg-muted/50 rounded-xl flex items-center justify-center border border-border">
                          <span className="text-xs text-center">{location}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    <Button 
                      onClick={() => {
                        setView("scanning")
                        startScanning()
                      }}
                      className="w-full h-14 rounded-xl text-lg font-semibold"
                    >
                      Start Scanning
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-2 text-muted-foreground">or</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => setView("manual")}
                      variant="secondary"
                      className="w-full h-12 rounded-xl"
                    >
                      Enter Code Instead
                    </Button>

                    <Button
                      onClick={() => setView("why")}
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Scanning View */}
              {view === "scanning" && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col h-full py-6"
                >
                  <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.1, 0.3]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-[-20px] bg-primary/20 rounded-full"
                      />
                      <div className="relative w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold">
                        {isPairing ? "Authenticating..." : "Searching for tag..."}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-[250px]">
                        {isPairing ? "Finalizing your authentication" : "Keep your phone close and hold steady"}
                      </p>
                    </div>

                    {nfcError && (
                      <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-full text-xs font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>{nfcError}</span>
                      </div>
                    )}

                    <NFCTroubleshooting onUseManualCode={() => {
                      stopScanning()
                      setView("manual")
                    }} />
                  </div>

                  <Button 
                    onClick={() => {
                      stopScanning()
                      setView("howto")
                    }}
                    variant="ghost" 
                    className="w-full h-12 text-muted-foreground mt-auto"
                  >
                    Cancel
                  </Button>
                </motion.div>
              )}

              {/* Manual Auth View */}
              {view === "manual" && (
                <ManualAuthInput
                  onSubmit={handleManualAuth}
                  onBack={() => setView("howto")}
                  isLoading={isManualAuthLoading}
                  error={manualAuthError}
                />
              )}
            </AnimatePresence>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
