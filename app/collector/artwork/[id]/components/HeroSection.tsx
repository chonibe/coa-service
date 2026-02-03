"use client"

import Image from "next/image"

import { motion } from "framer-motion"
import { ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui"
interface HeroSectionProps {
  imageUrl: string | null
  artworkName: string
  editionNumber: number | null
  editionTotal: number | null
  purchaseDate?: string | null
  orderNumber?: string | null
}

export function HeroSection({
  imageUrl,
  artworkName,
  editionNumber,
  editionTotal,
  purchaseDate,
  orderNumber,
}: HeroSectionProps) {
  return (
    <div className="relative w-full aspect-square md:aspect-[16/10] overflow-hidden">
      {/* Artwork Image */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={artworkName}
          fill
          className="object-cover"
          priority
          quality={95}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <ImageIcon className="h-32 w-32 text-muted-foreground/30" />
        </div>
      )}

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-0 gradient-overlay-bottom" />

      {/* Floating edition badge and info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4"
      >
        {editionNumber && editionTotal && (
          <Badge 
            variant="secondary" 
            className="text-lg px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border-white/20 shadow-lg"
          >
            #{editionNumber}/{editionTotal}
          </Badge>
        )}

        {purchaseDate && orderNumber && (
          <div className="text-right text-white text-shadow">
            <p className="text-sm font-medium drop-shadow-md">
              {new Date(purchaseDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-xs opacity-90 drop-shadow-md">
              Order {orderNumber}
            </p>
          </div>
        )}
      </motion.div>

      {/* Subtle vignette effect */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{ 
             boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)' 
           }} 
      />
    </div>
  )
}
