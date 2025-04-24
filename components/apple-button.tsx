"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Button, type ButtonProps } from "@/components/ui/button"
import { scaleButton } from "@/lib/motion-variants"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface AppleButtonProps extends ButtonProps {
  children: React.ReactNode
  className?: string
}

export const AppleButton = forwardRef<HTMLButtonElement, AppleButtonProps>(({ children, className, ...props }, ref) => {
  return (
    <motion.div whileTap="tap" whileHover="hover" variants={scaleButton} className="relative">
      <Button
        ref={ref}
        className={cn(
          "font-medium rounded-xl transition-all shadow-sm",
          "active:shadow-inner active:translate-y-0.5",
          "focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
})

AppleButton.displayName = "AppleButton"
