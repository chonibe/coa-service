"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Award, Star, Trophy, Crown, Clock, Gift } from "lucide-react"
import { format } from "date-fns"

interface RewardsData {
  points: number
  level: string
  current_tier: {
    name: string
    required_points: number
    benefits: string[]
  }
  next_tier: {
    name: string
    required_points: number
    benefits: string[]
  } | null
  points_to_next_tier: number
  created_at: string
}

interface RewardEvent {
  event_type: string
  points_earned: number
  description: string
  created_at: string
}

interface RewardsHistoryData {
  events: RewardEvent[]
  total_events: number
  current_page: number
  total_pages: number
  total_points: number
  current_level: string
}

export function RewardsSection({ customerId }: { customerId: string }) {
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null)
  const [historyData, setHistoryData] = useState<RewardsHistoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRewardsData = async () => {
    try {
      const [rewardsResponse, historyResponse] = await Promise.all([
        fetch(`/api/rewards/balance?customer_id=${customerId}`),
        fetch(`/api/rewards/history?customer_id=${customerId}`)
      ])

      if (!rewardsResponse.ok || !historyResponse.ok) {
        throw new Error("Failed to fetch rewards data")
      }

      const rewards = await rewardsResponse.json()
      const history = await historyResponse.json()

      setRewardsData(rewards)
      setHistoryData(history)
    } catch (err) {
      setError("Failed to load rewards data")
      console.error("Error fetching rewards:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRewardsData()
  }, [customerId])

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "platinum":
        return <Crown className="w-5 h-5 text-purple-400" />
      case "gold":
        return <Trophy className="w-5 h-5 text-yellow-400" />
      case "silver":
        return <Star className="w-5 h-5 text-gray-400" />
      default:
        return <Award className="w-5 h-5 text-amber-400" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rewards & Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
            <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rewards & Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!rewardsData || !historyData) return null

  const progressToNextTier = rewardsData.next_tier
    ? ((rewardsData.points - rewardsData.current_tier.required_points) /
        (rewardsData.next_tier.required_points - rewardsData.current_tier.required_points)) *
      100
    : 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Rewards & Benefits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getLevelIcon(rewardsData.level)}
            <div>
              <p className="font-medium">{rewardsData.level} Level</p>
              <p className="text-sm text-muted-foreground">{rewardsData.points} points</p>
            </div>
          </div>
          {rewardsData.next_tier && (
            <Badge variant="outline" className="bg-zinc-900/50">
              {rewardsData.points_to_next_tier} points to {rewardsData.next_tier.name}
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        {rewardsData.next_tier && (
          <div className="space-y-2">
            <Progress value={progressToNextTier} className="h-2" />
            <p className="text-sm text-muted-foreground text-right">
              {Math.round(progressToNextTier)}% to next level
            </p>
          </div>
        )}

        {/* Current Benefits */}
        <div className="space-y-2">
          <h3 className="font-medium">Your Benefits</h3>
          <div className="grid gap-2">
            {rewardsData.current_tier.benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm p-2 rounded-lg bg-zinc-900/50"
              >
                <Gift className="w-4 h-4 text-amber-400" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-2">
          <h3 className="font-medium">Recent Activity</h3>
          <div className="space-y-2">
            {historyData.events.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm">{event.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-400">
                  +{event.points_earned}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 