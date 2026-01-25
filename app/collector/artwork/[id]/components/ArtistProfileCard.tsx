"use client"

import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { User } from "lucide-react"

interface ArtistProfileCardProps {
  name: string
  bio: string | null
  profileImageUrl: string | null
  signatureUrl: string | null
  isLocked?: boolean
}

export function ArtistProfileCard({
  name,
  bio,
  profileImageUrl,
  signatureUrl,
  isLocked = false,
}: ArtistProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <Card className="overflow-hidden border-2 bg-gradient-to-br from-card to-card/50">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Image */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 mx-auto md:mx-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-xl" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-background shadow-2xl">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                    <User className="h-12 w-12 md:h-16 md:w-16 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Artist Info */}
            <div className="flex-1 text-center md:text-left">
              <Link 
                href={`/artist/${encodeURIComponent(name)}`}
                className="inline-block group"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {name}
                </h2>
              </Link>
              
              {bio && (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {bio}
                </p>
              )}

              {/* Signature */}
              {signatureUrl && !isLocked && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-center md:justify-start">
                    <div className="relative h-16 w-48">
                      <Image
                        src={signatureUrl}
                        alt={`${name}'s signature`}
                        fill
                        className="object-contain object-left"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decorative gradient border */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0" />
        </div>
      </Card>
    </motion.div>
  )
}
