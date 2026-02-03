"use client"

import { useState } from "react"
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Mic, 
  Camera, 
  Lightbulb, 
  PenTool,
  Search,
  Layers,
  MapPin
} from "lucide-react"
import { Input } from "@/components/ui"
import { BLOCK_SCHEMAS, getBlocksByCategory, type BlockSchema } from "@/lib/artwork-blocks/block-schemas"

// Map icon names to Lucide components
const ICON_MAP: Record<string, any> = {
  FileText,
  Image: ImageIcon,
  Video,
  Music,
  Mic,
  Camera,
  Lightbulb,
  PenTool,
  Layers,
  MapPin
}

interface BlockLibrarySidebarProps {
  onAddBlock: (blockType: string) => void
}

function ClickableTemplate({ 
  schema, 
  onAdd 
}: { 
  schema: BlockSchema
  onAdd: (blockType: string) => void 
}) {
  const IconComponent = ICON_MAP[schema.icon] || FileText

  return (
    <button
      onClick={() => onAdd(schema.name)}
      className="w-full p-3 rounded-lg border border-gray-200 cursor-pointer bg-white hover:bg-gray-50 hover:border-blue-300 transition-all hover:shadow-md"
    >
      <div className="flex items-center gap-3 mb-1">
        <IconComponent className={`h-5 w-5 ${schema.ui.iconColor}`} />
        <span className="font-semibold text-sm text-gray-900 text-left">{schema.label}</span>
      </div>
      <p className="text-xs text-gray-600 text-left">{schema.description}</p>
    </button>
  )
}

export default function BlockLibrarySidebar({ onAddBlock }: BlockLibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = BLOCK_SCHEMAS.filter(s =>
    !searchQuery || 
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const basicBlocks = filtered.filter(s => s.category === "basic")
  const immersiveBlocks = filtered.filter(s => s.category === "immersive")
  const structureBlocks = filtered.filter(s => s.category === "structure")

  return (
    <div className="w-full bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Content Blocks</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-300 text-gray-900 text-sm"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Category */}
        {basicBlocks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Basic
            </h3>
            {basicBlocks.map(schema => (
              <ClickableTemplate key={schema.id} schema={schema} onAdd={onAddBlock} />
            ))}
          </div>
        )}

        {/* Immersive Category */}
        {immersiveBlocks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Immersive
            </h3>
            {immersiveBlocks.map(schema => (
              <ClickableTemplate key={schema.id} schema={schema} onAdd={onAddBlock} />
            ))}
          </div>
        )}

        {/* Structure Category */}
        {structureBlocks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Structure
            </h3>
            {structureBlocks.map(schema => (
              <ClickableTemplate key={schema.id} schema={schema} onAdd={onAddBlock} />
            ))}
          </div>
        )}

        {/* No Results */}
        {filtered.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-8">
            No blocks found
          </p>
        )}
      </div>

      {/* Footer Tip */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600">
          💡 Click blocks to add them to your page
        </p>
      </div>
    </div>
  )
}
