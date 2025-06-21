"use client"

import { useCallback, useEffect, useState } from "react"
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import type { Container, Engine } from "tsparticles-engine"
import { motion } from "framer-motion"
import { type ColorPalette } from "@/lib/color-extractor"

interface DynamicBackgroundProps {
  palette: ColorPalette
  className?: string
}

export function DynamicBackground({ palette, className = "" }: DynamicBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    if (container) {
      console.log("Particles container loaded")
    }
  }, [])

  if (!mounted) return null

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          background: palette.background,
        }}
      />
      <Particles
        className="absolute inset-0"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          background: {
            opacity: 0,
          },
          fpsLimit: 60,
          particles: {
            color: {
              value: palette.accent,
            },
            links: {
              color: palette.secondary,
              distance: 150,
              enable: true,
              opacity: 0.3,
              width: 1,
            },
            move: {
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: true,
              speed: 2,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 40,
            },
            opacity: {
              value: 0.4,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  )
} 