"use client"

import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Video, Image as ImageIcon, Link as LinkIcon, Loader2, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface DigitalContentFormProps {
  formData: {
    title: string
    description: string
    contentUrl: string
  }
  setFormData: (data: any) => void
}

type ContentType = "pdf" | "video" | "image" | "link"
type DeliveryMethod = "upload" | "link"

export function DigitalContentForm({ formData, setFormData }: DigitalContentFormProps) {
  const [contentType, setContentType] = useState<ContentType>("pdf")
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("upload")
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse existing contentUrl
  useEffect(() => {
    if (formData.contentUrl) {
      if (formData.contentUrl.startsWith("http")) {
        setDeliveryMethod("link")
        setUploadedFile({ url: formData.contentUrl, name: "External link" })
      } else {
        setDeliveryMethod("upload")
        try {
          const parsed = JSON.parse(formData.contentUrl)
          if (parsed.url) {
            setUploadedFile({ url: parsed.url, name: parsed.name || "Uploaded file" })
          }
        } catch {
          setUploadedFile({ url: formData.contentUrl, name: "Uploaded file" })
        }
      }
    }
  }, [formData.contentUrl])

  const handleFileUpload = async (file: File) => {
    const isPDF = file.type === "application/pdf"
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    
    if (!isPDF && !isImage && !isVideo) {
      alert("Please select a PDF, image, or video file")
      return
    }

    const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
    
    let maxSize = MAX_PDF_SIZE
    if (isImage) maxSize = MAX_IMAGE_SIZE
    if (isVideo) maxSize = MAX_VIDEO_SIZE
    
    if (file.size > maxSize) {
      alert(`File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)}MB.`)
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("type", isPDF ? "pdf" : isImage ? "image" : "video")

      const uploadResponse = await fetch("/api/vendor/products/upload", {
        method: "POST",
        credentials: "include",
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to upload file")
      }

      const uploadData = await uploadResponse.json()
      const fileData = {
        url: uploadData.url,
        name: file.name,
      }

      setUploadedFile(fileData)
      setFormData({
        ...formData,
        contentUrl: JSON.stringify(fileData),
      })
    } catch (error: any) {
      console.error("Error uploading file:", error)
      alert(error.message || "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const getContentTypeIcon = () => {
    switch (contentType) {
      case "pdf":
        return <FileText className="h-5 w-5" />
      case "video":
        return <Video className="h-5 w-5" />
      case "image":
        return <ImageIcon className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 3:</span>
        <span>Choose content type</span>
      </div>

      {/* Content Type Selector */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          What type of content? <span className="text-red-500">*</span>
        </Label>
        <Select value={contentType} onValueChange={(value) => setContentType(value as ContentType)}>
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>PDF Document</span>
              </div>
            </SelectItem>
            <SelectItem value="video">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>Video</span>
              </div>
            </SelectItem>
            <SelectItem value="image">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Image</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the type of digital content collectors will receive
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Content Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder={`e.g., ${contentType === 'pdf' ? 'Artist Process Guide' : contentType === 'video' ? 'Making of Video' : 'High-Res Process Images'}`}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-lg h-12"
        />
      </div>

      {/* Delivery Method */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 2 of 3:</span>
          <span>Add your content</span>
        </div>
        <Label className="text-base font-semibold">How will collectors access this?</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={deliveryMethod === "upload" ? "default" : "outline"}
            onClick={() => setDeliveryMethod("upload")}
            className="h-20 flex flex-col gap-2"
          >
            <Upload className="h-5 w-5" />
            <span>Upload File</span>
          </Button>
          <Button
            type="button"
            variant={deliveryMethod === "link" ? "default" : "outline"}
            onClick={() => setDeliveryMethod("link")}
            className="h-20 flex flex-col gap-2"
          >
            <LinkIcon className="h-5 w-5" />
            <span>External Link</span>
          </Button>
        </div>
      </motion.div>

      {/* Upload or Link Input */}
      {deliveryMethod === "upload" ? (
        <div className="space-y-3">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={contentType === "pdf" ? "application/pdf" : contentType === "video" ? "video/*" : "image/*"}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : uploadedFile ? (
              <div className="flex flex-col items-center gap-2">
                {getContentTypeIcon()}
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">Click to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">
                  {contentType === "pdf" ? "PDF (50MB max)" : contentType === "video" ? "Video (50MB max)" : "Image (10MB max)"}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="content-url">Content URL</Label>
          <Input
            id="content-url"
            type="url"
            placeholder="https://..."
            value={formData.contentUrl.startsWith("http") ? formData.contentUrl : ""}
            onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Link to where collectors can access this content
          </p>
        </div>
      )}

      {/* Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: (uploadedFile || deliveryMethod === "link") ? 1 : 0.5 }}
        className="space-y-2 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 3 of 3:</span>
          <span>Describe the content</span>
        </div>
        <Label htmlFor="description">What will collectors receive?</Label>
        <Textarea
          id="description"
          placeholder="Describe what's in this content and why collectors will find it valuable..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          maxLength={300}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Help collectors understand what they're getting
          </p>
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/300
          </p>
        </div>
      </motion.div>

      {/* Preview */}
      {(formData.title || uploadedFile || formData.contentUrl) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Collector Preview</span>
          </div>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  {getContentTypeIcon()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{formData.title || "Digital Content"}</h4>
                    <Badge variant="outline" className="bg-blue-500/10">
                      {contentType.toUpperCase()}
                    </Badge>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {formData.description}
                    </p>
                  )}
                  {(uploadedFile || formData.contentUrl) && (
                    <p className="text-xs text-muted-foreground">
                      {deliveryMethod === "upload" ? "File ready" : "Link provided"}
                    </p>
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

