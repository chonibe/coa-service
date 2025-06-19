"use client"

import { useState } from "react"
import { Steps } from "@/components/ui/steps"
import { SelectItem } from "./components/select-item"
import { ScanNFC } from "./components/scan-nfc"
import { ConfirmPairing } from "./components/confirm-pairing"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

type StepStatus = "upcoming" | "current" | "complete"

interface WizardStep {
  label: string
  status: StepStatus
}

interface NFCTagData {
  serialNumber: string
  id?: string
}

interface LineItem {
  id: string
  productName: string
  orderNumber: string
  quantity: number
}

const WIZARD_STEPS: WizardStep[] = [
  { label: "Select Item", status: "current" },
  { label: "Scan NFC Tag", status: "upcoming" },
  { label: "Confirm Pairing", status: "upcoming" },
]

export default function NFCPairingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS)
  const [selectedItemId, setSelectedItemId] = useState<string>()
  const [selectedItem, setSelectedItem] = useState<LineItem>()
  const [scannedTag, setScannedTag] = useState<NFCTagData>()
  const [error, setError] = useState<string>()
  const [isValidating, setIsValidating] = useState(false)
  const [isPairing, setIsPairing] = useState(false)

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
      setError("Please select an item to continue")
      return
    }
    if (currentStep === 1 && !scannedTag) {
      setError("Please scan an NFC tag to continue")
      return
    }
    setError(undefined)
    updateStep(currentStep + 1)
  }

  const handleItemSelect = (itemId: string, item: LineItem) => {
    setSelectedItemId(itemId)
    setSelectedItem(item)
  }

  const handleTagScanned = async (tagData: NFCTagData) => {
    setError(undefined)
    setIsValidating(true)

    try {
      const response = await fetch("/api/nfc-tags/pair/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumber: tagData.serialNumber })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate NFC tag")
      }

      setScannedTag({
        ...tagData,
        id: data.tagId
      })
      handleNext()
    } catch (err) {
      console.error("Error validating tag:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to validate NFC tag. Please try again."
      )
    } finally {
      setIsValidating(false)
    }
  }

  const handlePairConfirm = async () => {
    if (!selectedItemId || !scannedTag) {
      setError("Missing required information for pairing")
      return
    }

    setIsPairing(true)
    setError(undefined)

    try {
      const response = await fetch("/api/nfc-tags/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNumber: scannedTag.serialNumber,
          itemId: selectedItemId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete pairing")
      }

      // Refresh the page after successful pairing
      router.refresh()
    } catch (err) {
      console.error("Error completing pairing:", err)
      throw err
    } finally {
      setIsPairing(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <SelectItem
            onSelect={handleItemSelect}
            selectedItemId={selectedItemId}
          />
        )
      case 1:
        return (
          <ScanNFC
            onTagScanned={handleTagScanned}
            isScanning={isValidating}
          />
        )
      case 2:
        if (!selectedItem || !scannedTag) return null
        return (
          <ConfirmPairing
            itemDetails={selectedItem}
            tagDetails={scannedTag}
            onConfirm={handlePairConfirm}
            onCancel={() => updateStep(currentStep - 1)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">NFC Tag Pairing</h1>
      
      <div className="mb-12">
        <Steps steps={steps} />
      </div>

      <div className="mt-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderStepContent()}
        
        {currentStep !== 2 && (
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
              disabled={
                currentStep === steps.length - 1 || 
                (currentStep === 0 && !selectedItemId) ||
                (currentStep === 1 && !scannedTag) ||
                isValidating
              }
            >
              {currentStep === steps.length - 1 ? "Complete" : "Next"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 