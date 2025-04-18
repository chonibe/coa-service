"use client"

import { useState } from "react"
import { type CircleEntry, circleStrategies, generateNextActions } from "@/lib/collector-circle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, ChevronRight, Users, Calendar, MessageCircle, Lightbulb, Link } from "lucide-react"

interface CollectorCircleEntryProps {
  artistId: string
  collectorId: string
  collectorProfile: any
  onActionSelected: (action: string) => void
}

export function CollectorCircleEntry({
  artistId,
  collectorId,
  collectorProfile,
  onActionSelected,
}: CollectorCircleEntryProps) {
  const [activeStrategy, setActiveStrategy] = useState<CircleEntry>("personal-touch")
  const [selectedActions, setSelectedActions] = useState<string[]>([])

  // In a real implementation, these would be derived from actual data
  const identifiedStrategies: CircleEntry[] = ["personal-touch", "shared-interest", "value-adding"]
  const nextActions = generateNextActions(identifiedStrategies, collectorProfile)

  const strategyIcons = {
    "shared-interest": <Users className="w-5 h-5" />,
    "local-presence": <Calendar className="w-5 h-5" />,
    "personal-touch": <MessageCircle className="w-5 h-5" />,
    "value-adding": <Lightbulb className="w-5 h-5" />,
    "trusted-introduction": <Link className="w-5 h-5" />,
  }

  const handleActionSelect = (action: string) => {
    if (selectedActions.includes(action)) {
      setSelectedActions(selectedActions.filter((a) => a !== action))
    } else {
      setSelectedActions([...selectedActions, action])
      onActionSelected(action)
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-indigo-600" />
          Collector Circle Entry Strategies
        </CardTitle>
        <CardDescription>
          Practical approaches to establish genuine connections with {collectorProfile.name}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue={activeStrategy} onValueChange={(value) => setActiveStrategy(value as CircleEntry)}>
          <TabsList className="grid grid-cols-3 m-2">
            {identifiedStrategies.map((strategy) => (
              <TabsTrigger key={strategy} value={strategy} className="flex items-center gap-1.5">
                {strategyIcons[strategy]}
                <span className="hidden sm:inline">{circleStrategies[strategy].type.split("-").join(" ")}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {identifiedStrategies.map((strategy) => (
            <TabsContent key={strategy} value={strategy} className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-base">{circleStrategies[strategy].description}</h3>
                  <p className="text-sm text-gray-500 mt-1">{circleStrategies[strategy].implementation}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Practical examples:</h4>
                  <ul className="space-y-1">
                    {circleStrategies[strategy].examples.map((example, i) => (
                      <li key={i} className="text-sm flex gap-2 items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Recommended next actions:</h4>
                  <ul className="space-y-1.5">
                    {generateNextActions([strategy], collectorProfile).map((action, i) => (
                      <li key={i} className="flex gap-2 items-center">
                        <Button
                          variant={selectedActions.includes(action) ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-between text-left"
                          onClick={() => handleActionSelect(action)}
                        >
                          <span className="text-sm">{action}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {collectorProfile.insights && (
        <CardFooter className="bg-slate-50 border-t p-4 flex-col items-start">
          <h4 className="text-sm font-medium mb-2">Collector Insights:</h4>
          <div className="text-sm text-gray-600">
            <p>"{collectorProfile.insights}"</p>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
