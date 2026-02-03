"use client"

import { useState, useCallback, useEffect } from "react"
import { PenTool, Upload, X, Loader2 } from "lucide-react"
import { Button, Textarea } from "@/components/ui"
import Image from "next/image"

interface ArtistNoteEditorProps {
  blockId: number
  config: {
    content?: string
    show_signature?: boolean
    signature_url?: string
  }
  onChange: (config: any) => void
}

export default function ArtistNoteEditor({
  blockId,
  config,
  onChange
}: ArtistNoteEditorProps) {
  const [content, setContent] = useState(config.content || "")
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)
  const signatureUrl = config.signature_url

  // Debounced content update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== config.content) {
        onChange({ ...config, content })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [content])

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploadingSignature(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "image")

        const response = await fetch("/api/vendor/media-library/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        onChange({ ...config, signature_url: data.file.url })
      } catch (error) {
        console.error("Failed to upload signature:", error)
      } finally {
        setIsUploadingSignature(false)
      }
    }
    e.target.value = ""
  }

  const removeSignature = () => {
    onChange({ ...config, signature_url: "" })
  }

  // Has content - show letter-style preview
  if (content || signatureUrl) {
    return (
      <div className="space-y-4">
        {/* Collector-style Letter Preview */}
        <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-6 md:p-8 border border-rose-100 shadow-sm">
          {/* Letter Content - Editable but styled like the collector view */}
          <div className="max-w-2xl mx-auto">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dear Collector,

When I set out to create this piece, I wanted to capture...

Write from the heart - this is your personal letter to those who collect your work."
              maxLength={2000}
              className="w-full min-h-[200px] bg-transparent border-0 focus:ring-0 resize-none font-serif text-lg text-gray-800 leading-relaxed placeholder:text-gray-400"
              style={{ fontFamily: 'Georgia, serif' }}
            />
            
            {/* Signature Section */}
            <div className="mt-6 flex justify-end">
              {signatureUrl ? (
                <div className="group relative">
                  <div className="relative h-16 w-40">
                    <Image
                      src={signatureUrl}
                      alt="Artist signature"
                      fill
                      className="object-contain object-right"
                    />
                  </div>
                  <button
                    onClick={removeSignature}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => document.getElementById(`signature-upload-${blockId}`)?.click()}
                  disabled={isUploadingSignature}
                  className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center gap-1 py-2 px-4 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  {isUploadingSignature ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Add Signature
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Character count */}
        <p className="text-xs text-gray-400 text-right">
          {content.length}/2000 characters
        </p>

        <input
          id={`signature-upload-${blockId}`}
          type="file"
          accept="image/*"
          onChange={handleSignatureUpload}
          className="hidden"
        />
      </div>
    )
  }

  // Empty state
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-8 border-2 border-dashed border-rose-200 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <PenTool className="w-8 h-8 text-rose-600" />
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-1">Personal Note</h4>
        <p className="text-sm text-gray-600 mb-6">
          Write a letter to your collectors
        </p>
        
        {/* Quick-start textarea */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Dear Collector, 

I created this piece to..."
          className="w-full min-h-[120px] bg-white border-rose-200 focus:border-rose-400 resize-none font-serif text-base"
          style={{ fontFamily: 'Georgia, serif' }}
        />
        
        <p className="text-xs text-gray-400 mt-4">
          Share your inspiration, process, or a heartfelt message
        </p>
      </div>

      <input
        id={`signature-upload-${blockId}`}
        type="file"
        accept="image/*"
        onChange={handleSignatureUpload}
        className="hidden"
      />
    </div>
  )
}
