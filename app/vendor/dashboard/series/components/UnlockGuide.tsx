"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Gamepad2, Gift, Crown, Clock, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface UnlockGuideProps {
  onDismiss?: () => void
  showDismiss?: boolean
}

export function UnlockGuide({ onDismiss, showDismiss = true }: UnlockGuideProps) {
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
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Why Unlocks Matter
                </CardTitle>
                <CardDescription className="text-base">
                  Unlockable series turn art into a journey, and journeys create loyalty, repeat
                  purchases, and cultural value.
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
              <h3 className="font-semibold mb-3">Why Unlocks Exist</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Gamepad2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Finish the Set</h4>
                    <p className="text-sm text-muted-foreground">
                      Satisfy the collector instinct to "finish the set." Each purchase naturally
                      leads to the next.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Time-Based Unlocks</h4>
                    <p className="text-sm text-muted-foreground">
                      Create anticipation and daily return behavior. More attention over more days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Crown className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">VIP Unlocks</h4>
                    <p className="text-sm text-muted-foreground">
                      Reward loyalty and make owning earlier pieces matter. Build a hierarchy that
                      keeps collectors inside the ecosystem.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Why Collectors Get It Immediately</h3>
              <p className="text-sm text-muted-foreground mb-2">
                These patterns already exist in their world:
              </p>
              <div className="flex flex-wrap gap-2">
                {["Games", "Drops", "Loyalty Programs", "Patreon Tiers"].map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                They instantly recognize: "I unlock this by time / by owning / by completing."
              </p>
              <p className="text-sm font-medium mt-2">No learning curve.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Why It Matters</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>
                    <strong>Scarcity appears automatically.</strong> The structure creates demand —
                    you don't need to manufacture hype.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>
                    <strong>Retention becomes self-reinforcing.</strong> Collectors who start a
                    series rarely stop midway.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>
                    <strong>Artists generate their own momentum.</strong> You scale without
                    micromanaging drops.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>
                    <strong>The platform becomes a world, not a shop.</strong> Collectors follow
                    artists the way people follow stories.
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

