"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Hash, Wifi, WifiOff, Album, BadgeIcon as Certificate } from "lucide-react"

interface EnhancedCertificateProps {
  name: string
  description?: string
  artistName: string
  editionInfo: string
  nfcTagId?: string
  nfcClaimedAt?: string
  imgUrl?: string
  certificateUrl?: string
  isFlipped: boolean
  onFlip: () => void
  className?: string
}

export function EnhancedCertificate({
  name,
  description,
  artistName,
  editionInfo,
  nfcTagId,
  nfcClaimedAt,
  imgUrl,
  certificateUrl,
  isFlipped,
  onFlip,
  className = "",
}: EnhancedCertificateProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10])
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10])
  const brightness = useTransform(mouseX, [-300, 300], [0.5, 1.2])
  const [isHovered, setIsHovered] = useState(false)

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
      className={`relative aspect-[4/3] w-full cursor-pointer ${className}`}
      style={{
        perspective: "2000px",
      }}
      onClick={onFlip}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          rotateX,
          rotateY,
          transition: "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: `rotateY(${isFlipped ? "180deg" : "0deg"})`,
        }}
      >
        {/* Front of Certificate */}
        <motion.div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 sm:p-8"
          style={{
            backfaceVisibility: "hidden",
            filter: `brightness(${brightness})`,
          }}
        >
          <div className="relative h-full flex flex-col">
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="animate-float"
                  >
                    <Certificate className="w-12 h-12 text-amber-500" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-right"
                  >
                    <p className="text-zinc-400 text-sm">Edition</p>
                    <p className="text-white font-bold">{editionInfo}</p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{name}</h2>
                  {description && <p className="text-zinc-400">{description}</p>}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-auto pt-6 space-y-4"
              >
                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="bg-zinc-900/50">
                    <User className="w-3 h-3 mr-1" />
                    {artistName}
                  </Badge>
                  <Badge variant="outline" className="bg-zinc-900/50">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date().getFullYear()}
                  </Badge>
                  {nfcTagId && (
                    <Badge variant="outline" className="bg-zinc-900/50">
                      <Hash className="w-3 h-3 mr-1" />
                      {nfcTagId.slice(0, 8)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="signature-font text-2xl text-amber-500">
                    Street Collector
                  </div>
                  {nfcClaimedAt ? (
                    <Badge className="bg-green-500/20 text-green-400">
                      <Wifi className="w-3 h-3 mr-1" />
                      Authenticated
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-zinc-900/50">
                      <WifiOff className="w-3 h-3 mr-1" />
                      Pending Authentication
                    </Badge>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Back of Certificate */}
        <motion.div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            filter: `brightness(${brightness})`,
          }}
        >
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            {imgUrl ? (
              <div className="relative w-full max-w-md aspect-square">
                <img 
                  src={imgUrl} 
                  alt={name}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <Album className="w-24 h-24 text-zinc-700" />
            )}
            
            {certificateUrl && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-32 h-32 bg-white p-4 rounded-xl"
              >
                <QRCodeSVG
                  value={certificateUrl}
                  size={96}
                  level="H"
                  includeMargin
                  imageSettings={{
                    src: "/placeholder-logo.svg",
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Holographic Overlay */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%)",
            opacity: isHovered ? 0.5 : 0.3,
            transition: "opacity 0.3s ease",
          }}
        />
      </motion.div>
    </motion.div>
  )
}
