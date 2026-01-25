"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface MediaUploaderProps {
  onUploadComplete: () => void
}

interface UploadFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "complete" | "error"
  error?: string
  id: string
}

export function MediaUploader({ onUploadComplete }: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const { toast } = useToast()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }, [])

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: "pending",
      id: `${Date.now()}-${Math.random()}`,
    }))

    setFiles(prev => [...prev, ...uploadFiles])
    uploadFiles.forEach(uploadFile)
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: "uploading" } : f
    ))

    try {
      const formData = new FormData()
      formData.append("file", uploadFile.file)
      
      // Determine type
      let type = "image"
      if (uploadFile.file.type.startsWith("video/")) type = "video"
      else if (uploadFile.file.type.startsWith("audio/")) type = "audio"
      else if (uploadFile.file.type === "application/pdf") type = "pdf"
      
      formData.append("type", type)

      const response = await fetch("/api/vendor/media-library/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, status: "complete", progress: 100 } : f
      ))
    } catch (error: any) {
      console.error("Upload error:", error)
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, status: "error", error: error.message } : f
      ))
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== "complete"))
    if (files.every(f => f.status === "complete")) {
      onUploadComplete()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const allComplete = files.length > 0 && files.every(f => f.status === "complete")

  return (
    <div className="border-2 border-dashed rounded-lg p-6">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        className={`text-center ${isDragOver ? "bg-accent" : ""}`}
      >
        <div className="mb-4">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-lg font-medium mb-1">Drop files here or click to upload</p>
          <p className="text-sm text-muted-foreground">
            Images (10MB), Videos (50MB), Audio (50MB), PDFs (50MB)
          </p>
        </div>
        <input
          type="file"
          multiple
          accept="image/*,video/*,audio/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button type="button" asChild>
            <span>Select Files</span>
          </Button>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Uploading {files.length} file(s)</h3>
            {allComplete && (
              <Button size="sm" onClick={clearCompleted}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            )}
          </div>
          {files.map((uploadFile) => (
            <div key={uploadFile.id} className="bg-card p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadFile.file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {uploadFile.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {uploadFile.status === "complete" && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {uploadFile.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {uploadFile.status === "uploading" && (
                <Progress value={uploadFile.progress} className="h-1" />
              )}
              {uploadFile.status === "error" && (
                <p className="text-xs text-destructive mt-1">{uploadFile.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
