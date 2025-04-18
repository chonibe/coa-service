"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Calendar, Clock, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ExclusiveDropsProps {
  upcomingDrops: any[]
}

export function ExclusiveDrops({ upcomingDrops }: ExclusiveDropsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!upcomingDrops || upcomingDrops.length === 0) {
    return null
  }

  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }

  const calculateDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ height: 48, opacity: 0.9 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 48, opacity: 0.9 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 flex items-center cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Gift className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-medium">Upcoming Exclusive Drops</span>
              <span className="ml-auto text-white text-sm bg-white/20 rounded-full px-2">{upcomingDrops.length}</span>
            </div>

            <div className="p-3 space-y-3">
              {upcomingDrops.map((drop) => (
                <div key={drop.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{drop.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {drop.isExclusive ? "Exclusive" : "Public"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{drop.description}</p>

                  {drop.mediaUrl && (
                    <div className="mb-3 rounded-md overflow-hidden bg-gray-100">
                      <Image
                        src={drop.mediaUrl || "/placeholder.svg"}
                        alt={drop.title}
                        width={300}
                        height={200}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatReleaseDate(drop.releaseDate)}</span>
                    </div>

                    <div className="text-sm text-indigo-600 font-medium">
                      {calculateDaysUntil(drop.releaseDate) <= 0
                        ? "Available now"
                        : `In ${calculateDaysUntil(drop.releaseDate)} days`}
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setIsExpanded(false)}>
                Close
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.8 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-3 flex items-center shadow-md cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <Gift className="w-5 h-5 text-white mr-2" />
            <span className="text-white font-medium">Upcoming Exclusive Drops</span>
            <div className="ml-auto flex items-center">
              <span className="text-white text-sm bg-white/20 rounded-full px-2 py-0.5 mr-2">
                {upcomingDrops.length}
              </span>
              <Clock className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
