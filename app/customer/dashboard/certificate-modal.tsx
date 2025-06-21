"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { X, BadgeIcon as Certificate, User, Calendar, Hash, ExternalLink, Award, Sparkles, Signature, Wifi, WifiOff, Album, Scan, Loader2, Smartphone, CheckCircle2 } from "lucide-react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HolographicElement } from "@/components/ui/holographic-element"
import { CertificateQR } from "@/components/ui/certificate-qr"
import { EnhancedCertificate } from "@/components/ui/enhanced-certificate"

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
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden sm:rounded-xl rounded-none">
          {/* Fixed header with proper spacing */}
          <DialogHeader className="sticky top-0 left-0 right-0 z-50 glass-effect p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl sm:text-2xl font-bold text-white truncate">
                  {lineItem.name}
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-zinc-300">
                  Certificate of Authenticity • {editionInfo}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Badge variant="outline" className="bg-zinc-900/50">
                  <User className="w-3 h-3 mr-1" />
                  {artistName}
                </Badge>
                  {lineItem.certificate_url && (
                      <a 
                        href={lineItem.certificate_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium transition-colors bg-zinc-900/50 border border-zinc-800 rounded-md hover:bg-zinc-900 focus:outline-none"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Original
                  </a>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Main content with proper padding */}
          <div className="p-4 space-y-6">
                          <EnhancedCertificate
              name={lineItem.name}
              description={lineItem.description}
              artistName={artistName}
              editionInfo={editionInfo}
              nfcTagId={lineItem.nfc_tag_id}
              nfcClaimedAt={lineItem.nfc_claimed_at}
              imgUrl={lineItem.img_url}
              certificateUrl={lineItem.certificate_url}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
              onStartPairing={handleNfcPairing}
              className="w-full"
            />

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex-1 sm:flex-none"
              >
                {isFlipped ? 'View Certificate' : 'View Artwork'}
              </Button>
              
              {!lineItem.nfc_claimed_at && lineItem.nfc_tag_id && (
                <Button
                  onClick={handleNfcPairing}
                  className="flex-1 sm:flex-none"
                >
                  Authenticate with NFC
                </Button>
              )}
            </div>
          </div>

          {/* NFC Wizard Modal */}
          {showNfcWizard && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-zinc-900 rounded-xl p-6 space-y-6">
                {/* Wizard Progress */}
                <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-amber-500 progress-bar"
                    style={{ width: `${(wizardStep / 4) * 100}%` }}
                  />
                </div>

                {/* Step Content */}
                <div className="text-center space-y-4">
                  {wizardStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <Smartphone className="w-16 h-16 mx-auto text-amber-500" />
                      <h3 className="text-xl font-bold text-white">Ready to Authenticate</h3>
                      <p className="text-zinc-400">
                        Make sure NFC is enabled on your device and tap Start to begin the authentication process.
                      </p>
                      <Button onClick={startNfcScan} className="w-full">
                        Start Authentication
                      </Button>
                    </motion.div>
                  )}

                  {wizardStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <Scan className="w-16 h-16 mx-auto text-amber-500 animate-pulse" />
                      <h3 className="text-xl font-bold text-white">Scanning for NFC Tag</h3>
                      <p className="text-zinc-400">
                        Hold your device near the NFC tag on your artwork to authenticate.
                      </p>
                      <Button variant="outline" onClick={() => setWizardStep(1)} className="w-full">
                        Cancel
                      </Button>
                    </motion.div>
                  )}

                  {wizardStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <Loader2 className="w-16 h-16 mx-auto text-amber-500 animate-spin" />
                      <h3 className="text-xl font-bold text-white">Verifying Tag</h3>
                      <p className="text-zinc-400">
                        Please keep your device in place while we verify the NFC tag.
                      </p>
                    </motion.div>
                  )}

                  {wizardStep === 4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                      <h3 className="text-xl font-bold text-white">Authentication Complete!</h3>
                      <p className="text-zinc-400">
                        Your artwork has been successfully authenticated.
                      </p>
                    </motion.div>
                  )}
                </div>
          </div>
        </div>
          )}
      </DialogContent>
    </Dialog>
    </>
  )
} 