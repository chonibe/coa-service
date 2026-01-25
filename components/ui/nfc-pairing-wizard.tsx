"use client"

import React, { useState, useCallback, useEffect } from 'react'

import { Progress } from "@/components/ui/progress"
import { 
  Nfc, 
  Check, 
  X, 
  AlertTriangle, 
  Loader2 
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@/components/ui"
type PairingStep = 'intro' | 'scanning' | 'verifying' | 'success' | 'error'

interface NFCPairingWizardProps {
  lineItems: {
    id: string
    name: string
    nfcTagId?: string
  }[]
  onPairingComplete: (pairingResults: Record<string, string>) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NFCPairingWizard({
  lineItems,
  onPairingComplete,
  open,
  onOpenChange
}: NFCPairingWizardProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [pairingStep, setPairingStep] = useState<PairingStep>('intro')
  const [pairingResults, setPairingResults] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState(0)

  const startNfcPairing = async () => {
    setPairingStep('scanning')
    
    try {
      // Web NFC API pairing logic
      if ('NDEFReader' in window) {
        const ndef = new NDEFReader()
        await ndef.scan()
        
        ndef.addEventListener("reading", async (event) => {
          const decoder = new TextDecoder()
          const record = event.message.records[0]
          const nfcTagId = decoder.decode(record.data)
          
          await verifyNfcTag(nfcTagId)
        })
      } else {
        throw new Error('Web NFC not supported')
      }
    } catch (error) {
      console.error('NFC Scanning Error:', error)
      setPairingStep('error')
      toast({
        title: "NFC Pairing Error",
        description: "Unable to start NFC scanning. Please try again.",
        variant: "destructive"
      })
    }
  }

  const verifyNfcTag = async (nfcTagId: string) => {
    setPairingStep('verifying')
    
    try {
      // Implement server-side NFC tag verification
      const response = await fetch('/api/nfc-tags/verify', {
        method: 'POST',
        body: JSON.stringify({
          lineItemId: lineItems[currentItemIndex].id,
          nfcTagId
        })
      })
      
      if (!response.ok) throw new Error('NFC Tag Verification Failed')
      
      const updatedResults = {
        ...pairingResults,
        [lineItems[currentItemIndex].id]: nfcTagId
      }
      
      setPairingResults(updatedResults)
      setPairingStep('success')
      
      // Update progress
      const newProgress = ((currentItemIndex + 1) / lineItems.length) * 100
      setProgress(newProgress)
    } catch (error) {
      console.error('NFC Verification Error:', error)
      setPairingStep('error')
      toast({
        title: "NFC Pairing Failed",
        description: "Unable to verify NFC tag. Please try again.",
        variant: "destructive"
      })
    }
  }

  const moveToNextItem = async () => {
    if (currentItemIndex < lineItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1)
      setPairingStep('intro')
    } else {
      // All items paired, complete the process
      try {
        await onPairingComplete(pairingResults)
        onOpenChange(false)
      } catch (error) {
        console.error('Pairing Completion Error:', error)
        toast({
          title: "Pairing Completion Error",
          description: "Failed to finalize NFC pairing.",
          variant: "destructive"
        })
      }
    }
  }

  const renderContent = () => {
    const currentItem = lineItems[currentItemIndex]

    switch (pairingStep) {
      case 'intro':
        return (
          <>
            <DialogHeader>
              <DialogTitle>NFC Tag Pairing</DialogTitle>
              <DialogDescription>
                Pair NFC tag for: {currentItem.name}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 p-6">
              <Nfc className="w-24 h-24 text-primary" />
              <p className="text-center text-muted-foreground">
                Prepare your NFC tag to pair with this artwork
              </p>
              <Button onClick={startNfcPairing} className="w-full">
                Start Pairing
              </Button>
            </div>
          </>
        )
      
      case 'scanning':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Scanning NFC Tag</DialogTitle>
              <DialogDescription>
                Hold your NFC tag close to the device
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 p-6">
              <Loader2 className="w-24 h-24 text-primary animate-spin" />
              <p className="text-center text-muted-foreground">
                Waiting for NFC tag...
              </p>
            </div>
          </>
        )
      
      case 'verifying':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Verifying NFC Tag</DialogTitle>
              <DialogDescription>
                Checking NFC tag authenticity
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 p-6">
              <Loader2 className="w-24 h-24 text-primary animate-spin" />
              <p className="text-center text-muted-foreground">
                Authenticating NFC tag...
              </p>
            </div>
          </>
        )
      
      case 'success':
        return (
          <>
            <DialogHeader>
              <DialogTitle>NFC Tag Paired</DialogTitle>
              <DialogDescription>
                Successfully paired NFC tag for {currentItem.name}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 p-6">
              <Check className="w-24 h-24 text-green-500" />
              <p className="text-center text-muted-foreground">
                Tag verified and paired successfully
              </p>
              <Button onClick={moveToNextItem} className="w-full">
                Continue
              </Button>
            </div>
          </>
        )
      
      case 'error':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Pairing Failed</DialogTitle>
              <DialogDescription>
                Unable to pair NFC tag for {currentItem.name}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 p-6">
              <AlertTriangle className="w-24 h-24 text-red-500" />
              <p className="text-center text-muted-foreground">
                Please try again or contact support
              </p>
              <div className="flex space-x-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setPairingStep('intro')} 
                  className="flex-1"
                >
                  Retry
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => onOpenChange(false)} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {renderContent()}
        <DialogFooter>
          <Progress value={progress} className="w-full" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 