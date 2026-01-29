"use client"

import { useState } from "react"
import { Layers, Plus, GripVertical, X, ChevronDown, ChevronRight } from "lucide-react"
import { Button, Input, Textarea } from "@/components/ui"

interface ChildBlock {
  id: number
  block_type: string
  title: string
  display_order_in_parent: number
}

interface SectionGroupEditorProps {
  blockId: number
  config: {
    title?: string
    description?: string
    style?: "default" | "highlighted" | "minimal"
  }
  childBlocks: ChildBlock[]
  onChange: (config: any) => void
  onAddChildBlock: (blockType: string) => void
  onRemoveChildBlock: (childBlockId: number) => void
  onReorderChild: (childBlockId: number, direction: "up" | "down") => void
  onSelectChildBlock: (childBlockId: number) => void
}

const AVAILABLE_CHILD_BLOCKS = [
  { type: "Artwork Text Block", label: "Text", icon: "📝" },
  { type: "Artwork Image Block", label: "Image", icon: "🖼️" },
  { type: "Artwork Video Block", label: "Video", icon: "🎬" },
  { type: "Artwork Audio Block", label: "Audio", icon: "🎵" },
  { type: "Artwork Voice Note Block", label: "Voice Note", icon: "🎤" },
]

export default function SectionGroupEditor({
  blockId,
  config,
  childBlocks,
  onChange,
  onAddChildBlock,
  onRemoveChildBlock,
  onReorderChild,
  onSelectChildBlock,
}: SectionGroupEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [title, setTitle] = useState(config.title || "")
  const [description, setDescription] = useState(config.description || "")

  const handleTitleChange = (value: string) => {
    setTitle(value)
    onChange({ ...config, title: value })
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    onChange({ ...config, description: value })
  }

  const handleStyleChange = (style: "default" | "highlighted" | "minimal") => {
    onChange({ ...config, style })
  }

  const sortedChildBlocks = [...childBlocks].sort(
    (a, b) => a.display_order_in_parent - b.display_order_in_parent
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Layers className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">Section Group</h3>
          <p className="text-sm text-gray-400">
            A container for organizing related content blocks together
          </p>
        </div>
      </div>

      {/* Section Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Section Title</label>
        <Input
          placeholder="e.g., Behind the Scenes, The Creative Process..."
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      {/* Section Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Section Description <span className="text-gray-500">(optional)</span>
        </label>
        <Textarea
          placeholder="Brief intro to this section..."
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          rows={2}
          className="bg-gray-700 border-gray-600 text-white resize-none"
        />
      </div>

      {/* Section Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Section Style</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "default", label: "Default", desc: "Standard appearance" },
            { value: "highlighted", label: "Highlighted", desc: "Subtle background" },
            { value: "minimal", label: "Minimal", desc: "No decoration" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStyleChange(opt.value as any)}
              className={`p-3 rounded-lg text-left transition-all ${
                (config.style || "default") === opt.value
                  ? "bg-indigo-600/30 border-2 border-indigo-500"
                  : "bg-gray-700 border-2 border-gray-600 hover:border-gray-500"
              }`}
            >
              <p className="text-sm font-medium text-white">{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Child Blocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">
            Blocks in this Section ({childBlocks.length})
          </label>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-2 pl-2 border-l-2 border-indigo-500/30">
            {sortedChildBlocks.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No blocks in this section yet. Add some below!
              </div>
            ) : (
              sortedChildBlocks.map((child, index) => (
                <div
                  key={child.id}
                  className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-3 group"
                >
                  <GripVertical className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500 w-5">{index + 1}</span>
                  <button
                    onClick={() => onSelectChildBlock(child.id)}
                    className="flex-1 text-left text-sm text-white hover:text-indigo-400 transition-colors truncate"
                  >
                    {child.title || child.block_type.replace("Artwork ", "").replace(" Block", "")}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                      <button
                        onClick={() => onReorderChild(child.id, "up")}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {index < sortedChildBlocks.length - 1 && (
                      <button
                        onClick={() => onReorderChild(child.id, "down")}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveChildBlock(child.id)}
                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                      title="Remove from section"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Add Block to Section */}
            <div className="relative">
              <Button
                onClick={() => setShowAddMenu(!showAddMenu)}
                variant="outline"
                size="sm"
                className="w-full bg-gray-800 border-dashed border-gray-600 hover:border-indigo-500 text-gray-400 hover:text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Block to Section
              </Button>

              {showAddMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10 overflow-hidden">
                  {AVAILABLE_CHILD_BLOCKS.map((block) => (
                    <button
                      key={block.type}
                      onClick={() => {
                        onAddChildBlock(block.type)
                        setShowAddMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-3 transition-colors"
                    >
                      <span>{block.icon}</span>
                      <span>{block.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
        <p className="text-sm text-indigo-300">
          💡 <strong>Tip:</strong> Use sections to group related content together.
          For example, create a "Making Of" section with process images and a voice note.
        </p>
      </div>
    </div>
  )
}
