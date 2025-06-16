"use client"

import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback 
} from "react"
import dynamic from 'next/dynamic'
import { motion } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Wifi, 
  Scan, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Info 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

// Dynamically import heavy components
const PerformanceOverlay = dynamic(() => 
  import('@/components/performance/PerformanceOverlay'), 
  { ssr: false }
)

type AuthenticationStage = 
  | 'initial' 
  | 'scanning' 
  | 'verifying' 
  | 'success' 
  | 'error'

// Memoized performance-critical components
const MemoizedProgressBar = React.memo(({ progress }: { progress: number }) => (
  <motion.div 
    initial={{ width: '0%' }}
    animate={{ width: `${progress}%` }}
    className="h-1 bg-blue-500 absolute top-0 left-0"
  />
))

const MemoizedStageIndicator = React.memo(({ 
  stage, 
  errorMessage 
}: { 
  stage: AuthenticationStage, 
  errorMessage?: string | null 
}) => {
  const stageIcons = {
    initial: <Wifi className="w-8 h-8 text-gray-400" />,
    scanning: <Scan className="w-8 h-8 text-blue-500 animate-pulse" />,
    verifying: <ShieldCheck className="w-8 h-8 text-yellow-500 animate-bounce" />,
    success: <CheckCircle2 className="w-8 h-8 text-green-500" />,
    error: <XCircle className="w-8 h-8 text-red-500" />
  }

  const stageMessages = {
    initial: "Ready to Authenticate",
    scanning: "Scanning NFC Tag",
    verifying: "Verifying Authenticity",
    success: "Authentication Complete",
    error: "Authentication Failed"
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-4 p-4 bg-gray-50/80 rounded-lg"
    >
      {stageIcons[stage]}
      <div>
        <p className="font-semibold">{stageMessages[stage]}</p>
        {errorMessage && (
          <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
        )}
      </div>
    </motion.div>
  )
})

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

export function EnhancedCertificateModal({ 
  lineItem, 
  onClose 
}: CertificateModalProps) {
  // Performance optimization: use useCallback for stable references
  const [isOpen, setIsOpen] = useState(false)
  const [authStage, setAuthStage] = useState<AuthenticationStage>('initial')
  const [authProgress, setAuthProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Memoized authentication status to prevent unnecessary recalculations
  const nfcAuthStatus = useMemo(() => {
    if (!lineItem) return {
      status: 'unavailable' as const,
      label: 'No Artwork Selected',
      description: 'Please select an artwork to authenticate.',
      color: 'gray'
    }

    if (!lineItem.nfc_tag_id) return {
      status: 'unavailable' as const,
      label: 'No NFC Tag',
      description: 'This artwork does not have an NFC authentication tag.',
      color: 'gray'
    }

    if (!lineItem.nfc_claimed_at) return {
      status: 'unclaimed' as const,
      label: 'Unclaimed Authentication',
      description: 'NFC tag is available but not yet paired with your account.',
      color: 'yellow'
    }

    return {
      status: 'authenticated' as const,
      label: 'Fully Authenticated',
      description: `Authenticated on ${new Date(lineItem.nfc_claimed_at).toLocaleDateString()}`,
      color: 'green'
    }
  }, [lineItem])

  // Memoized authentication handler to prevent unnecessary re-renders
  const handleNfcPairing = useCallback(async () => {
    if (!lineItem) return
    if (nfcAuthStatus.status !== 'unclaimed') return

    setAuthStage('scanning')
    setAuthProgress(25)

    try {
      // Use Web Worker for authentication to prevent blocking main thread
      const authWorker = new Worker(
        new URL('@/workers/nfc-authentication.worker.ts', import.meta.url)
      )

      authWorker.postMessage({
        type: 'AUTHENTICATE',
        payload: {
          lineItemId: lineItem.line_item_id,
          orderId: lineItem.order_id
        }
      })

      authWorker.onmessage = async (event) => {
        const { success, message } = event.data

        if (success) {
          setAuthStage('success')
          setAuthProgress(100)
          
          toast({
            title: "Authentication Complete",
            description: "Your artwork has been successfully verified.",
            variant: "default"
          })

          setTimeout(onClose, 2000)
        } else {
          throw new Error(message || 'Authentication failed')
        }
      }

      authWorker.onerror = (error) => {
        throw error
      }

    } catch (error) {
      console.error("NFC Authentication Error:", error)
      setAuthStage('error')
      setAuthProgress(0)
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred'
      )

      toast({
        title: "Authentication Failed",
        description: errorMessage || "Unable to authenticate NFC tag",
        variant: "destructive"
      })
    }
  }, [lineItem, nfcAuthStatus, onClose, errorMessage])

  // Reset state when line item changes
  useEffect(() => {
    setIsOpen(!!lineItem)
    setAuthStage('initial')
    setAuthProgress(0)
    setErrorMessage(null)
  }, [lineItem])

  // Render nothing if no line item
  if (!lineItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl relative overflow-hidden">
        <PerformanceOverlay 
          renderTime={performance.now()}
          componentName="EnhancedCertificateModal"
        />
        
        <MemoizedProgressBar progress={authProgress} />

        <div className="grid grid-cols-2 gap-8 relative z-10">
          {/* Artwork Image */}
          <div className="relative">
            <img 
              src={lineItem.img_url || '/placeholder.jpg'} 
                          alt={lineItem.name} 
              className="w-full h-[500px] object-cover rounded-lg shadow-xl"
              loading="lazy"
            />
            <div className="absolute bottom-4 left-4 right-4">
              <MemoizedStageIndicator 
                stage={authStage} 
                errorMessage={errorMessage} 
              />
                    </div>
                  </div>

                  {/* Certificate Details */}
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-3xl">{lineItem.name}</DialogTitle>
              <p className="text-muted-foreground">{lineItem.vendor_name}</p>
            </DialogHeader>

            <div className="space-y-4">
              <Badge 
                variant={
                  nfcAuthStatus.status === 'authenticated' ? 'default' :
                  nfcAuthStatus.status === 'unclaimed' ? 'secondary' : 'destructive'
                }
              >
                {nfcAuthStatus.label}
              </Badge>

              <p className="text-muted-foreground">
                {nfcAuthStatus.description}
              </p>

                        <Button 
                onClick={handleNfcPairing}
                disabled={
                  nfcAuthStatus.status !== 'unclaimed' || 
                  authStage !== 'initial'
                }
                className="w-full"
              >
                {nfcAuthStatus.status === 'unclaimed' 
                  ? 'Authenticate Artwork' 
                  : 'Authentication Complete'}
                        </Button>

              {authStage === 'error' && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-3">
                  <Info className="w-6 h-6 text-red-500" />
                  <span className="text-red-800">
                    {errorMessage || 'Authentication failed. Please try again.'}
                  </span>
                      </div>
                    )}
                  </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 