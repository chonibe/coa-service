"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Smartphone, CheckCircle, AlertCircle } from "lucide-react"
import { Steps } from "@/components/ui/steps"
import { SelectItem } from "./components/select-item"

type StepStatus = "upcoming" | "current" | "complete"

interface WizardStep {
  label: string
  status: StepStatus
}

interface PairingStatus {
  step: 'scan' | 'verify' | 'pair' | 'complete';
  error?: string;
  nfcTagId?: string;
  lineItemId?: string;
  certificateUrl?: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { label: "Select Item", status: "current" },
  { label: "Scan NFC Tag", status: "upcoming" },
  { label: "Confirm Pairing", status: "upcoming" },
]

export default function NFCPairingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS)
  const [selectedItemId, setSelectedItemId] = useState<string>()
  const [status, setStatus] = useState<PairingStatus>({ step: 'scan' })
  const [isProcessing, setIsProcessing] = useState(false)

  const updateStep = (newStep: number) => {
    if (newStep < 0 || newStep >= steps.length) return

    setCurrentStep(newStep)
    setSteps(steps.map((step, index) => ({
      ...step,
      status: index === newStep 
        ? "current" 
        : index < newStep 
          ? "complete" 
          : "upcoming"
    })))
  }

  const handleNext = () => {
    if (currentStep === 0 && !selectedItemId) {
      // TODO: Show error message
      return
    }
    updateStep(currentStep + 1)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <SelectItem
            onSelect={setSelectedItemId}
            selectedItemId={selectedItemId}
          />
        )
      case 1:
        return <div>Scan NFC Tag</div> // TODO: Implement NFC scanning
      case 2:
        return <div>Confirm Pairing</div> // TODO: Implement confirmation
      default:
        return null
    }
  }

  // Handle NFC scanning
  const handleNfcScan = async () => {
    if (!("NDEFReader" in window)) {
      setStatus(prev => ({ ...prev, error: "NFC is not supported on this device" }))
      return
    }

    try {
      setIsProcessing(true)
      setStatus(prev => ({ ...prev, error: undefined }))

      const ndef = new (window as any).NDEFReader()
      await ndef.scan()

      ndef.onreading = ({ serialNumber }: any) => {
        if (serialNumber) {
          setStatus(prev => ({
            step: 'verify',
            nfcTagId: serialNumber
          }))
        }
      }
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        error: error.message || "Failed to scan NFC tag"
      }))
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle pairing process
  const handlePair = async () => {
    if (!status.nfcTagId || !status.lineItemId) {
      setStatus(prev => ({
        ...prev,
        error: "Missing required information"
      }))
      return
    }

    try {
      setIsProcessing(true)
      setStatus(prev => ({ ...prev, error: undefined }))

      const response = await fetch("/api/nfc-tags/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nfc_tag_id: status.nfcTagId,
          line_item_id: status.lineItemId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to pair NFC tag")
      }

      setStatus({
        step: 'complete',
        nfcTagId: status.nfcTagId,
        lineItemId: status.lineItemId,
        certificateUrl: data.certificate_url
      })
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        error: error.message
      }))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">NFC Tag Pairing</h1>
      
      <div className="mb-12">
        <Steps steps={steps} />
      </div>

      <div className="mt-8">
        {renderStepContent()}
        
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={() => updateStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1 || (currentStep === 0 && !selectedItemId)}
          >
            {currentStep === steps.length - 1 ? "Complete" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
} 