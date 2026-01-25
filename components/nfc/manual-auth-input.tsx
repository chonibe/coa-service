"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

import { Loader2, HelpCircle, ChevronDown, ArrowLeft } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Image from "next/image"

import { Button } from "@/components/ui"
interface ManualAuthInputProps {
  onSubmit: (code: string) => void
  onBack: () => void
  isLoading: boolean
  error?: string | null
}

export function ManualAuthInput({
  onSubmit,
  onBack,
  isLoading,
  error,
}: ManualAuthInputProps) {
  const [segments, setSegments] = useState(["", "", ""])
  const [helpOpen, setHelpOpen] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    // Focus first input on mount
    inputRefs[0].current?.focus()
  }, [])

  const handleSegmentChange = (index: number, value: string) => {
    // Only allow alphanumeric
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    
    const newSegments = [...segments]
    newSegments[index] = cleanValue.slice(0, 4)
    setSegments(newSegments)

    // Auto-advance to next segment
    if (cleanValue.length === 4 && index < 2) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to go to previous segment
    if (e.key === "Backspace" && segments[index] === "" && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    
    // Split pasted text into segments
    const segment1 = pastedText.slice(0, 4)
    const segment2 = pastedText.slice(4, 8)
    const segment3 = pastedText.slice(8, 12)
    
    setSegments([segment1, segment2, segment3])
    
    // Focus appropriate input
    if (pastedText.length >= 12) {
      inputRefs[2].current?.focus()
    } else if (pastedText.length >= 8) {
      inputRefs[2].current?.focus()
    } else if (pastedText.length >= 4) {
      inputRefs[1].current?.focus()
    }
  }

  const handleSubmit = () => {
    const fullCode = segments.join("-")
    if (fullCode.replace(/-/g, "").length === 12) {
      onSubmit(fullCode)
    }
  }

  const isComplete = segments.every((seg) => seg.length === 4)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full py-6"
    >
      <h2 className="text-xl font-semibold mb-2 text-center">
        Enter your authentication code
      </h2>
      <p className="text-sm text-muted-foreground mb-8 text-center">
        Find the 12-digit code on your certificate
      </p>

      {/* OTP-style segmented inputs */}
      <div className="flex gap-2 justify-center mb-6">
        {segments.map((segment, index) => (
          <React.Fragment key={index}>
            <input
              ref={inputRefs[index]}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={4}
              value={segment}
              onChange={(e) => handleSegmentChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-20 h-14 text-center text-2xl font-mono tracking-widest
                         border-2 rounded-xl bg-background
                         focus:border-primary focus:ring-2 focus:ring-primary/20
                         transition-all outline-none"
              placeholder="----"
            />
            {index < 2 && (
              <div className="flex items-center text-muted-foreground">-</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="text-sm text-destructive text-center mb-4 px-4">
          {error}
        </div>
      )}

      {/* Helper accordion */}
      <Collapsible open={helpOpen} onOpenChange={setHelpOpen} className="mb-6">
        <CollapsibleTrigger className="w-full py-3 text-sm text-muted-foreground
                                        flex items-center justify-center gap-2
                                        hover:text-foreground transition-colors">
          <HelpCircle className="w-4 h-4" />
          Where do I find this code?
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              helpOpen ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-muted rounded-xl p-4 mt-2">
            <div className="bg-background rounded-lg mb-3 p-4 text-center text-sm text-muted-foreground border-2 border-dashed">
              [Certificate illustration would go here]
            </div>
            <p className="text-sm text-muted-foreground">
              Look for the 12-digit code on your certificate card or the back
              of your artwork packaging. It's usually in the format XXXX-XXXX-XXXX.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Actions */}
      <div className="mt-auto space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isLoading}
          className="w-full h-14 text-lg font-semibold rounded-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Authenticating...
            </>
          ) : (
            "Authenticate"
          )}
        </Button>
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full h-12 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to NFC scan
        </Button>
      </div>
    </motion.div>
  )
}
