"use client"

import { useState } from "react"
import { Star, Trophy, Lightbulb, MessageSquare, Users, ChevronUp, ChevronDown, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { type InfluenceLevel, getLevelBenefits } from "@/lib/engagement/influence-system"

interface InfluenceJourneyProps {
  influence: {
    currentLevel: InfluenceLevel
    pointsInLevel: number
    pointsToNextLevel: number
    percentToNextLevel: number
    totalPoints: number
    contributions: number
    feedbackCount: number
    ideasImplemented: number
    recognitionCount: number
  }
  recentContributors: any[]
  topContributors: any[]
  implementedIdeas: any[]
  onSubmitIdea: () => void
}

export function InfluenceJourney({
  influence,
  recentContributors,
  topContributors,
  implementedIdeas,
  onSubmitIdea,
}: InfluenceJourneyProps) {
  const [expanded, setExpanded] = useState(false)

  const levelIcons = {
    Collector: <Star className="w-4 h-4" />,
    Supporter: <MessageSquare className="w-4 h-4" />,
    Insider: <Users className="w-4 h-4" />,
    Collaborator: <Lightbulb className="w-4 h-4" />,
    "Co-Creator": <Trophy className="w-4 h-4" />,
  }

  const levelColors = {
    Collector: "text-blue-500 bg-blue-500/10",
    Supporter: "text-purple-500 bg-purple-500/10",
    Insider: "text-amber-500 bg-amber-500/10",
    Collaborator: "text-emerald-500 bg-emerald-500/10",
    "Co-Creator": "text-pink-500 bg-pink-500/10",
  }

  const benefits = getLevelBenefits(influence.currentLevel)
  const nextLevelBenefits =
    influence.currentLevel !== "Co-Creator"
      ? getLevelBenefits(
          influence.currentLevel === "Collector"
            ? "Supporter"
            : influence.currentLevel === "Supporter"
              ? "Insider"
              : influence.currentLevel === "Insider"
                ? "Collaborator"
                : "Co-Creator",
        )
      : []

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              levelColors[influence.currentLevel],
            )}
          >
            {levelIcons[influence.currentLevel]}
          </div>
          <div>
            <h3 className="font-medium">{influence.currentLevel} Status</h3>
            <p className="text-sm text-gray-500">
              {influence.currentLevel === "Co-Creator"
                ? "Maximum level reached"
                : `${influence.pointsToNextLevel} points to next level`}
            </p>
          </div>
        </div>
        <div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{influence.pointsInLevel} points in level</span>
          <span>{influence.totalPoints} total points</span>
        </div>
        <Progress value={influence.percentToNextLevel} className="h-2" />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 border-t border-gray-100">
          {/* Current benefits */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Your Current Benefits</h4>
            <ul className="space-y-1">
              {benefits.map((benefit, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Next level benefits */}
          {influence.currentLevel !== "Co-Creator" && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Next Level Benefits</h4>
              <ul className="space-y-1">
                {nextLevelBenefits.map((benefit, i) => (
                  <li key={i} className="text-sm flex items-center gap-2 text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social proof section */}
          <div className="mt-6 space-y-4">
            {/* Top contributors */}
            {topContributors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Top Contributors
                </h4>
                <div className="flex flex-col gap-2">
                  {topContributors.map((contributor, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={contributor.collectors.profile_image_url || "/placeholder.svg"} />
                          <AvatarFallback>{contributor.collectors.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{contributor.collectors.name}</span>
                      </div>
                      <div
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          levelColors[contributor.current_level as InfluenceLevel],
                        )}
                      >
                        {contributor.current_level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Implemented ideas */}
            {implementedIdeas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Ideas Brought to Life
                </h4>
                <div className="flex flex-col gap-2">
                  {implementedIdeas.map((idea, i) => (
                    <div key={i} className="text-sm">
                      <div className="font-medium">{idea.title}</div>
                      <div className="text-xs text-gray-500">Suggested by {idea.collectors.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity */}
            {recentContributors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  Recent Community Activity
                </h4>
                <div className="flex flex-col gap-2">
                  {recentContributors.map((contrib, i) => (
                    <div key={i} className="text-sm flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={contrib.collectors.profile_image_url || "/placeholder.svg"} />
                        <AvatarFallback>{contrib.collectors.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>
                        <span className="font-medium">{contrib.collectors.name}</span>
                        <span className="text-gray-500">
                          {" "}
                          {contrib.contribution_type === "provide_feedback"
                            ? "provided feedback"
                            : contrib.contribution_type === "submit_idea"
                              ? "submitted an idea"
                              : "shared content"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={onSubmitIdea} className="w-full" disabled={influence.currentLevel === "Collector"}>
              <Lightbulb className="w-4 h-4 mr-2" />
              Submit Idea to Artist
            </Button>

            {influence.currentLevel === "Collector" && (
              <p className="text-xs text-center text-gray-500 mt-1">
                Reach "Supporter" level to unlock idea submission
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
