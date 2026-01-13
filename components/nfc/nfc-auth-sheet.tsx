"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Drawer } from "vaul"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Loader2, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Smartphone,
  Info,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Trophy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNFCScan } from "@/hooks/use-nfc-scan"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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
  onSuccess?: () => void
}

const steps = [
  {
    title: "Enable NFC",
    description: "Make sure NFC is turned on in your phone's settings.",
    icon: <Smartphone className="w-8 h-8 text-blue-500" />,
  },
  {
    title: "Position Tag",
    description: "Place the NFC tag near the top-back of your phone.",
    icon: <Wifi className="w-8 h-8 text-amber-500" />,
  },
  {
    title: "Keep Steady",
    description: "Hold still while we authenticate your artwork.",
    icon: <Loader2 className="w-8 h-8 text-primary animate-spin" />,
  }
]

export function NFCAuthSheet({ isOpen, onClose, item, onSuccess }: NFCAuthSheetProps) {
  const [step, setStep] = useState(0)
  const [isPairing, setIsPairing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [rewardData, setRewardData] = useState<any>(null)
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
          setShowSuccess(true)
          onSuccess?.()
        } else {
          toast({
            title: "Authentication Failed",
            description: result.message || "Unable to pair NFC tag",
            variant: "destructive"
          })
          setStep(1) // Go back to positioning
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
        setStep(0)
        setIsPairing(false)
        setShowSuccess(false)
        setRewardData(null)
      }, 300)
    }
  }, [isOpen])

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      startScanning()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Drawer.Content className="bg-white dark:bg-slate-950 flex flex-col rounded-t-[24px] h-[70vh] fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 dark:bg-slate-800 my-4" />
          
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <AnimatePresence mode="wait">
              {showSuccess ? (
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
                    <p className="text-slate-500 dark:text-slate-400">
                      Artwork "{item.name}" is now officially yours.
                    </p>
                  </div>

                  {rewardData && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-6 w-full max-w-xs"
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
                    className="w-full max-w-xs h-14 rounded-2xl text-lg font-semibold shadow-xl"
                  >
                    Done
                  </Button>
                </motion.div>
              ) : !isSupported ? (
                <motion.div
                  key="unsupported"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center">
                    <WifiOff className="w-10 h-10 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Native Scan Required</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm px-4">
                      Your browser doesn't support direct NFC scanning. Please use your phone's native NFC feature.
                    </p>
                  </div>
                  
                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">1</div>
                      <p>Close your browser</p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">2</div>
                      <p>Hold the back of your phone near the artwork tag</p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">3</div>
                      <p>Tap the notification to return here</p>
                    </div>
                  </div>

                  <Button onClick={onClose} variant="outline" className="w-full rounded-xl">
                    Got it
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="wizard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col h-full pt-4"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-1">Authenticating</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      {item.name} {item.edition_number && `· #${item.edition_number}`}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                    <motion.div
                      key={step}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative"
                    >
                      <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-[40px] flex items-center justify-center shadow-inner">
                        {isScanning || isPairing ? (
                          <div className="relative">
                            <motion.div
                              animate={{ 
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.1, 0.3]
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute inset-0 bg-primary rounded-full"
                            />
                            <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
                          </div>
                        ) : (
                          steps[step].icon
                        )}
                      </div>
                    </motion.div>

                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold">
                        {isPairing ? "Pairing Tag..." : isScanning ? "Searching for Tag" : steps[step].title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[250px]">
                        {isPairing ? "Finalizing your ownership on the blockchain..." : isScanning ? "Hold your phone steady near the tag." : steps[step].description}
                      </p>
                    </div>

                    {nfcError && (
                      <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-full text-xs font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>{nfcError}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="flex justify-center gap-1.5 mb-6">
                      {steps.map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            i === step ? "w-8 bg-primary" : "w-1.5 bg-slate-200 dark:bg-slate-800"
                          )}
                        />
                      ))}
                    </div>

                    {!isScanning && !isPairing ? (
                      <div className="flex gap-3">
                        {step > 0 && (
                          <Button 
                            onClick={handleBack} 
                            variant="outline" 
                            className="h-14 w-14 rounded-2xl"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </Button>
                        )}
                        <Button 
                          onClick={handleNext} 
                          className="flex-1 h-14 rounded-2xl text-lg font-semibold shadow-lg"
                        >
                          {step === steps.length - 1 ? "Start Scan" : "Next"}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => stopScanning()} 
                        variant="ghost" 
                        className="w-full h-12 text-slate-500 font-medium"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
