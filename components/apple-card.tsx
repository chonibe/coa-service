"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card, type CardProps } from "@/components/ui/card"
import { cardHover } from "@/lib/motion-variants"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface AppleCardProps extends CardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
}

export const AppleCard = forwardRef<HTMLDivElement, AppleCardProps>(
  ({ children, className, interactive = true, ...props }, ref) => {
    const CardComponent = interactive ? motion.div : Card

    return (
      <CardComponent
        ref={ref}
        variants={interactive ? cardHover : undefined}
        initial={interactive ? "rest" : undefined}
        whileHover={interactive ? "hover" : undefined}
        className={cn(
          "overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm",
          "transition-all duration-300 ease-out",
          interactive && "cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </CardComponent>
    )
  },
)

AppleCard.displayName = "AppleCard"
