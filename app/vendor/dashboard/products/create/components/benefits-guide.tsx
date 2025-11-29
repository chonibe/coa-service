"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Gift, Users, TrendingUp, Sparkles, FileText, Key, Video, Eye } from "lucide-react"
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
                  Hidden Treasures for Collectors
                </CardTitle>
                <CardDescription className="text-base">
                  Hidden treasures turn purchases into journeys. Share exclusive knowledge, process insights,
                  or unlock hidden series that only collectors can access.
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
              <h3 className="font-semibold mb-3">Why Share Hidden Treasures?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Gift className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Share Your Journey</h4>
                    <p className="text-sm text-muted-foreground">
                      Give collectors insight into your creative process. Share sketches, iterations,
                      or stories behind the artwork that only they can access.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Create Exclusive Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Unlock hidden series, early access to new works, or exclusive content that
                      makes collectors feel part of your artistic journey.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Build Deeper Connections</h4>
                    <p className="text-sm text-muted-foreground">
                      When collectors understand your process and story, they become more invested.
                      Hidden treasures create lasting relationships beyond the purchase.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Types of Hidden Treasures</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                  <Eye className="h-4 w-4 text-indigo-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Behind the Scenes</h4>
                    <p className="text-xs text-muted-foreground">Process videos, sketches, iterations</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Collector Archive</h4>
                    <p className="text-xs text-muted-foreground">High-res process images, notes</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                  <Key className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Hidden Series</h4>
                    <p className="text-xs text-muted-foreground">Unlock exclusive series access</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                  <Video className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Artist Commentary</h4>
                    <p className="text-xs text-muted-foreground">Audio/video stories about the work</p>
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
                    <strong>Share knowledge, not fluff.</strong> Focus on insights about your process,
                    stories behind the artwork, or exclusive access that collectors can't get elsewhere.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Keep it personal.</strong> This is your chance to connect with collectors.
                    Share what makes this artwork special to you.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Hidden series are powerful.</strong> Create exclusive series that only unlock
                    when collectors purchase specific artworks. This creates true exclusivity.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Start with one treasure.</strong> You don't need to add everything at once.
                    Even a simple process video or artist note adds significant value.
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

