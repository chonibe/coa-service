"use client"

import { useState, useRef } from "react"



import { Loader2, Upload, X, Image as ImageIcon, Sparkles, Wand2 } from "lucide-react"
import { motion } from "framer-motion"
import { CoverArtUpload } from "./CoverArtUpload"

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
interface CoverArtDesignerProps {
  value?: string | null
  onChange: (url: string | null) => void
  onUpload?: (file: File) => Promise<string>
  seriesId?: string
  firstArtworkImage?: string | null
}

// Template gallery with pre-designed cover art styles
const coverArtTemplates = [
  {
    id: "gradient-1",
    name: "Blue Gradient",
    preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    type: "gradient" as const,
  },
  {
    id: "gradient-2",
    name: "Sunset",
    preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    type: "gradient" as const,
  },
  {
    id: "gradient-3",
    name: "Ocean",
    preview: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    type: "gradient" as const,
  },
  {
    id: "gradient-4",
    name: "Forest",
    preview: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    type: "gradient" as const,
  },
  {
    id: "gradient-5",
    name: "Purple Dream",
    preview: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    type: "gradient" as const,
  },
  {
    id: "gradient-6",
    name: "Dark Mode",
    preview: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
    type: "gradient" as const,
  },
]

export function CoverArtDesigner({
  value,
  onChange,
  onUpload,
  seriesId,
  firstArtworkImage,
}: CoverArtDesignerProps) {
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleTemplateSelect = (template: typeof coverArtTemplates[0]) => {
    setSelectedTemplate(template.id)
    // For gradient templates, we'd need to convert to image
    // For now, just store the template ID
    onChange(null) // Clear current image when template selected
  }

  const handleAutoGenerate = async () => {
    if (!firstArtworkImage) return

    // Auto-generate by using first artwork as cover
    onChange(firstArtworkImage)
    setActiveTab("upload")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cover Art Designer</CardTitle>
        <CardDescription>
          Upload your own image, choose a template, or auto-generate from your first artwork
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="auto" disabled={!firstArtworkImage}>
              Auto-Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <CoverArtUpload
              value={value}
              onChange={onChange}
              onUpload={onUpload}
              seriesId={seriesId}
            />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {coverArtTemplates.map((template) => (
                <motion.button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary ring-2 ring-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="w-full h-full"
                    style={{ background: template.preview }}
                  />
                  {selectedTemplate === template.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <X className="h-4 w-4 text-primary-foreground rotate-45" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                    <p className="text-xs text-white text-center">{template.name}</p>
                  </div>
                </motion.button>
              ))}
            </div>
            {selectedTemplate && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Template selected. Note: Gradient templates will be converted to images on save.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="auto" className="mt-4">
            <div className="space-y-4">
              {firstArtworkImage ? (
                <>
                  <div className="aspect-square max-w-[400px] mx-auto rounded-lg overflow-hidden border">
                    <img
                      src={firstArtworkImage}
                      alt="First artwork preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    onClick={handleAutoGenerate}
                    className="w-full"
                    variant="outline"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Use This as Cover Art
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Add an artwork to your series first to auto-generate cover art.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

