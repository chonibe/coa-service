import { cn } from "@/lib/utils"

interface Step {
  label: string;
  status: 'upcoming' | 'current' | 'complete';
}

interface StepsProps {
  steps: Step[];
  className?: string;
}

export function Steps({ steps, className }: StepsProps) {
  return (
    <div className={cn("flex items-center w-full", className)}>
      {steps.map((step, index) => (
        <div
          key={step.label}
          className={cn(
            "flex items-center",
            index !== steps.length - 1 ? "flex-1" : ""
          )}
        >
          {/* Step Circle */}
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
              {
                "border-primary bg-primary text-primary-foreground":
                  step.status === "complete",
                "border-primary bg-background text-primary":
                  step.status === "current",
                "border-input bg-background text-muted-foreground":
                  step.status === "upcoming",
              }
            )}
          >
            {step.status === "complete" ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>

          {/* Step Label */}
          <span
            className={cn("absolute mt-16 text-center text-sm font-medium", {
              "text-primary": step.status === "current",
              "text-muted-foreground":
                step.status === "upcoming" || step.status === "complete",
            })}
          >
            {step.label}
          </span>

          {/* Connector Line */}
          {index !== steps.length - 1 && (
            <div
              className={cn("h-0.5 w-full", {
                "bg-primary": step.status === "complete",
                "bg-input": step.status !== "complete",
              })}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
} 