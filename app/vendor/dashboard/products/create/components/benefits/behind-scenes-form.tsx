"use client"

import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Video, Image as ImageIcon, FileText, X, Loader2, Eye, Sparkles, Folder } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"

interface BehindScenesFormProps {
  formData: {
    title: string
    description: string
    contentUrl: string
  }
  setFormData: (data: any) => void
}

export function BehindScenesForm({ formData, setFormData }: BehindScenesFormProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; type: string; name: string }>>([])
  const [showLibrary, setShowLibrary] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse existing contentUrl if it's a JSON array of files
  useEffect(() => {
    if (formData.contentUrl) {
      try {
        const parsed = JSON.parse(formData.contentUrl)
        if (Array.isArray(parsed)) {
          setUploadedFiles(parsed)
        } else if (typeof parsed === 'string') {
          // Single URL
          setUploadedFiles([{ url: parsed, type: 'unknown', name: 'Uploaded file' }])
        }
      } catch {
        // Not JSON, treat as single URL
        if (formData.contentUrl) {
          setUploadedFiles([{ url: formData.contentUrl, type: 'unknown', name: 'Uploaded file' }])
        }
      }
    }
  }, [formData.contentUrl])

  const handleFileUpload = async (file: File) => {
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    
    if (!isImage && !isVideo) {
      alert("Please select an image or video file")
      return
    }

    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    
    if (file.size > maxSize) {
      alert(`File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)}MB.`)
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("type", isImage ? "image" : "video")

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
      const newFile = {
        url: uploadData.url,
        type: isImage ? "image" : "video",
        name: file.name,
      }

      const updatedFiles = [...uploadedFiles, newFile]
      setUploadedFiles(updatedFiles)
      
      // Store as JSON array in contentUrl
      setFormData({
        ...formData,
        contentUrl: JSON.stringify(updatedFiles),
      })
    } catch (error: any) {
      console.error("Error uploading file:", error)
      alert(error.message || "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const handleFileRemove = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(updatedFiles)
    setFormData({
      ...formData,
      contentUrl: updatedFiles.length > 0 ? JSON.stringify(updatedFiles) : "",
    })
  }

  const handleLibrarySelect = (media: MediaItem | MediaItem[]) => {
    const mediaArray = Array.isArray(media) ? media : [media]
    const newFiles = mediaArray.map(item => ({
      url: item.url,
      type: item.type === "video" ? "video" : "image",
      name: item.name,
    }))
    
    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)
    setFormData({
      ...formData,
      contentUrl: JSON.stringify(updatedFiles),
    })
    setShowLibrary(false)
  }

  const getFileIcon = (type: string) => {
    if (type === "video") return <Video className="h-4 w-4" />
    if (type === "image") return <ImageIcon className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 3:</span>
        <span>Share your process</span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          What are you sharing? <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Process Video, Sketch Evolution, Studio Tour"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-lg h-12"
        />
        <p className="text-xs text-muted-foreground">
          Give collectors a glimpse into your creative process
        </p>
      </div>

      {/* File Upload */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Upload Process Content
        </Label>
        <p className="text-sm text-muted-foreground">
          Share videos of your process, sketches, iterations, or studio photos
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLibrary(true)}
          >
            <Folder className="h-4 w-4 mr-2" />
            Select from Library
          </Button>
        </div>
        
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
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
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">Images (10MB max) or Videos (50MB max)</p>
            </div>
          )}
        </div>

        {/* Uploaded Files Preview */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label className="text-sm font-medium">Uploaded Files</Label>
              <div className="grid grid-cols-2 gap-2">
                {uploadedFiles.map((file, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="text-xs truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleFileRemove(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step 2: Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: uploadedFiles.length > 0 || formData.description ? 1 : 0.5 }}
        className="space-y-2 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 2 of 3:</span>
          <span>Tell the story</span>
        </div>
        <Label htmlFor="description">What's happening in this process?</Label>
        <Textarea
          id="description"
          placeholder="Describe what collectors will see: the evolution of your artwork, your creative process, techniques you used..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          maxLength={400}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Help collectors understand your creative journey
          </p>
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/400
          </p>
        </div>
      </motion.div>

      {/* Preview Card */}
      {(formData.title || uploadedFiles.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Eye className="h-4 w-4" />
            <span className="font-semibold">Collector Preview</span>
          </div>
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Eye className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{formData.title || "Behind the Scenes"}</h4>
                    <Badge variant="outline" className="bg-indigo-500/10">
                      Process
                    </Badge>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {formData.description}
                    </p>
                  )}
                  {uploadedFiles.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>{uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} attached</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onSelect={handleLibrarySelect}
        mode="multiple"
        allowedTypes={["image", "video"]}
        title="Select Behind-the-Scenes Media"
      />
    </div>
  )
}

