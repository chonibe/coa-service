"use client"

import { useMotionValue, useTransform, motion } from "framer-motion"
import { useEffect } from "react"

interface HolographicElementProps {
  className?: string
}

export function HolographicElement({ className = "" }: HolographicElementProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const brightness = useTransform(mouseX, [-300, 300], [0.5, 1.5])
  const gradientRotate = useTransform(mouseX, [-300, 300], [0, 360])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      const x = clientX - innerWidth / 2
      const y = clientY - innerHeight / 2
      mouseX.set(x)
      mouseY.set(y)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: useTransform(
          gradientRotate,
          (rotate) =>
            `linear-gradient(${rotate}deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)`
        ),
        filter: `brightness(${brightness})`,
        mixBlendMode: "overlay",
      }}
    >
      {/* Rainbow Spectrum Effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(45deg, rgba(255,0,0,0.1), rgba(255,255,0,0.1), rgba(0,255,0,0.1), rgba(0,255,255,0.1), rgba(0,0,255,0.1), rgba(255,0,255,0.1))",
          opacity: useTransform(mouseX, [-300, 300], [0.1, 0.3]),
          mixBlendMode: "color",
        }}
      />

      {/* Sparkle Effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.3) 0%, transparent 50%)",
          opacity: useTransform(mouseX, [-300, 300], [0.1, 0.4]),
          "--mouse-x": useTransform(mouseX, (x) => `${50 + (x / window.innerWidth) * 100}%`),
          "--mouse-y": useTransform(mouseY, (y) => `${50 + (y / window.innerHeight) * 100}%`),
        } as any}
      />
    </motion.div>
  )
} 