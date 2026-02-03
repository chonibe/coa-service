"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui"

interface ArtistSignatureBlockProps {
  signatureUrl: string | null
}

export function ArtistSignatureBlock({ signatureUrl }: ArtistSignatureBlockProps) {
  const [isInView, setIsInView] = useState(false)

  if (!signatureUrl) return null

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Artist Signature</h2>
        <motion.div
          className="relative h-32 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.3 }}
          onViewportEnter={() => setIsInView(true)}
        >
          {/* Signature drawing animation overlay - reveals from left to right */}
          <motion.div
            className="absolute inset-0 bg-white dark:bg-gray-900 z-10"
            initial={{ scaleX: 1 }}
            animate={isInView ? { scaleX: 0 } : { scaleX: 1 }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              delay: 0.3
            }}
            style={{ transformOrigin: "left" }}
          />
          
          {/* Signature image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image
              src={signatureUrl}
              alt="Artist signature"
              width={256}
              height={128}
              className="object-contain max-w-full max-h-full"
              unoptimized={signatureUrl.toLowerCase().endsWith('.gif')}
            />
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  )
}
