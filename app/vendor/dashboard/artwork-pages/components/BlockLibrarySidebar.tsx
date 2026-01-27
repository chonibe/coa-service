"use client"

import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Mic, 
  Camera, 
  Lightbulb, 
  PenTool,
  Search
} from "lucide-react"
import { Input } from "@/components/ui"

interface BlockTemplate {
  id: string
  type: string
  icon: any
  label: string
  description: string
  category: "basic" | "immersive"
  gradient?: string
}

const BLOCK_TEMPLATES: BlockTemplate[] = [
  // Basic
  {
    id: "text",
    type: "Artwork Text Block",
    icon: FileText,
    label: "Text",
    description: "Add paragraphs or descriptions",
    category: "basic"
  },
  {
    id: "image",
    type: "Artwork Image Block",
    icon: ImageIcon,
    label: "Image",
    description: "Add a single image",
    category: "basic"
  },
  {
    id: "video",
    type: "Artwork Video Block",
    icon: Video,
    label: "Video",
    description: "Embed or upload video",
    category: "basic"
  },
  {
    id: "audio",
    type: "Artwork Audio Block",
    icon: Music,
    label: "Audio",
    description: "Upload audio file",
    category: "basic"
  },
  // Immersive
  {
    id: "soundtrack",
    type: "Artwork Soundtrack Block",
    icon: Music,
    label: "Soundtrack",
    description: "Spotify track with note",
    category: "immersive",
    gradient: "from-green-900/30 to-emerald-800/30"
  },
  {
    id: "voice",
    type: "Artwork Voice Note Block",
    icon: Mic,
    label: "Voice Note",
    description: "Record audio message",
    category: "immersive",
    gradient: "from-purple-900/30 to-purple-800/30"
  },
  {
    id: "gallery",
    type: "Artwork Process Gallery Block",
    icon: Camera,
    label: "Process Gallery",
    description: "Behind-the-scenes photos",
    category: "immersive",
    gradient: "from-blue-900/30 to-blue-800/30"
  },
  {
    id: "inspiration",
    type: "Artwork Inspiration Block",
    icon: Lightbulb,
    label: "Inspiration",
    description: "Mood board images",
    category: "immersive",
    gradient: "from-yellow-900/30 to-yellow-800/30"
  },
  {
    id: "note",
    type: "Artwork Artist Note Block",
    icon: PenTool,
    label: "Artist Note",
    description: "Personal letter with signature",
    category: "immersive",
    gradient: "from-amber-900/30 to-amber-800/30"
  }
]

function DraggableTemplate({ template }: { template: BlockTemplate }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: template.id,
    data: { isTemplate: true, blockType: template.type }
  })

  const IconComponent = template.icon

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        p-3 rounded-lg border cursor-grab active:cursor-grabbing
        transition-all hover:scale-105 hover:shadow-lg
        ${template.gradient 
          ? `bg-gradient-to-br ${template.gradient} border-white/10` 
          : 'bg-gray-800 border-gray-700'
        }
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
    >
      <div className="flex items-center gap-3 mb-1">
        <IconComponent className={`h-5 w-5 ${template.gradient ? 'text-white' : 'text-gray-400'}`} />
        <span className="font-semibold text-sm text-white">{template.label}</span>
      </div>
      <p className="text-xs text-gray-400">{template.description}</p>
    </div>
  )
}

export default function BlockLibrarySidebar() {
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = BLOCK_TEMPLATES.filter(t =>
    !searchQuery || 
    t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const basicBlocks = filtered.filter(t => t.category === "basic")
  const immersiveBlocks = filtered.filter(t => t.category === "immersive")

  return (
    <div className="w-[280px] bg-gray-900 border-r border-gray-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white mb-3">Content Blocks</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700 text-white text-sm"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Category */}
        {basicBlocks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Basic
            </h3>
            {basicBlocks.map(template => (
              <DraggableTemplate key={template.id} template={template} />
            ))}
          </div>
        )}

        {/* Immersive Category */}
        {immersiveBlocks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Immersive
            </h3>
            {immersiveBlocks.map(template => (
              <DraggableTemplate key={template.id} template={template} />
            ))}
          </div>
        )}

        {/* No Results */}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No blocks found
          </p>
        )}
      </div>

      {/* Footer Tip */}
      <div className="p-4 border-t border-gray-800 bg-gray-950">
        <p className="text-xs text-gray-500">
          💡 Drag blocks to the canvas to add content
        </p>
      </div>
    </div>
  )
}
