"use client"

import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Mic, Video, FileText, Loader2, Sparkles, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"

interface ArtistCommentaryFormProps {
  formData: {
    title: string
    description: string
    contentUrl: string
  }
  setFormData: (data: any) => void
}

type CommentaryType = "audio" | "video" | "text"

export function ArtistCommentaryForm({ formData, setFormData }: ArtistCommentaryFormProps) {
  const [commentaryType, setCommentaryType] = useState<CommentaryType>("audio")
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (formData.contentUrl) {
      try {
        const parsed = JSON.parse(formData.contentUrl)
        if (parsed.url) {
          setUploadedFile({ url: parsed.url, name: parsed.name || "Uploaded file" })
        }
      } catch {
        if (formData.contentUrl.startsWith("http")) {
          setUploadedFile({ url: formData.contentUrl, name: "External link" })
        }
      }
    }
  }, [formData.contentUrl])

  const handleFileUpload = async (file: File) => {
    const isAudio = file.type.startsWith("audio/")
    const isVideo = file.type.startsWith("video/")
    
    if (!isAudio && !isVideo) {
      alert("Please select an audio or video file")
      return
    }

    const MAX_AUDIO_SIZE = 50 * 1024 * 1024 // 50MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
    const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_VIDEO_SIZE
    
    if (file.size > maxSize) {
      alert(`File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)}MB.`)
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("type", isVideo ? "video" : "image") // Using image bucket for audio

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

  const getCommentaryIcon = () => {
    switch (commentaryType) {
      case "audio":
        return <Mic className="h-5 w-5" />
      case "video":
        return <Video className="h-5 w-5" />
      default:
        return <MessageSquare className="h-5 w-5" />
    }
  }

  const storyPrompts = [
    "What inspired this artwork?",
    "What was your creative process?",
    "What makes this piece special to you?",
    "What story does this artwork tell?",
    "What techniques did you use?",
  ]

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 3:</span>
        <span>Choose commentary format</span>
      </div>

      {/* Commentary Type Selector */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          How will you share your story? <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <Button
            type="button"
            variant={commentaryType === "audio" ? "default" : "outline"}
            onClick={() => setCommentaryType("audio")}
            className="h-24 flex flex-col gap-2"
          >
            <Mic className="h-6 w-6" />
            <span>Audio</span>
          </Button>
          <Button
            type="button"
            variant={commentaryType === "video" ? "default" : "outline"}
            onClick={() => setCommentaryType("video")}
            className="h-24 flex flex-col gap-2"
          >
            <Video className="h-6 w-6" />
            <span>Video</span>
          </Button>
          <Button
            type="button"
            variant={commentaryType === "text" ? "default" : "outline"}
            onClick={() => setCommentaryType("text")}
            className="h-24 flex flex-col gap-2"
          >
            <MessageSquare className="h-6 w-6" />
            <span>Written</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose how you want to share your story with collectors
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Commentary Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., The Story Behind [Artwork Name], Artist's Journey, Creative Process"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-lg h-12"
        />
      </div>

      {/* Upload or Text Input */}
      {commentaryType !== "text" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3 pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-primary">Step 2 of 3:</span>
            <span>Record or upload</span>
          </div>
          <Label className="text-base font-semibold">
            {commentaryType === "audio" ? "Upload Audio Recording" : "Upload Video Commentary"}
          </Label>
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={commentaryType === "audio" ? "audio/*" : "video/*"}
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
                {getCommentaryIcon()}
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">Click to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">
                  {commentaryType === "audio" ? "Audio file (50MB max)" : "Video file (50MB max)"}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3 pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-primary">Step 2 of 3:</span>
            <span>Write your story</span>
          </div>
          <Label htmlFor="description">Your Commentary</Label>
          <Textarea
            id="description"
            placeholder="Share the story behind this artwork, your inspiration, creative process, or what makes it special..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={8}
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/1000
            </p>
          </div>
        </motion.div>
      )}

      {/* Story Prompts */}
      {commentaryType !== "text" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: uploadedFile ? 1 : 0.5 }}
          className="space-y-3 pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-primary">Step 3 of 3:</span>
            <span>Guide your story</span>
          </div>
          <Label className="text-base font-semibold">Story Prompts</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Consider covering these topics in your {commentaryType}:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {storyPrompts.map((prompt, index) => (
              <Card key={index} className="p-3 bg-muted/30">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">{index + 1}.</span>
                  <p className="text-sm">{prompt}</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="description">Additional Notes (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional context or notes about your commentary..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/300
            </p>
          </div>
        </motion.div>
      )}

      {/* Preview */}
      {(formData.title || uploadedFile || (commentaryType === "text" && formData.description)) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Collector Preview</span>
          </div>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  {getCommentaryIcon()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{formData.title || "Artist Commentary"}</h4>
                    <Badge variant="outline" className="bg-purple-500/10">
                      {commentaryType === "audio" ? "Audio" : commentaryType === "video" ? "Video" : "Written"}
                    </Badge>
                  </div>
                  {commentaryType === "text" && formData.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {formData.description}
                    </p>
                  )}
                  {commentaryType !== "text" && uploadedFile && (
                    <p className="text-xs text-muted-foreground">
                      {commentaryType === "audio" ? "Audio recording" : "Video commentary"} ready
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

