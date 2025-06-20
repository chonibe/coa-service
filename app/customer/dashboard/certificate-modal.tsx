"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { X, BadgeIcon as Certificate, User, Calendar, Hash, ExternalLink, Award, Sparkles, Signature, Wifi, WifiOff, Album, Scan, Loader2, Smartphone, CheckCircle2 } from "lucide-react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Add shimmer effect styles
const shimmerStyles = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes golden-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.6);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.golden-glow {
  animation: golden-glow 3s ease-in-out infinite;
}

.float {
  animation: float 6s ease-in-out infinite;
}

.signature-font {
  font-family: 'Brush Script MT', cursive, serif;
  font-style: italic;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.progress-bar {
  transition: width 0.3s ease-in-out;
}

.certificate-border {
  background: linear-gradient(45deg, #fbbf24, #d97706, #92400e);
  background-size: 200% 200%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`

function PostcardCertificate({ children, className = "", isFlipped = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { 
  isFlipped?: boolean
}) {
  return (
    <>
      <style>{shimmerStyles}</style>
      <div
        className={`relative bg-gradient-to-br from-zinc-900/95 via-zinc-800/95 to-zinc-900/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden golden-glow ${className}`}
        style={{ 
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "none",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        {...props}
      >
        {/* Premium border gradient */}
        <div className="absolute inset-0 certificate-border p-[1px] rounded-xl opacity-75">
          <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-xl" />
        </div>
        
        <div className="relative z-20 h-full">
          {children}
        </div>
      </div>
    </>
  )
}

interface LineItem {
  line_item_id: string
  name: string
  description?: string
  img_url?: string
  vendor_name?: string
  edition_number?: number | null
  edition_total?: number | null
  price?: number
  certificate_url?: string
  certificate_token?: string
  nfc_tag_id?: string | null
  nfc_claimed_at?: string | null
  status?: string
  order_id?: string
}

interface CertificateModalProps {
  lineItem: LineItem | null
  onClose: () => void
}

export function CertificateModal({ lineItem, onClose }: CertificateModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isNfcPairing, setIsNfcPairing] = useState(false)
  const [showNfcWizard, setShowNfcWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  useEffect(() => {
    setIsOpen(!!lineItem)
    setIsFlipped(false)
    
    // Debug logging
    console.log('Certificate Modal Debug:', {
      lineItem,
      nfcStatus: lineItem ? (
        lineItem.nfc_tag_id 
          ? (lineItem.nfc_claimed_at ? "paired" : "unpaired")
          : "no-nfc"
      ) : null
    })
  }, [lineItem])

  if (!lineItem) return null

  const artistName = lineItem.vendor_name || "Street Collector"
  const editionInfo = lineItem.edition_number && lineItem.edition_total
    ? `${lineItem.edition_number} of ${lineItem.edition_total}`
    : lineItem.edition_number 
    ? `${lineItem.edition_number}`
    : "Limited Edition"

  const nfcStatus = lineItem.nfc_tag_id 
    ? (lineItem.nfc_claimed_at ? "paired" : "unpaired")
    : "no-nfc"

  // Debug logging
  console.log('NFC Status Debug:', {
    nfcTagId: lineItem.nfc_tag_id,
    nfcClaimedAt: lineItem.nfc_claimed_at,
    status: nfcStatus
  })

  const handleNfcPairing = async () => {
    setShowNfcWizard(true)
    setWizardStep(1)
  }

  const startNfcScan = async () => {
    // Check if Web NFC is supported
    if ('NDEFReader' in window) {
      try {
        setIsNfcPairing(true)
        setWizardStep(2)
        const ndef = new window.NDEFReader()
        await ndef.scan()

        ndef.addEventListener("reading", async ({ message, serialNumber }) => {
          try {
            setWizardStep(3)
            // Send tag to backend for verification and claim
            const response = await fetch('/api/nfc-tags/claim', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tagId: serialNumber,
                lineItemId: lineItem?.line_item_id,
                orderId: lineItem?.order_id,
                customerId: null // TODO: Get actual customer ID
              })
            })

            const result = await response.json()

            if (result.success) {
              setWizardStep(4)
              toast({
                title: "NFC Tag Paired",
                description: "Your artwork has been successfully authenticated.",
                variant: "default"
              })
              // Close wizard after 2 seconds of success
              setTimeout(() => {
                setShowNfcWizard(false)
                onClose()
              }, 2000)
            } else {
              toast({
                title: "Pairing Failed",
                description: result.message || "Unable to pair NFC tag",
                variant: "destructive"
              })
              setWizardStep(1)
            }
          } catch (error) {
            console.error("NFC Claim Error:", error)
            toast({
              title: "Pairing Error",
              description: "An unexpected error occurred",
              variant: "destructive"
            })
            setWizardStep(1)
          } finally {
            setIsNfcPairing(false)
          }
        })
      } catch (error) {
        console.error("NFC Scanning Error:", error)
        toast({
          title: "NFC Error",
          description: "Unable to start NFC scanning",
          variant: "destructive"
        })
        setIsNfcPairing(false)
        setWizardStep(1)
      }
    } else {
      toast({
        title: "Unsupported Browser",
        description: "Web NFC is not supported in your browser",
        variant: "destructive"
      })
      setWizardStep(1)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="w-full p-0 overflow-hidden rounded-none sm:max-w-4xl sm:rounded-xl">
          <DialogHeader className="absolute top-0 left-0 right-0 z-50 glass-effect p-3 flex flex-col gap-2 justify-between sm:p-4 sm:flex-row sm:items-center sm:gap-0">
            <div>
              <DialogTitle className="text-lg font-bold text-white line-clamp-1 sm:text-2xl">{lineItem.name}</DialogTitle>
              <DialogDescription className="text-xs text-zinc-300 sm:text-base">
                Certificate of Authenticity • {editionInfo}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Badge 
                variant={
                  nfcStatus === "paired" 
                    ? "default" 
                    : nfcStatus === "unpaired" 
                    ? "secondary" 
                    : "destructive"
                }
                className="flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                {nfcStatus === "paired" ? (
                  <Wifi className="w-3 h-3 text-green-500 sm:w-4 sm:h-4" />
                ) : nfcStatus === "unpaired" ? (
                  <WifiOff className="w-3 h-3 text-yellow-500 sm:w-4 sm:h-4" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500 sm:w-4 sm:h-4" />
                )}
                {nfcStatus === "paired" 
                  ? "Authenticated" 
                  : nfcStatus === "unpaired" 
                  ? "Needs Auth" 
                  : "No NFC"}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-white hover:text-white/80 hover:bg-white/10 transition-colors sm:h-10 sm:w-10"
                onClick={() => onClose()}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </DialogHeader>

          <PostcardCertificate 
            isFlipped={isFlipped}
            className="w-full min-h-[400px] flex flex-col sm:h-[600px]"
          >
            <div className="grid grid-cols-1 h-full sm:grid-cols-2">
              {/* Artwork Image Side */}
              <div className="relative overflow-hidden group min-h-[200px] sm:min-h-[300px]">
                {lineItem.img_url ? (
                  <img 
                    src={lineItem.img_url} 
                    alt={lineItem.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <Album className="w-16 h-16 text-zinc-600 float sm:w-24 sm:h-24" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 glass-effect p-3 text-white transform translate-y-full transition-transform duration-300 group-hover:translate-y-0 sm:p-4">
                  <h2 className="text-lg font-bold line-clamp-1 sm:text-2xl">{lineItem.name}</h2>
                  <p className="text-xs text-zinc-300 sm:text-sm">{artistName}</p>
                </div>
              </div>

              {/* Certificate Details Side */}
              <div className="p-4 flex flex-col justify-between bg-gradient-to-br from-zinc-900 to-zinc-800 sm:p-8">
                <div>
                  <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:gap-0 sm:justify-between sm:mb-6">
                    <div>
                      <h3 className="text-base font-semibold flex items-center gap-2 text-white sm:text-xl">
                        <Certificate className="w-5 h-5 text-amber-500 sm:w-6 sm:h-6" />
                        Certificate of Authenticity
                      </h3>
                      <p className="text-xs text-zinc-400 sm:text-base">{editionInfo}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full text-xs hover:bg-white/10 transition-colors sm:w-auto sm:text-sm"
                    >
                      {isFlipped ? "View Artwork" : "View Certificate"}
                    </Button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 text-white/90 hover:text-white transition-colors sm:gap-3">
                      <Signature className="w-4 h-4 text-amber-500 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-base">Artist: {artistName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 hover:text-white transition-colors sm:gap-3">
                      <Calendar className="w-4 h-4 text-amber-500 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-base">
                        Issued: {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    {lineItem.certificate_url && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <ExternalLink className="w-4 h-4 text-amber-500 sm:w-5 sm:h-5" />
                        <a 
                          href={lineItem.certificate_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors hover:underline sm:text-base"
                        >
                          View Online Certificate
                        </a>
                      </div>
                    )}
                  </div>

                  {/* NFC Pairing Section */}
                  <div className="mt-4 sm:mt-6">
                    {(!lineItem.nfc_tag_id || (lineItem.nfc_tag_id && !lineItem.nfc_claimed_at)) && (
                      <Button 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium text-sm py-2 transition-colors sm:text-base sm:py-3" 
                        onClick={handleNfcPairing}
                        disabled={isNfcPairing}
                      >
                        {isNfcPairing ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin sm:h-4 sm:w-4" />
                            Scanning for NFC Tag
                          </>
                        ) : (
                          <>
                            <Scan className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Pair NFC Tag
                          </>
                        )}
                      </Button>
                    )}
                    {lineItem.nfc_tag_id && lineItem.nfc_claimed_at && (
                      <div className="glass-effect p-3 rounded-lg flex items-center gap-2 border border-green-500/20 sm:p-4 sm:gap-3">
                        <Sparkles className="w-5 h-5 text-green-500 float sm:w-6 sm:h-6" />
                        <span className="text-xs text-green-400 sm:text-base">
                          Artwork Authenticated with NFC
                        </span>
                      </div>
                    )}
                    {!lineItem.nfc_tag_id && (
                      <div className="glass-effect p-3 rounded-lg flex items-center gap-2 border border-yellow-500/20 sm:p-4 sm:gap-3">
                        <WifiOff className="w-5 h-5 text-yellow-500 sm:w-6 sm:h-6" />
                        <span className="text-xs text-yellow-400 sm:text-base">
                          No NFC Tag Available for this Artwork
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </PostcardCertificate>
        </DialogContent>
      </Dialog>

      {/* NFC Pairing Wizard */}
      <Dialog open={showNfcWizard} onOpenChange={() => setShowNfcWizard(false)}>
        <DialogContent className="w-[calc(100%-1rem)] bg-gradient-to-br from-zinc-900 to-zinc-800 border-amber-500/30 text-white rounded-none sm:max-w-md sm:rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl">Pair NFC Tag</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 sm:text-base">
              Follow these steps to authenticate your artwork with NFC
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 progress-bar"
              style={{ width: `${(wizardStep / 4) * 100}%` }}
            />
          </div>

          <div className="space-y-3 py-3 sm:space-y-6 sm:py-4">
            {wizardStep === 1 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 glass-effect p-3 rounded-lg sm:items-center sm:gap-4 sm:p-4">
                  <div className="bg-amber-500/20 p-2 rounded-full shrink-0 sm:p-3">
                    <Smartphone className="w-6 h-6 text-amber-500 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium sm:text-lg">Ready to Scan</h3>
                    <p className="text-xs text-zinc-400 sm:text-sm">
                      Make sure NFC is enabled on your device and hold it near the NFC tag
                    </p>
                  </div>
                </div>
                <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-400">
                  <AlertDescription className="text-xs sm:text-sm">
                    Your device must support NFC and have it enabled. Most modern smartphones have this feature.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 glass-effect p-3 rounded-lg sm:items-center sm:gap-4 sm:p-4">
                  <div className="bg-blue-500/20 p-2 rounded-full shrink-0 sm:p-3">
                    <Scan className="w-6 h-6 text-blue-500 animate-pulse sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium sm:text-lg">Scanning for NFC Tag</h3>
                    <p className="text-xs text-zinc-400 sm:text-sm">
                      Hold your device steady near the NFC tag
                    </p>
                  </div>
                </div>
                <div className="flex justify-center p-6 sm:p-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 sm:w-12 sm:h-12" />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 glass-effect p-3 rounded-lg sm:items-center sm:gap-4 sm:p-4">
                  <div className="bg-purple-500/20 p-2 rounded-full shrink-0 sm:p-3">
                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium sm:text-lg">Verifying Tag</h3>
                    <p className="text-xs text-zinc-400 sm:text-sm">
                      Please wait while we verify and pair your NFC tag
                    </p>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 glass-effect p-3 rounded-lg sm:items-center sm:gap-4 sm:p-4">
                  <div className="bg-green-500/20 p-2 rounded-full shrink-0 sm:p-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 float sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium sm:text-lg">Successfully Paired!</h3>
                    <p className="text-xs text-zinc-400 sm:text-sm">
                      Your artwork has been authenticated with NFC
                    </p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Sparkles className="w-12 h-12 text-amber-500 float sm:w-16 sm:h-16" />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center mt-2">
            {wizardStep === 1 ? (
              <Button 
                onClick={startNfcScan} 
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium text-sm py-2 transition-colors sm:text-base sm:py-3"
              >
                Start Scanning
              </Button>
            ) : wizardStep === 4 ? (
              <Button 
                onClick={() => setShowNfcWizard(false)} 
                className="w-full bg-green-500 hover:bg-green-600 text-black font-medium text-sm py-2 transition-colors sm:text-base sm:py-3"
              >
                Done
              </Button>
            ) : (
              <Button 
                disabled 
                className="w-full bg-zinc-700 text-zinc-400 cursor-not-allowed text-sm py-2 sm:text-base sm:py-3"
              >
                Scanning in Progress...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 