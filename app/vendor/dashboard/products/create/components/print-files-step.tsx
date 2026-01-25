"use client"

import { useState } from "react"




import { FileText, Download, Upload, Link as LinkIcon, CheckCircle2 } from "lucide-react"
import type { ProductSubmissionData } from "@/types/product-submission"

import { Label, Input, Button, Alert, AlertDescription } from "@/components/ui"
interface PrintFilesStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
}

export function PrintFilesStep({ formData, setFormData }: PrintFilesStepProps) {
  const [uploading, setUploading] = useState(false)

  const handlePDFUpload = async (file: File) => {
    // Validate file size (50MB max for PDFs)
    const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_PDF_SIZE) {
      alert(`PDF file is too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`)
      return
    }

    setUploading(true)
    try {
      console.log(`[PDF Upload] Starting upload for file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      
      // Upload via server-side route (uses service role key, bypasses RLS)
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("type", "pdf")

      const uploadResponse = await fetch("/api/vendor/products/upload", {
        method: "POST",
        credentials: "include",
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error(`[PDF Upload] Upload failed:`, errorData)
        throw new Error(errorData.error || errorData.message || "Failed to upload PDF")
      }

      const uploadData = await uploadResponse.json()
      console.log(`[PDF Upload] Upload successful! Public URL: ${uploadData.url}`)

      setFormData({
        ...formData,
        print_files: {
          ...formData.print_files,
          pdf_url: uploadData.url,
        },
      })
    } catch (error: any) {
      console.error("Error uploading PDF:", error)
      alert(error.message || "Failed to upload PDF. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleTemplateDownload = async () => {
    try {
      // Try to fetch the template file from the API route
      const response = await fetch("/api/vendor/products/print-template", {
        credentials: "include",
      })
      
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Production Files</h3>
        <p className="text-sm text-muted-foreground">
          Upload high-resolution PDF files for production printing. These files are used for actual printing, not for customer preview.
        </p>
      </div>

      {/* PDF Upload - Central and Clean */}
      <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
        <div className="w-full">
          <Label htmlFor="pdf-upload" className="text-base font-semibold mb-3 block text-center">
            Upload Production PDF
          </Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 bg-muted/50 hover:border-primary transition-colors">
            <div className="flex flex-col items-center justify-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Drop your PDF here or click to browse</p>
                <p className="text-xs text-muted-foreground">High-resolution PDF for production printing</p>
              </div>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handlePDFUpload(file)
                  }
                }}
                disabled={uploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("pdf-upload")?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Choose PDF File"}
              </Button>
              {formData.print_files?.pdf_url && (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>PDF Uploaded Successfully</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {formData.print_files?.pdf_url && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm mt-4">
            <a
              href={formData.print_files.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline flex items-center gap-1"
            >
              <FileText className="h-3 w-3" />
              View uploaded PDF
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFormData({
                  ...formData,
                  print_files: {
                    ...formData.print_files,
                    pdf_url: null,
                  },
                })
              }}
              className="w-full sm:w-auto"
            >
              Remove
            </Button>
          </div>
        )}
        {uploading && (
          <Alert className="mt-4">
            <Upload className="h-4 w-4 animate-pulse" />
            <AlertDescription>
              Uploading PDF... Please wait.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Template Download */}
      <div className="border rounded-lg p-4 bg-muted/50 max-w-md mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-semibold">Print File Template</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Download template for specifications
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleTemplateDownload}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Google Drive Link */}
      <div className="space-y-2 max-w-md mx-auto">
        <Label htmlFor="drive-link" className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Google Drive Link (Alternative)
        </Label>
        <Input
          id="drive-link"
          value={formData.print_files?.drive_link || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              print_files: {
                ...formData.print_files,
                drive_link: e.target.value || null,
              },
            })
          }
          placeholder="https://drive.google.com/file/d/..."
          type="url"
        />
        <p className="text-xs text-muted-foreground">
          Provide a Google Drive link as an alternative to uploading a PDF directly
        </p>
      </div>
    </div>
  )
}

