"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Star, Lightbulb, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ConnectionOpportunitiesProps {
  artistId: string
  collectorId: string
  opportunities: any[]
  mutualConnections: any[]
}

export function ConnectionOpportunities({
  artistId,
  collectorId,
  opportunities,
  mutualConnections,
}: ConnectionOpportunitiesProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(
    opportunities.length > 0 ? opportunities[0].id : null,
  )

  const currentOpportunity = opportunities.find((opp) => opp.id === selectedOpportunity)

  // Get top mutual connection
  const topConnection = mutualConnections.length > 0 ? mutualConnections[0] : null

  const typeIcons: Record<string, React.ReactNode> = {
    event: <Calendar className="w-5 h-5" />,
    interest: <Lightbulb className="w-5 h-5" />,
    mutual_connection: <Users className="w-5 h-5" />,
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="w-5 h-5 text-amber-500" />
          Top Connection Opportunities
        </CardTitle>
        <CardDescription>High-value ways to enter this collector's circle</CardDescription>
      </CardHeader>

      <CardContent className="p-4">
        {opportunities.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {opportunities.map((opportunity) => (
                <button
                  key={opportunity.id}
                  className={cn(
                    "border rounded-lg p-3 text-left transition-all",
                    opportunity.id === selectedOpportunity ? "border-indigo-500 bg-indigo-50" : "hover:border-gray-300",
                  )}
                  onClick={() => setSelectedOpportunity(opportunity.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "p-1.5 rounded-full",
                        opportunity.id === selectedOpportunity ? "bg-indigo-100" : "bg-gray-100",
                      )}
                    >
                      {typeIcons[opportunity.type]}
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {opportunity.connectionScore}%
                    </Badge>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{opportunity.title}</h3>
                  <div className="text-xs text-gray-500">{opportunity.type === "event" && opportunity.date}</div>
                </button>
              ))}
            </div>

            {currentOpportunity && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">{currentOpportunity.title}</h3>
                  <Badge variant={currentOpportunity.connectionScore >= 90 ? "default" : "secondary"}>
                    {currentOpportunity.connectionScore}% Match
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-4">{currentOpportunity.description}</p>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Connection Strength</div>
                    <Progress value={currentOpportunity.connectionScore} className="h-2" />
                  </div>

                  {currentOpportunity.type === "mutual_connection" && topConnection && (
                    <div className="flex items-center gap-3 border-t pt-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={topConnection.profileImageUrl || "/placeholder.svg"}
                          alt={topConnection.name}
                        />
                        <AvatarFallback>{topConnection.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{topConnection.name}</div>
                        <div className="text-sm text-gray-500">{topConnection.role}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button className="gap-1.5">
                      <span>Take Action</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>No connection opportunities found yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
