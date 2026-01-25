"use client"

import { useState } from "react"







import { Key, Crown, Clock, Sparkles, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

import { Label, Input, Textarea, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, Badge } from "@/components/ui"
interface ExclusiveAccessFormProps {
  formData: {
    title: string
    description: string
    contentUrl: string
    accessCode: string
  }
  setFormData: (data: any) => void
}

type AccessType = "early_release" | "hidden_content" | "vip" | "beta"

export function ExclusiveAccessForm({ formData, setFormData }: ExclusiveAccessFormProps) {
  const [accessType, setAccessType] = useState<AccessType>("early_release")

  const accessTypeConfig = {
    early_release: {
      label: "Early Release",
      icon: <Clock className="h-5 w-5" />,
      description: "Give collectors first access to new releases",
      example: "Early access to next artwork drop",
    },
    hidden_content: {
      label: "Hidden Content",
      icon: <Key className="h-5 w-5" />,
      description: "Unlock exclusive content not available publicly",
      example: "Access to private gallery",
    },
    vip: {
      label: "VIP Access",
      icon: <Crown className="h-5 w-5" />,
      description: "Premium tier access with special privileges",
      example: "VIP collector benefits",
    },
    beta: {
      label: "Beta Access",
      icon: <Sparkles className="h-5 w-5" />,
      description: "Early access to features or content in development",
      example: "Beta access to new series",
    },
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 3:</span>
        <span>Choose access type</span>
      </div>

      {/* Access Type Selector */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          What kind of access? <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(accessTypeConfig).map(([key, config]) => (
            <Button
              key={key}
              type="button"
              variant={accessType === key ? "default" : "outline"}
              onClick={() => setAccessType(key as AccessType)}
              className="h-28 flex flex-col gap-2 items-start text-left p-4"
            >
              <div className="flex items-center gap-2 w-full">
                {config.icon}
                <span className="font-semibold">{config.label}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">{config.description}</p>
            </Button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Access Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder={accessTypeConfig[accessType].example}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-lg h-12"
        />
        <p className="text-xs text-muted-foreground">
          How this exclusive access will appear to collectors
        </p>
      </div>

      {/* What Unlocks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 2 of 3:</span>
          <span>Define what unlocks</span>
        </div>
        <Label htmlFor="description">What will collectors get access to?</Label>
        <Textarea
          id="description"
          placeholder={`Describe what collectors will unlock: ${accessTypeConfig[accessType].description.toLowerCase()}...`}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          maxLength={400}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Be specific about what makes this access exclusive
          </p>
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/400
          </p>
        </div>
      </motion.div>

      {/* Access Details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 3 of 3:</span>
          <span>Set up access</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content-url">Access URL (Optional)</Label>
          <Input
            id="content-url"
            type="url"
            placeholder="https://..."
            value={formData.contentUrl}
            onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Link to where collectors can access this content
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="access-code">Access Code (Optional)</Label>
          <Input
            id="access-code"
            placeholder="Enter access code if required"
            value={formData.accessCode}
            onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Code collectors will need to access this benefit
          </p>
        </div>
      </motion.div>

      {/* Unlock Flow Visualization */}
      {formData.title && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Collector Journey</span>
          </div>
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">When they purchase</div>
              <div className="text-sm">This artwork</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They unlock</div>
              <div className="text-sm font-semibold text-purple-600">{accessTypeConfig[accessType].label}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They can access</div>
              <div className="text-sm">{formData.title || "Exclusive content"}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Preview */}
      {formData.title && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Key className="h-4 w-4" />
            <span className="font-semibold">Collector Preview</span>
          </div>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  {accessTypeConfig[accessType].icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{formData.title}</h4>
                    <Badge variant="outline" className="bg-purple-500/10">
                      {accessTypeConfig[accessType].label}
                    </Badge>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {formData.description}
                    </p>
                  )}
                  {(formData.contentUrl || formData.accessCode) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>
                        {formData.contentUrl && "Link provided"}
                        {formData.contentUrl && formData.accessCode && " • "}
                        {formData.accessCode && "Code required"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

