"use client"

import { useState } from "react"
import { Sparkles, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui"
import { PAGE_TEMPLATES, type PageTemplate } from "@/lib/artwork-blocks/page-templates"

interface TemplatePickerCardProps {
  onSelectTemplate: (template: PageTemplate) => void
  onDismiss: () => void
}

export default function TemplatePickerCard({ 
  onSelectTemplate, 
  onDismiss 
}: TemplatePickerCardProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 rounded-lg">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Start with a Template</h3>
            <p className="text-sm text-gray-400">Choose a layout to get started quickly</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Template Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {PAGE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            className={`
              relative p-4 rounded-lg border text-left transition-all
              ${hoveredTemplate === template.id 
                ? 'border-indigo-500 bg-indigo-900/20 scale-[1.02]' 
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }
            `}
          >
            {/* Template Icon */}
            <div className="text-3xl mb-3">{template.icon}</div>
            
            {/* Template Info */}
            <h4 className="font-semibold text-white mb-1">{template.name}</h4>
            <p className="text-xs text-gray-400 mb-3">{template.description}</p>
            
            {/* Block Count */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {template.blocks.length} blocks
              </span>
              <ChevronRight className={`h-4 w-4 transition-transform ${
                hoveredTemplate === template.id ? 'text-indigo-400 translate-x-1' : 'text-gray-600'
              }`} />
            </div>

            {/* Hover Preview */}
            {hoveredTemplate === template.id && (
              <div className="absolute left-full ml-2 top-0 w-48 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10 hidden lg:block">
                <p className="text-xs text-gray-400 mb-2">Includes:</p>
                <ul className="space-y-1">
                  {template.blocks.map((block, idx) => (
                    <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      {block.title || block.type.replace("Artwork ", "").replace(" Block", "")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Start from Scratch Option */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={onDismiss}
          className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors py-2"
        >
          Or start from scratch →
        </button>
      </div>
    </div>
  )
}
