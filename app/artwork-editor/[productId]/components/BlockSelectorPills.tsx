"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
 * horizontal scrollable pill interface using design system tokens.
 */
export function BlockSelectorPills({
  selectedBlockId,
  blocks,
  onSelectBlock,
  onAddBlock,
}: BlockSelectorPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll position
  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }, [])

  // Auto-scroll selected pill into view
  useEffect(() => {
    if (selectedBlockId && pillRefs.current.has(selectedBlockId)) {
      const pill = pillRefs.current.get(selectedBlockId)
      pill?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selectedBlockId])

  useEffect(() => {
    checkScroll()
    const scrollEl = scrollRef.current
    if (scrollEl) {
      scrollEl.addEventListener("scroll", checkScroll)
      return () => scrollEl.removeEventListener("scroll", checkScroll)
    }
  }, [blocks, checkScroll])

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
    <div className="relative w-full bg-white/95 backdrop-blur-sm border-t border-gray-200">
      {/* Left scroll indicator */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-white to-transparent flex items-center justify-start pl-2"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Pills container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 min-h-[68px]"
        style={{ 
          scrollbarWidth: "none",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center w-full text-center py-2">
            <p className="text-sm text-gray-600">No blocks yet</p>
          </div>
        ) : (
          blocks.map((block, index) => {
          const schema = getBlockSchema(block.block_type)
          if (!schema) return null

          const IconComponent = ICON_MAP[schema.icon] || FileText
          const isSelected = selectedBlockId === block.id

          return (
            <button
              key={block.id}
              ref={(el) => {
                if (el) pillRefs.current.set(block.id, el)
                else pillRefs.current.delete(block.id)
              }}
              onClick={() => onSelectBlock(block.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full",
                "transition-all duration-200 min-h-[44px]",
                "active:scale-95", // Tactile feedback on tap
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-foreground hover:bg-accent"
              )}
            >
              {/* Block number indicator */}
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                isSelected ? "bg-white/20" : "bg-gray-200"
              )}>
                {index + 1}
              </span>
              <IconComponent className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">
                {schema.label}
              </span>
            </button>
          )
        }))}

        {/* Add Block Button - Always visible */}
        <button
          onClick={onAddBlock}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full
                     bg-blue-600 text-white hover:bg-blue-700
                     transition-all duration-200 min-h-[44px] shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium whitespace-nowrap">
            {blocks.length === 0 ? "Add First Block" : "Add Block"}
          </span>
        </button>
      </div>

      {/* Right scroll indicator */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-white to-transparent flex items-center justify-end pr-2"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  )
}
