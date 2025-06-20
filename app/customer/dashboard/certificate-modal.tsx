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

.golden-glow {
  animation: golden-glow 3s ease-in-out infinite;
}

.signature-font {
  font-family: 'Brush Script MT', cursive, serif;
  font-style: italic;
}

.postcard-tilt {
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
}
`

function PostcardCertificate({ children, className = "", isFlipped = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { 
  isFlipped?: boolean
}) {
  return (
    <>
      <style>{shimmerStyles}</style>
      <div
        className={`relative bg-gradient-to-br from-zinc-900/95 via-zinc-800/95 to-zinc-900/95 backdrop-blur-sm border border-amber-500/30 rounded-xl shadow-2xl hover:border-amber-400/50 overflow-hidden golden-glow ${className}`}
        style={{ 
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "none",
          transition: "transform 0.6s ease-in-out"
        }}
        {...props}
      >
        {/* Premium border gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-amber-400/20 p-[1px] rounded-xl">
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
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          <DialogHeader className="absolute top-0 left-0 right-0 z-50 bg-black/50 p-4 flex justify-between items-center">
            <div>
              <DialogTitle className="text-white">{lineItem.name}</DialogTitle>
              <DialogDescription className="text-zinc-300">
                Certificate of Authenticity • {editionInfo}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  nfcStatus === "paired" 
                    ? "default" 
                    : nfcStatus === "unpaired" 
                    ? "secondary" 
                    : "destructive"
                }
                className="flex items-center gap-2"
              >
                {nfcStatus === "paired" ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : nfcStatus === "unpaired" ? (
                  <WifiOff className="w-4 h-4 text-yellow-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                {nfcStatus === "paired" 
                  ? "Authenticated" 
                  : nfcStatus === "unpaired" 
                  ? "Needs Authentication" 
                  : "No NFC Tag"}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:text-white/80"
                onClick={() => onClose()}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <PostcardCertificate 
            isFlipped={isFlipped}
            className="w-full h-[600px] flex flex-col"
          >
            <div className="grid md:grid-cols-2 h-full">
              {/* Artwork Image Side */}
              <div className="relative overflow-hidden">
                {lineItem.img_url ? (
                  <img 
                    src={lineItem.img_url} 
                    alt={lineItem.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <Album className="w-24 h-24 text-zinc-600" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 text-white">
                  <h2 className="text-2xl font-bold">{lineItem.name}</h2>
                  <p className="text-sm text-zinc-300">{artistName}</p>
                </div>
              </div>

              {/* Certificate Details Side */}
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Certificate className="w-6 h-6 text-amber-500" />
                        Certificate of Authenticity
                      </h3>
                      <p className="text-muted-foreground">{editionInfo}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      {isFlipped ? "View Artwork" : "View Certificate"}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Signature className="w-5 h-5 text-muted-foreground" />
                      <span>Artist: {artistName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <span>
                        Issued: {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    {lineItem.certificate_url && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-muted-foreground" />
                        <a 
                          href={lineItem.certificate_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Online Certificate
                        </a>
                      </div>
                    )}
                  </div>

                  {/* NFC Pairing Section */}
                  <div className="mt-6">
                    {(!lineItem.nfc_tag_id || (lineItem.nfc_tag_id && !lineItem.nfc_claimed_at)) && (
                      <Button 
                        className="w-full" 
                        onClick={handleNfcPairing}
                        disabled={isNfcPairing}
                      >
                        {isNfcPairing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Scanning for NFC Tag
                          </>
                        ) : (
                          <>
                            <Scan className="mr-2 h-4 w-4" />
                            Pair NFC Tag
                          </>
                        )}
                      </Button>
                    )}
                    {lineItem.nfc_tag_id && lineItem.nfc_claimed_at && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-green-500" />
                        <span className="text-green-800">
                          Artwork Authenticated with NFC
                        </span>
                      </div>
                    )}
                    {!lineItem.nfc_tag_id && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-3">
                        <WifiOff className="w-6 h-6 text-yellow-500" />
                        <span className="text-yellow-800">
                          No NFC Tag Available for this Artwork
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modify the back side of the certificate when isFlipped is true */}
            {isFlipped && (
              <div className="absolute inset-0 bg-white text-black p-8 flex flex-col justify-between">
                {/* Certificate Header */}
                <div>
                  <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Certificate of Authenticity</h1>
                    <div className="flex items-center gap-2">
                      <Certificate className="w-8 h-8 text-amber-600" />
                      <span className="text-lg font-semibold text-gray-700">Street Collector</span>
                    </div>
                  </div>

                  {/* Artwork Details */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider">Artwork Title</p>
                      <h2 className="text-2xl font-semibold text-gray-900">{lineItem.name}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider">Artist</p>
                        <p className="text-xl font-medium text-gray-800">{artistName}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider">Edition</p>
                        <p className="text-xl font-medium text-gray-800">
                          {lineItem.edition_number && lineItem.edition_total
                            ? `${lineItem.edition_number} of ${lineItem.edition_total}`
                            : "Limited Edition"}
                        </p>
                      </div>
                    </div>

                    {/* NFC Authentication */}
                    <div className="mt-6 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Wifi className="w-6 h-6 text-green-600" />
                          <span className="text-sm text-gray-600">
                            {nfcStatus === "paired" 
                              ? "NFC Authenticated" 
                              : "NFC Authentication Pending"}
                          </span>
                        </div>
                        {lineItem.nfc_claimed_at && (
                          <p className="text-sm text-gray-500">
                            Authenticated on: {new Date(lineItem.nfc_claimed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Footer */}
                <div className="mt-6 border-t pt-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Certificate Number</p>
                    <p className="font-mono text-sm text-gray-800">
                      {lineItem.certificate_token?.slice(0, 12) || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Issued Date</p>
                    <p className="text-sm text-gray-800">
                      {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </PostcardCertificate>
        </DialogContent>
      </Dialog>

      {/* NFC Pairing Wizard */}
      <Dialog open={showNfcWizard} onOpenChange={() => setShowNfcWizard(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pair NFC Tag</DialogTitle>
            <DialogDescription>
              Follow these steps to authenticate your artwork with NFC
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-medium">Ready to Scan</h3>
                    <p className="text-sm text-muted-foreground">
                      Make sure NFC is enabled on your device and hold it near the NFC tag
                    </p>
                  </div>
                </div>
                <Alert>
                  <AlertDescription>
                    Your device must support NFC and have it enabled. Most modern smartphones have this feature.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Scan className="w-8 h-8 text-primary animate-pulse" />
                  <div>
                    <h3 className="font-medium">Scanning for NFC Tag</h3>
                    <p className="text-sm text-muted-foreground">
                      Hold your device steady near the NFC tag
                    </p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <div>
                    <h3 className="font-medium">Verifying Tag</h3>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we verify and pair your NFC tag
                    </p>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <div>
                    <h3 className="font-medium">Successfully Paired!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your artwork has been authenticated with NFC
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center">
            {wizardStep === 1 ? (
              <Button onClick={startNfcScan} className="w-full">
                Start Scanning
              </Button>
            ) : wizardStep === 4 ? (
              <Button onClick={() => setShowNfcWizard(false)} className="w-full">
                Done
              </Button>
            ) : (
              <Button disabled className="w-full">
                Scanning in Progress...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 