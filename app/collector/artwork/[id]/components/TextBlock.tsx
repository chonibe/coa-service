"use client"

import { FileText } from "lucide-react"

interface TextBlockProps {
  title?: string | null
  description: string | null
}

export function TextBlock({ title, description }: TextBlockProps) {
  if (!description) return null

  return (
    <div className="py-8 md:py-12">
      {title && (
        <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
          <FileText className="h-5 w-5 text-gray-500" />
          {title}
        </h3>
      )}
      <div className="prose prose-lg max-w-none">
        <p className="whitespace-pre-line text-gray-700 leading-relaxed text-lg">
          {description}
        </p>
      </div>
    </div>
  )
}
