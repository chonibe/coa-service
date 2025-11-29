"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Gift, Users, TrendingUp, Sparkles, FileText, Key, Video } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface BenefitsGuideProps {
  onDismiss?: () => void
  showDismiss?: boolean
}

export function BenefitsGuide({ onDismiss, showDismiss = true }: BenefitsGuideProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Why Perks Matter for Your Artwork
                </CardTitle>
                <CardDescription className="text-base">
                  Perks turn purchases into experiences. They reward collectors and create lasting value
                  that goes beyond the artwork itself.
                </CardDescription>
              </div>
              {showDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Why Add Perks?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Gift className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Increase Perceived Value</h4>
                    <p className="text-sm text-muted-foreground">
                      Exclusive perks make your artwork more valuable. Collectors get more than just
                      the piece—they get access, content, and experiences.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Build Collector Loyalty</h4>
                    <p className="text-sm text-muted-foreground">
                      Rewarding collectors creates a community. They feel valued and are more likely
                      to purchase again and recommend your work.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Stand Out from Competitors</h4>
                    <p className="text-sm text-muted-foreground">
                      Most artists don't offer perks. Adding them differentiates your work and makes
                      your editions more attractive to collectors.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Popular Perk Types</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Digital Content</h4>
                    <p className="text-xs text-muted-foreground">PDFs, videos, exclusive images</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                  <Key className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Exclusive Access</h4>
                    <p className="text-xs text-muted-foreground">Early access to new releases</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                  <Video className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Virtual Events</h4>
                    <p className="text-xs text-muted-foreground">Livestreams, Q&A sessions</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                  <Gift className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Physical Items</h4>
                    <p className="text-xs text-muted-foreground">Signed prints, merchandise</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Best Practices</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Start simple.</strong> You can always add more perks later. Even one
                    benefit adds value.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Be specific.</strong> Clear, detailed perks are more valuable than vague
                    promises.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Deliver on time.</strong> Set realistic dates and stick to them. Your
                    reputation depends on it.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Use series-level perks.</strong> When creating a series, you can add
                    perks that apply to all artworks, saving time and creating consistency.
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

