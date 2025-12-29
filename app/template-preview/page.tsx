"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Image as ImageIcon, Box } from "lucide-react"
import { TemplatePreviewer } from "./components/template-previewer"
import { ArtworkUploader } from "./components/artwork-uploader"
import { Spline3DPreview } from "./components/spline-3d-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TemplatePreviewPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [side1Image, setSide1Image] = useState<string | null>(null)
  const [side2Image, setSide2Image] = useState<string | null>(null)

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/template-preview/print-template")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "print-file-template.pdf"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        // Fallback: try direct file path
        const templateUrl = "/templates/print-file-template.pdf"
        const link = document.createElement("a")
        link.href = templateUrl
        link.download = "print-file-template.pdf"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Error downloading template:", error)
      alert("Template file not available. Please contact support.")
    }
  }

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl)
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
  }

  const handleSide1Upload = (imageUrl: string) => {
    setSide1Image(imageUrl)
  }

  const handleSide1Remove = () => {
    setSide1Image(null)
  }

  const handleSide2Upload = (imageUrl: string) => {
    setSide2Image(imageUrl)
  }

  const handleSide2Remove = () => {
    setSide2Image(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Template Preview</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Preview how your artwork will look in our print format. Upload your art and see it on the template before onboarding.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Upload & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Preview Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Template Preview
                </CardTitle>
                <CardDescription>
                  Upload an image to see how it looks on the template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArtworkUploader
                  onImageUpload={handleImageUpload}
                  onImageRemove={handleRemoveImage}
                  currentImage={uploadedImage}
                />
              </CardContent>
            </Card>

            {/* 3D Lamp Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  3D Lamp Preview
                </CardTitle>
                <CardDescription>
                  Upload images for both sides of the lamp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Side 1</label>
                  <ArtworkUploader
                    onImageUpload={handleSide1Upload}
                    onImageRemove={handleSide1Remove}
                    currentImage={side1Image}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Side 2</label>
                  <ArtworkUploader
                    onImageUpload={handleSide2Upload}
                    onImageRemove={handleSide2Remove}
                    currentImage={side2Image}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Download Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download Template
                </CardTitle>
                <CardDescription>
                  Get the PDF template file for reference
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleDownloadTemplate}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Template
                </Button>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• High-resolution PDF format</p>
                  <p>• Print-ready specifications</p>
                  <p>• Use as reference for your artwork</p>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <p>Upload artwork for template preview (optional)</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <p>Upload images for both sides of the lamp</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <p>View your artwork in the 3D lamp preview</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <p>Download the template PDF for reference</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="3d" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="3d">3D Lamp Preview</TabsTrigger>
                <TabsTrigger value="template">Template Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="template" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Template Preview</CardTitle>
                    <CardDescription>
                      See how your artwork looks on the print template. Position and adjust your artwork within the frame.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TemplatePreviewer artworkImage={uploadedImage} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="3d" className="mt-4">
                <Spline3DPreview 
                  image1={side1Image} 
                  image2={side2Image}
                  // Object IDs (UUIDs) from Spline scene
                  side1ObjectId="2de1e7d2-4b53-4738-a749-be197641fa9a"
                  side2ObjectId="2e33392b-21d8-441d-87b0-11527f3a8b70"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer Info */}
        <Alert className="max-w-4xl mx-auto">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This is a preview tool to help you visualize your artwork on our print format. 
            The actual template specifications and requirements will be provided during the onboarding process. 
            For questions or to begin onboarding, please contact our team.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

