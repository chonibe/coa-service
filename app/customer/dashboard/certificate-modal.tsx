"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, BadgeIcon as Certificate, User, Calendar, Hash, ExternalLink, Award, Sparkles, Signature, Wifi, WifiOff, Album, Scan, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

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
  const cardRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isNfcPairing, setIsNfcPairing] = useState(false)

  useEffect(() => {
    setIsOpen(!!lineItem)
    setIsFlipped(false)
  }, [lineItem])

  if (!lineItem) return null

  const artistName = lineItem.vendor_name || "Street Collector"
  const editionInfo = lineItem.edition_number && lineItem.edition_total
    ? `${lineItem.edition_number}/${lineItem.edition_total}`
    : lineItem.edition_number 
    ? `${lineItem.edition_number}`
    : "Limited Edition"

  const nfcStatus = lineItem.nfc_tag_id 
    ? (lineItem.nfc_claimed_at ? "paired" : "unpaired")
    : "no-nfc"

  const handleNfcPairing = async () => {
    // Check if Web NFC is supported
    if ('NDEFReader' in window) {
      try {
        setIsNfcPairing(true)
        const ndef = new NDEFReader()
        await ndef.scan()

        ndef.addEventListener("reading", async ({ message, serialNumber }) => {
          try {
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
                                toast({
                                  title: "NFC Tag Paired",
                description: "Your artwork has been successfully authenticated.",
                                  variant: "default"
                                })
              // Optionally refresh the line item or close modal
              onClose()
                              } else {
                                toast({
                title: "Pairing Failed",
                                  description: result.message || "Unable to pair NFC tag",
                                  variant: "destructive"
                                })
                              }
                            } catch (error) {
            console.error("NFC Claim Error:", error)
            toast({
              title: "Pairing Error",
              description: "An unexpected error occurred",
              variant: "destructive"
            })
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
      }
    } else {
                              toast({
        title: "Unsupported Browser",
        description: "Web NFC is not supported in your browser",
                                variant: "destructive"
                              })
                            }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <motion.div 
          ref={cardRef}
          className="w-full h-[600px] relative perspective-1000"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          style={{
            transformStyle: 'preserve-3d',
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Front of Card */}
          <motion.div 
            className={`absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col justify-between cursor-pointer ${!isFlipped ? 'z-20' : 'z-10 opacity-0'}`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFlipped(true)}
          >
            {/* Artwork Image */}
            <div className="flex-grow relative overflow-hidden rounded-lg mb-4">
              {lineItem.img_url ? (
                <img 
                  src={lineItem.img_url} 
                  alt={lineItem.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-700 flex items-center justify-center">
                  <Album className="w-24 h-24 text-zinc-500" />
                </div>
              )}
            </div>

            {/* Artwork Details */}
            <div className="text-white space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">{lineItem.name}</h2>
              <div className="flex justify-between items-center">
                <p className="text-zinc-300">{artistName}</p>
                <div className="flex items-center space-x-2">
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
                    {nfcStatus === "paired" && (
                      <Wifi className="w-4 h-4 text-green-500" />
                    )}
                    {nfcStatus === "unpaired" && (
                      <WifiOff className="w-4 h-4 text-yellow-500" />
                    )}
                    {nfcStatus === "no-nfc" && (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    {nfcStatus === "paired" 
                      ? "Authenticated" 
                      : nfcStatus === "unpaired" 
                      ? "Needs Authentication" 
                      : "No NFC Tag"}
                  </Badge>
                  <span className="text-sm font-medium">
                    {editionInfo}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Back of Card (Certificate Details) */}
          <motion.div 
            className={`absolute inset-0 w-full h-full bg-white text-zinc-900 rounded-xl shadow-2xl p-6 flex flex-col justify-between cursor-pointer ${isFlipped ? 'z-20' : 'z-10 opacity-0'}`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFlipped(false)}
          >
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h1 className="text-3xl font-bold">Certificate of Authenticity</h1>
                <Certificate className="w-10 h-10 text-amber-600" />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500 uppercase tracking-wider">Artwork</p>
                  <h2 className="text-2xl font-semibold">{lineItem.name}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider">Artist</p>
                    <p className="text-xl font-medium">{artistName}</p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500 uppercase tracking-wider">Edition</p>
                    <p className="text-xl font-medium">
                      {editionInfo}
                    </p>
                  </div>
                </div>

                {nfcStatus !== "no-nfc" && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={
                          nfcStatus === "paired" 
                            ? "default" 
                            : "secondary"
                        }
                        className="flex items-center gap-2"
                      >
                        <Wifi className={`w-4 h-4 ${nfcStatus === "paired" ? 'text-green-500' : 'text-yellow-500'}`} />
                        {nfcStatus === "paired" 
                          ? "NFC Authenticated" 
                          : "NFC Authentication Pending"}
                      </Badge>
                      {lineItem.nfc_claimed_at && (
                        <p className="text-sm text-zinc-500">
                          Authenticated on: {new Date(lineItem.nfc_claimed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {nfcStatus === "unpaired" && (
                  <Button 
                    className="w-full mt-4" 
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
              </div>
            </div>

            <div className="mt-6 border-t pt-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-500">Certificate Number</p>
                <p className="font-mono text-sm text-zinc-800">
                  {lineItem.certificate_token?.slice(0, 12) || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Issued Date</p>
                <p className="text-sm text-zinc-800">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
} 