"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
  onStepClick?: (step: number) => void
}

export function StepProgress({ currentStep, totalSteps, stepLabels, onStepClick }: StepProgressProps) {
  const handleStepClick = (step: number) => {
    // Only allow clicking on completed steps
    if (step < currentStep && onStepClick) {
      onStepClick(step)
    }
  }

  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1
        const isCompleted = step < currentStep
        const isCurrent = step === currentStep
        const label = stepLabels?.[index]
        const isClickable = isCompleted && !!onStepClick

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => handleStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-foreground/30 bg-background text-muted-foreground",
                  isClickable && "cursor-pointer hover:scale-110 active:scale-95",
                  !isClickable && "cursor-default"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{step}</span>
                )}
              </button>
              {label && (
                <span
                  className={cn(
                    "text-xs mt-2 text-center",
                    isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              )}
            </div>
            {step < totalSteps && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

