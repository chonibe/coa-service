"use client"

import { useState, useRef, useEffect } from "react"
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Mic, 
  Camera, 
  Lightbulb, 
  PenTool,
  Layers,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { BLOCK_SCHEMAS } from "@/lib/artwork-blocks/block-schemas"
import { cn } from "@/lib/utils"

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

interface BlockSelectorPillsProps {
  selectedBlockId?: number | null
  blocks: Array<{ id: number; block_type: string }>
  onSelectBlock: (blockId: number) => void
  onAddBlock: () => void
}

/**
 * BlockSelectorPills - Horizontal swipeable pill bar for block selection
 * 
 * Converts the desktop BlockLibrarySidebar into a mobile-friendly
 * horizontal scrollable pill interface.
 */
export function BlockSelectorPills({
  selectedBlockId,
  blocks,
  onSelectBlock,
  onAddBlock,
}: BlockSelectorPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll position
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const scrollEl = scrollRef.current
    if (scrollEl) {
      scrollEl.addEventListener("scroll", checkScroll)
      return () => scrollEl.removeEventListener("scroll", checkScroll)
    }
  }, [blocks])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const getBlockSchema = (blockType: string) => {
    return BLOCK_SCHEMAS.find(s => s.name === blockType)
  }

  return (
    <div className="relative w-full bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
      {/* Left scroll indicator */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-gray-900 to-transparent flex items-center justify-start pl-2"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Pills container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3"
        style={{ 
          scrollbarWidth: "none",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))"
        }}
      >
        {blocks.map((block) => {
          const schema = getBlockSchema(block.block_type)
          if (!schema) return null

          const IconComponent = ICON_MAP[schema.icon] || FileText
          const isSelected = selectedBlockId === block.id

          return (
            <button
              key={block.id}
              onClick={() => onSelectBlock(block.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full",
                "transition-all duration-200 min-h-[44px]",
                isSelected
                  ? "bg-white text-black"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              )}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">
                {schema.label}
              </span>
            </button>
          )
        })}

        {/* Add Block Button */}
        <button
          onClick={onAddBlock}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full
                     bg-gradient-to-r from-green-600 to-emerald-600 text-white
                     hover:from-green-700 hover:to-emerald-700
                     transition-all duration-200 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium whitespace-nowrap">
            Add Block
          </span>
        </button>
      </div>

      {/* Right scroll indicator */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-gray-900 to-transparent flex items-center justify-end pr-2"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  )
}
