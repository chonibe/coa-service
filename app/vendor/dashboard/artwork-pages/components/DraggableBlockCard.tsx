"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  GripVertical, 
  X, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Mic, 
  Camera, 
  Lightbulb, 
  PenTool
} from "lucide-react"
import { Button, Badge } from "@/components/ui"

interface ContentBlock {
  id: number
  title: string
  block_type?: string
  is_published: boolean
}

interface DraggableBlockCardProps {
  block: ContentBlock
  index: number
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
  children: React.ReactNode
}

const BLOCK_TYPE_CONFIG: Record<string, { icon: any; label: string; iconColor: string; headerGradient: string }> = {
  "Artwork Text Block": {
    icon: FileText,
    label: "Text",
    iconColor: "text-gray-400",
    headerGradient: "bg-gray-800"
  },
  "Artwork Image Block": {
    icon: ImageIcon,
    label: "Image",
    iconColor: "text-blue-400",
    headerGradient: "bg-gray-800"
  },
  "Artwork Video Block": {
    icon: Video,
    label: "Video",
    iconColor: "text-purple-400",
    headerGradient: "bg-gray-800"
  },
  "Artwork Audio Block": {
    icon: Music,
    label: "Audio",
    iconColor: "text-teal-400",
    headerGradient: "bg-gray-800"
  },
  "Artwork Soundtrack Block": {
    icon: Music,
    label: "Soundtrack",
    iconColor: "text-green-400",
    headerGradient: "bg-gradient-to-r from-green-900/30 to-gray-800"
  },
  "Artwork Voice Note Block": {
    icon: Mic,
    label: "Voice Note",
    iconColor: "text-purple-400",
    headerGradient: "bg-gradient-to-r from-purple-900/30 to-gray-800"
  },
  "Artwork Process Gallery Block": {
    icon: Camera,
    label: "Process Gallery",
    iconColor: "text-blue-400",
    headerGradient: "bg-gradient-to-r from-blue-900/30 to-gray-800"
  },
  "Artwork Inspiration Block": {
    icon: Lightbulb,
    label: "Inspiration",
    iconColor: "text-yellow-400",
    headerGradient: "bg-gradient-to-r from-yellow-900/30 to-gray-800"
  },
  "Artwork Artist Note Block": {
    icon: PenTool,
    label: "Artist Note",
    iconColor: "text-amber-400",
    headerGradient: "bg-gradient-to-r from-amber-900/30 to-gray-800"
  }
}

export default function DraggableBlockCard({
  block,
  index,
  isExpanded,
  onToggle,
  onDelete,
  children
}: DraggableBlockCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const blockTypeConfig = BLOCK_TYPE_CONFIG[block.block_type || ""] || {
    icon: FileText,
    label: "Content Block",
    iconColor: "text-gray-400",
    headerGradient: "bg-gray-800"
  }

  const IconComponent = blockTypeConfig.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`block-${block.id}`}
      className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg transition-shadow hover:shadow-xl"
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${blockTypeConfig.headerGradient} border-b border-gray-700`}>
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:bg-gray-700/50 p-1 rounded transition-colors"
          >
            <GripVertical className="h-5 w-5 text-gray-500" />
          </div>

          {/* Block Type Icon */}
          <IconComponent className={`h-5 w-5 ${blockTypeConfig.iconColor}`} />

          {/* Title */}
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">
              {block.title || blockTypeConfig.label}
            </h3>
            <span className="text-xs text-gray-400">{blockTypeConfig.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Published Badge */}
          {block.is_published && (
            <Badge className="bg-green-600 text-white text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Published
            </Badge>
          )}

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content (collapsible) */}
      {isExpanded && (
        <div className="p-6 bg-gray-850">
          {children}
        </div>
      )}
    </div>
  )
}
