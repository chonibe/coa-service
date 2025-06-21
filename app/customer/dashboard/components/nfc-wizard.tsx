"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Scan, CheckCircle2, XCircle } from "lucide-react"
import { useNfcScan } from "@/hooks/use-nfc-scan"

interface NfcWizardProps {
  lineItemId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NfcWizard({ lineItemId, isOpen, onClose, onSuccess }: NfcWizardProps) {
  const [step, setStep] = useState(1)
  const { startScan, stopScan, isScanning, error } = useNfcScan()
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'pairing' | 'success' | 'error'>('idle')

  const handleStartPairing = async () => {
    setStep(2)
    setPairingStatus('pairing')
    try {
      const tag = await startScan()
      if (tag) {
        // Call API to pair the NFC tag with the line item
        const response = await fetch('/api/nfc/pair', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lineItemId,
            nfcId: tag.id,
          }),
        })

        if (response.ok) {
          setPairingStatus('success')
          setStep(3)
          onSuccess()
        } else {
          throw new Error('Failed to pair NFC tag')
        }
      }
    } catch (err) {
      console.error('Error pairing NFC tag:', err)
      setPairingStatus('error')
      setStep(3)
    } finally {
      stopScan()
    }
  }

  const handleClose = () => {
    stopScan()
    setStep(1)
    setPairingStatus('idle')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pair NFC Tag</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <Progress value={(step / 3) * 100} className="mb-8" />

          {step === 1 && (
            <div className="text-center space-y-4">
              <Scan className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-medium">Ready to Pair</h3>
              <p className="text-sm text-muted-foreground">
                Make sure your NFC tag is ready and tap the button below to start pairing
              </p>
              <Button onClick={handleStartPairing} className="w-full">
                Start Pairing
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <h3 className="text-lg font-medium">Scanning for NFC Tag</h3>
              <p className="text-sm text-muted-foreground">
                Hold your NFC tag close to your device
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              {pairingStatus === 'success' ? (
                <>
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                  <h3 className="text-lg font-medium">Successfully Paired!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your NFC tag has been successfully paired with this artwork
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="h-12 w-12 mx-auto text-red-500" />
                  <h3 className="text-lg font-medium">Pairing Failed</h3>
                  <p className="text-sm text-muted-foreground">
                    {error || 'There was an error pairing your NFC tag. Please try again.'}
                  </p>
                  <Button onClick={() => setStep(1)} variant="outline" className="w-full">
                    Try Again
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 