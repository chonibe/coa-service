"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { useEffect } from "react"

interface HolographicElementProps {
  children: React.ReactNode
  className?: string
}

export function HolographicElement({ children, className = "" }: HolographicElementProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-300, 300], [10, -10])
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10])
  const brightness = useTransform(mouseX, [-300, 300], [0.5, 1.2])
  const gradient = useTransform(
    mouseX,
    [-300, 0, 300],
    [
      "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%)",
      "linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.4) 100%)",
      "linear-gradient(45deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.5) 100%)"
    ]
  )

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
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: gradient,
          filter: "blur(10px)",
          opacity: 0.5,
        }}
      />
      <motion.div
        className="relative z-20"
        style={{
          filter: `brightness(${brightness})`,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
} 