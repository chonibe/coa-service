import { useState, useEffect } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { useNFCScan } from '@/hooks/use-nfc-scan'
import { LineItem } from '@/types'

export const NFCWizardDialog = ({ 
  isOpen, 
  onClose, 
  item,
  onSuccess 
}: { 
  isOpen: boolean
  onClose: () => void
  item: LineItem
  onSuccess: () => void
}) => {
  const [step, setStep] = useState(1)
  const [isPairing, setIsPairing] = useState(false)
  
  const { startScanning, stopScanning, isScanning, error: nfcError } = useNFCScan({
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
          toast({
            title: "NFC Tag Paired",
            description: `Artwork "${item.name}" has been successfully authenticated.`,
            variant: "default"
          })
          onSuccess()
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
        setIsPairing(false)
        stopScanning()
        onClose()
      }
    },
    onError: (error) => {
      toast({
        title: "NFC Error",
        description: error,
        variant: "destructive"
      })
    }
  })

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      stopScanning()
    }
  }, [isOpen, stopScanning])

  const steps = [
    {
      title: "Prepare Your Device",
      description: "Ensure NFC is enabled on your device. On most phones, you can enable it in your device settings."
    },
    {
      title: "Get Your NFC Tag Ready",
      description: "Take your NFC tag out of its packaging and keep it ready for scanning."
    },
    {
      title: "Position the Tag",
      description: "Hold the NFC tag close to the back of your phone where the NFC reader is located."
    },
    {
      title: "Scan the Tag",
      description: "Keep the tag steady while we scan and pair it with your artwork."
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      stopScanning()
      onClose()
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pair NFC Tag</DialogTitle>
          <DialogDescription>
            Follow these steps to authenticate your artwork with an NFC tag.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="relative h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(step / steps.length) * 100}%` }}
            />
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Step {step}: {steps[step - 1].title}
            </h3>
            <p className="text-zinc-600">
              {steps[step - 1].description}
            </p>
          </div>

          {/* Error Display */}
          {nfcError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">{nfcError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1)
                } else {
                  onClose()
                }
              }}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            {step < steps.length ? (
              <Button onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  if (!isScanning && !isPairing) {
                    startScanning()
                  } else {
                    stopScanning()
                  }
                }}
                disabled={isPairing}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : isPairing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Pairing...
                  </>
                ) : (
                  'Start Scanning'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 