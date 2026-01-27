"use client"

import { useState, useCallback } from "react"
import { PenTool, Upload, X } from "lucide-react"
import { Button, Textarea } from "@/components/ui"
import Image from "next/image"

interface ArtistNoteEditorProps {
  content: string
  signatureUrl?: string
  onUpdate: (updates: { content?: string; signature_url?: string }) => void
  onFileUpload: (file: File, type: string) => void
}

export default function ArtistNoteEditor({
  content: initialContent,
  signatureUrl,
  onUpdate,
  onFileUpload
}: ArtistNoteEditorProps) {
  const [content, setContent] = useState(initialContent || "")

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setTimeout(() => onUpdate({ content: newContent }), 500)
  }, [onUpdate])

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file, "signature")
    }
    e.target.value = ""
  }

  const removeSignature = () => {
    onUpdate({ signature_url: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <PenTool className="h-6 w-6 text-amber-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">Artist Note</h3>
          <p className="text-sm text-gray-400">A personal letter to your collectors</p>
        </div>
      </div>

      {/* Note Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Note</label>
        <Textarea
          placeholder="Dear Collector,&#10;&#10;When I set out to create this piece, I wanted to capture the feeling of...&#10;&#10;[Write from the heart - share your inspiration, process, or message]"
          value={content}
          onChange={handleContentChange}
          rows={12}
          maxLength={2000}
          className="bg-gray-700 border-gray-600 text-white resize-none font-serif text-base"
        />
        <p className="text-xs text-gray-500 text-right">
          {content.length}/2000 characters
        </p>
      </div>

      {/* Signature */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300">Signature</label>
        
        {signatureUrl ? (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Current signature:</p>
              <Button
                onClick={removeSignature}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
            <div className="relative h-24 bg-white dark:bg-gray-900 rounded flex items-center justify-center">
              <Image
                src={signatureUrl}
                alt="Signature"
                width={192}
                height={96}
                className="object-contain max-w-full max-h-full"
              />
            </div>
            <Button
              onClick={() => document.getElementById("signature-upload")?.click()}
              variant="outline"
              size="sm"
              className="w-full mt-3 bg-gray-700 border-gray-600"
            >
              <Upload className="h-4 w-4 mr-2" />
              Replace Signature
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => document.getElementById("signature-upload")?.click()}
            variant="outline"
            className="w-full bg-gray-800 border-dashed border-2 border-gray-600 hover:border-amber-500 hover:bg-gray-700 py-6"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Signature Image
          </Button>
        )}

        <input
          id="signature-upload"
          type="file"
          accept="image/*"
          onChange={handleSignatureUpload}
          className="hidden"
        />
        
        <p className="text-xs text-gray-500">
          PNG or JPG image of your signature (transparent background recommended)
        </p>
      </div>

      {/* Tip */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Write authentically. Collectors appreciate hearing the story behind the work in your own voice. Think of it as a letter you'd write to someone you're sharing your art with.
        </p>
      </div>
    </div>
  )
}
