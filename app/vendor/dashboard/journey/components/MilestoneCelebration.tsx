"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Sparkles, Share2, ArrowRight } from "lucide-react"
import type { ArtworkSeries } from "@/types/artwork-series"

interface MilestoneCelebrationProps {
  series: ArtworkSeries | null
  open: boolean
  onClose: () => void
  onNextMilestone?: () => void
}

export function MilestoneCelebration({
  series,
  open,
  onClose,
  onNextMilestone,
}: MilestoneCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!series) return null

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${series.name} Milestone Completed!`,
        text: `I just completed the "${series.name}" milestone in my artistic journey!`,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="max-w-md overflow-hidden">
            {/* Confetti Effect */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      backgroundColor: [
                        "#FFD700",
                        "#FF6B6B",
                        "#4ECDC4",
                        "#45B7D1",
                        "#FFA07A",
                        "#98D8C8",
                      ][Math.floor(Math.random() * 6)],
                    }}
                    initial={{ y: -100, opacity: 1, rotate: 0 }}
                    animate={{
                      y: 1000,
                      opacity: 0,
                      rotate: 360,
                      x: (Math.random() - 0.5) * 200,
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 0.5,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Celebration Content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative z-10 text-center space-y-6 py-8"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="mx-auto w-24 h-24 rounded-full bg-green-500 flex items-center justify-center"
              >
                <CheckCircle2 className="h-12 w-12 text-white" />
              </motion.div>

              {/* Sparkles Animation */}
              <motion.div
                className="absolute top-0 left-1/2 transform -translate-x-1/2"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="h-8 w-8 text-yellow-400" />
              </motion.div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold mb-2">Milestone Completed!</h2>
                <p className="text-xl text-muted-foreground">{series.name}</p>
              </div>

              {/* Stats */}
              {series.completion_progress && (
                <div className="flex items-center justify-center gap-4">
                  <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                    {series.completion_progress.sold_artworks} / {series.completion_progress.total_artworks} Sold
                  </Badge>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {Math.round(series.completion_progress.percentage_complete)}% Complete
                  </Badge>
                </div>
              )}

              {/* Completion Date */}
              {series.completed_at && (
                <p className="text-sm text-muted-foreground">
                  Completed on {new Date(series.completed_at).toLocaleDateString()}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {onNextMilestone && (
                  <Button onClick={onNextMilestone}>
                    Next Milestone
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
