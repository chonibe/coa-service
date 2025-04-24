import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => {
  return (
    <div className={cn("rounded-md border bg-card text-card-foreground shadow-sm", className)} {...props} ref={ref}>
      {children}
    </div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} ref={ref}>
        {children}
      </div>
    )
  },
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} ref={ref}>
        {children}
      </h3>
    )
  },
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p className={cn("text-sm text-muted-foreground", className)} {...props} ref={ref}>
        {children}
      </p>
    )
  },
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("p-6 pt-0", className)} {...props} ref={ref}>
        {children}
      </div>
    )
  },
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("flex items-center p-6 pt-0", className)} {...props} ref={ref}>
        {children}
      </div>
    )
  },
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
export type { CardProps }
