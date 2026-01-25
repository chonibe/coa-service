"use client"




import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Lock, 
  Check, 
  Plus,
  ExternalLink,
  GripVertical,
  X,
  Eye
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
interface ContentBlock {
  id: number
  title: string
  block_type?: string
  display_order: number
  is_published: boolean
}

interface SeriesBenefit {
  id: string
  type: string
  title: string
  seriesName: string
  inherited: boolean
}

interface CircularBenefit {
  id: string
  type: "hidden_series" | "vip_access" | "vip_artwork"
  title: string
  description?: string
}

interface UnifiedContentViewProps {
  contentBlocks: ContentBlock[]
  seriesBenefits?: SeriesBenefit[]
  circularBenefits?: CircularBenefit[]
  onAddBlock?: () => void
  onEditBlock?: (blockId: number) => void
  onDeleteBlock?: (blockId: number) => void
  onReorderBlocks?: (blocks: ContentBlock[]) => void
  onManageSeriesTemplate?: () => void
  onManageCircularBenefits?: () => void
  artistSignature?: string | null
  artistBio?: string | null
}

export function UnifiedContentView({
  contentBlocks,
  seriesBenefits = [],
  circularBenefits = [],
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
  onReorderBlocks,
  onManageSeriesTemplate,
  onManageCircularBenefits,
  artistSignature,
  artistBio,
}: UnifiedContentViewProps) {
  
  const getBlockIcon = (type?: string) => {
    switch (type) {
      case "text":
        return FileText
      case "image":
        return ImageIcon
      case "video":
        return Video
      case "audio":
        return Music
      default:
        return FileText
    }
  }

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case "text":
        return FileText
      case "image":
        return ImageIcon
      case "video":
        return Video
      case "audio":
        return Music
      default:
        return FileText
    }
  }

  return (
    <div className="space-y-6">
      {/* Always Shown Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            Always Shown
          </CardTitle>
          <CardDescription>
            These elements appear on every artwork page automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Artist Signature */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">Artist Signature</p>
              <p className="text-xs text-muted-foreground">From your profile</p>
            </div>
            {artistSignature ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Badge variant="outline" className="text-xs">Not set</Badge>
            )}
          </div>

          {/* Artist Bio */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">Artist Bio</p>
              <p className="text-xs text-muted-foreground">From your profile</p>
            </div>
            {artistBio ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Badge variant="outline" className="text-xs">Not set</Badge>
            )}
          </div>

          <Button variant="ghost" size="sm" className="w-full" asChild>
            <a href="/vendor/dashboard/profile" target="_blank" rel="noopener noreferrer">
              Edit Profile
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Unlocked Content Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Unlocked Content
              </CardTitle>
              <CardDescription>
                Content blocks shown after artwork authentication
              </CardDescription>
            </div>
            {onAddBlock && (
              <Button onClick={onAddBlock} size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Block
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contentBlocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No content blocks yet</p>
              <p className="text-xs mt-1">Add text, images, videos, or audio blocks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contentBlocks.map((block, index) => {
                const Icon = getBlockIcon(block.block_type)
                return (
                  <div
                    key={block.id}
                    className="flex items-center gap-3 p-3 bg-background border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-move opacity-0 group-hover:opacity-100" />
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{block.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {block.block_type || "Content"} Block
                      </p>
                    </div>
                    <Badge variant={block.is_published ? "default" : "secondary"} className="text-xs">
                      {block.is_published ? "Published" : "Draft"}
                    </Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      {onEditBlock && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditBlock(block.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {onDeleteBlock && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDeleteBlock(block.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Series Benefits Section */}
      {seriesBenefits.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Series Benefits (Inherited)</CardTitle>
                <CardDescription>
                  Content inherited from series template
                </CardDescription>
              </div>
              {onManageSeriesTemplate && (
                <Button onClick={onManageSeriesTemplate} variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Template
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {seriesBenefits.map((benefit) => {
                const Icon = getBenefitIcon(benefit.type)
                return (
                  <div
                    key={benefit.id}
                    className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
                  >
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{benefit.title}</p>
                      <p className="text-xs text-muted-foreground">From "{benefit.seriesName}" series</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Inherited</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Circular Benefits Section */}
      {circularBenefits.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Circular Benefits</CardTitle>
                <CardDescription>
                  Additional unlocks this artwork provides
                </CardDescription>
              </div>
              {onManageCircularBenefits && (
                <Button onClick={onManageCircularBenefits} variant="outline" size="sm">
                  Manage Benefits
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {circularBenefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                >
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{benefit.title}</p>
                    {benefit.description && (
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900">
                    {benefit.type === "hidden_series" ? "Hidden Series" : 
                     benefit.type === "vip_access" ? "VIP Access" : "VIP Artwork"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
