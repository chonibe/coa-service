import * as React from "react"
import { cn } from "@/lib/utils"

const alertVariants = {
  destructive: "border-destructive bg-destructive text-destructive-foreground [&>[svg]]:text-destructive-foreground",
  default: "border-border bg-background text-foreground [&>[svg]]:text-muted-foreground",
  success: "border-success bg-success text-success-foreground [&>[svg]]:text-success-foreground",
}

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full rounded-md border p-4 [&>[svg]]:h-4 [&>[svg]]:w-4 [&>[svg]]:text-foreground",
          alertVariants[variant || "default"],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-tight tracking-tight", className)} {...props} />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("text-sm opacity-70", className)} {...props} />,
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
