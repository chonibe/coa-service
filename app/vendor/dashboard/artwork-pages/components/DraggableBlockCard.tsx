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
  PenTool,
  Layers
} from "lucide-react"
import { Button, Badge } from "@/components/ui"
import { getBlockSchema } from "@/lib/artwork-blocks/block-schemas"

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
  Layers
}

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
  isReorderMode?: boolean
  onToggle: () => void
  onDelete: () => void
  children: React.ReactNode
}

// Helper to get block UI config from schema
function getBlockUIConfig(blockType: string) {
  const schema = getBlockSchema(blockType)
  if (schema) {
    return {
      icon: ICON_MAP[schema.icon] || FileText,
      label: schema.label,
      iconColor: schema.ui.iconColor,
      headerGradient: schema.ui.headerGradient
    }
  }
  // Fallback for unknown block types
  return {
    icon: FileText,
    label: "Content Block",
    iconColor: "text-gray-400",
    headerGradient: "bg-gray-800"
  }
}

export default function DraggableBlockCard({
  block,
  index,
  isExpanded,
  isReorderMode = false,
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
  } = useSortable({ id: block.id, disabled: !isReorderMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const blockTypeConfig = getBlockUIConfig(block.block_type || "")
  const IconComponent = blockTypeConfig.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`block-${block.id}`}
      className={`bg-gray-800 rounded-lg border overflow-hidden shadow-lg transition-all ${
        isReorderMode 
          ? 'border-blue-500 hover:shadow-2xl cursor-move' 
          : 'border-gray-700 hover:shadow-xl'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${blockTypeConfig.headerGradient} border-b border-gray-700`}>
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle - only active in reorder mode */}
          <div
            {...(isReorderMode ? attributes : {})}
            {...(isReorderMode ? listeners : {})}
            className={`p-1 rounded transition-colors ${
              isReorderMode 
                ? 'cursor-grab active:cursor-grabbing hover:bg-blue-700/50 bg-blue-900/30' 
                : 'cursor-default opacity-30'
            }`}
          >
            <GripVertical className={`h-5 w-5 ${isReorderMode ? 'text-blue-400' : 'text-gray-500'}`} />
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
          {/* Reorder Mode Indicator */}
          {isReorderMode && (
            <Badge className="bg-blue-600 text-white text-xs">
              Position {index + 1}
            </Badge>
          )}

          {/* Published Badge */}
          {!isReorderMode && block.is_published && (
            <Badge className="bg-green-600 text-white text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Published
            </Badge>
          )}

          {/* Collapse Toggle - hidden in reorder mode */}
          {!isReorderMode && (
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
          )}

          {/* Delete - hidden in reorder mode */}
          {!isReorderMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
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
