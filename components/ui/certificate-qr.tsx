"use client"

import { QRCodeSVG } from "qrcode.react"
import { motion } from "framer-motion"

interface CertificateQRProps {
  url: string
  size?: number
  className?: string
}

export function CertificateQR({ url, size = 128, className = "" }: CertificateQRProps) {
  return (
    <motion.div
      className={`relative p-4 bg-white rounded-xl shadow-lg ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <QRCodeSVG
        value={url}
        size={size}
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
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: "linear-gradient(45deg, rgba(79, 70, 229, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
          pointerEvents: "none",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
    </motion.div>
  )
} 