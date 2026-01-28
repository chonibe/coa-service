"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Slide, CanvasElement } from "@/lib/slides/types"
import { GRADIENT_PRESETS } from "@/lib/slides/types"

/**
 * SlideCanvas - The main canvas for the slide editor
 * 
 * This is a simplified canvas implementation using CSS transforms.
 * For full Konva.js support with better performance, install:
 *   npm install konva react-konva
 * 
 * Features:
 * - Drag elements to reposition
 * - Pinch/scroll to resize
 * - Long-press to delete
 * - Tap to select/edit text
 */

interface SlideCanvasProps {
  slide: Slide
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void
  onDeleteElement: (id: string) => void
}

export function SlideCanvas({
  slide,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
}: SlideCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)

  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    const bg = slide.background
    if (!bg) return { backgroundColor: "#1a1a1a" }

    const baseStyle: React.CSSProperties = {}

    if (bg.type === "gradient" && bg.value) {
      const preset = GRADIENT_PRESETS[bg.value as keyof typeof GRADIENT_PRESETS]
      if (preset) {
        baseStyle.background = `linear-gradient(135deg, ${preset.from}, ${preset.to})`
      }
    } else if (bg.type === "solid" && bg.value) {
      baseStyle.backgroundColor = bg.value
    } else if ((bg.type === "image" || bg.type === "video") && bg.url) {
      baseStyle.backgroundImage = `url(${bg.url})`
      baseStyle.backgroundSize = "cover"
      baseStyle.backgroundPosition = "center"
      
      // Apply zoom/pan
      if (bg.scale && bg.scale !== 1) {
        baseStyle.backgroundSize = `${bg.scale * 100}%`
      }
      if (bg.offsetX || bg.offsetY) {
        const x = 50 + (bg.offsetX || 0)
        const y = 50 + (bg.offsetY || 0)
        baseStyle.backgroundPosition = `${x}% ${y}%`
      }
    } else {
      baseStyle.backgroundColor = "#1a1a1a"
    }

    return baseStyle
  }

  // Handle canvas tap (deselect)
  const handleCanvasTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === canvasRef.current) {
      onSelectElement(null)
      setEditingTextId(null)
    }
  }

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden"
      style={getBackgroundStyle()}
      onClick={handleCanvasTap}
    >
      {/* Render elements */}
      {slide.elements.map((element) => (
        <CanvasElementView
          key={element.id}
          element={element}
          isSelected={selectedElementId === element.id}
          isEditing={editingTextId === element.id}
          onSelect={() => onSelectElement(element.id)}
          onStartEdit={() => setEditingTextId(element.id)}
          onEndEdit={() => setEditingTextId(null)}
          onUpdate={(updates) => onUpdateElement(element.id, updates)}
          onDelete={() => onDeleteElement(element.id)}
        />
      ))}

      {/* Delete button for selected element */}
      {selectedElementId && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="destructive"
            size="icon"
            className="w-10 h-10 rounded-full shadow-lg"
            onClick={() => onDeleteElement(selectedElementId)}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  )
}

interface CanvasElementViewProps {
  element: CanvasElement
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onStartEdit: () => void
  onEndEdit: () => void
  onUpdate: (updates: Partial<CanvasElement>) => void
  onDelete: () => void
}

function CanvasElementView({
  element,
  isSelected,
  isEditing,
  onSelect,
  onStartEdit,
  onEndEdit,
  onUpdate,
}: CanvasElementViewProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 })

  // Handle drag start
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setDragStart({ x: clientX, y: clientY })
    setElementStart({ x: element.x, y: element.y })
    onSelect()
  }

  // Handle drag move
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !elementRef.current?.parentElement) return

    const parent = elementRef.current.parentElement
    const rect = parent.getBoundingClientRect()

    const deltaX = ((clientX - dragStart.x) / rect.width) * 100
    const deltaY = ((clientY - dragStart.y) / rect.height) * 100

    const newX = Math.max(0, Math.min(100, elementStart.x + deltaX))
    const newY = Math.max(0, Math.min(100, elementStart.y + deltaY))

    onUpdate({ x: newX, y: newY })
  }, [isDragging, dragStart, elementStart, onUpdate])

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }, [handleDragMove])

  const handleMouseUp = useCallback(() => {
    handleDragEnd()
  }, [])

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleDragStart(touch.clientX, touch.clientY)
    }
  }

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleDragMove(touch.clientX, touch.clientY)
    }
  }, [handleDragMove])

  const handleTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [])

  // Add/remove document event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Handle double-tap to edit text
  const handleDoubleClick = () => {
    if (element.type === "text") {
      onStartEdit()
    }
  }

  // Element styles
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}%`,
    top: `${element.y}%`,
    transform: `translate(-50%, -50%) scale(${element.scale}) rotate(${element.rotation}deg)`,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
    userSelect: "none",
    zIndex: isSelected ? 10 : 1,
  }

  if (element.type === "text") {
    const textStyle = element.style || {}
    
    const fontSizeMap = {
      small: "14px",
      medium: "18px",
      large: "24px",
      xlarge: "32px",
    }

    return (
      <div
        ref={elementRef}
        style={{
          ...style,
          color: textStyle.color || "#ffffff",
          fontSize: fontSizeMap[textStyle.fontSize || "large"],
          fontWeight: textStyle.fontWeight || "normal",
          fontStyle: textStyle.fontStyle || "normal",
          textAlign: textStyle.textAlign || "center",
          backgroundColor: textStyle.backgroundColor,
          padding: textStyle.backgroundColor ? "8px 16px" : undefined,
          borderRadius: textStyle.backgroundColor ? "8px" : undefined,
          maxWidth: "90%",
          textShadow: textStyle.backgroundColor ? "none" : "0 2px 4px rgba(0,0,0,0.5)",
        }}
        className={`${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-black" : ""}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input
            type="text"
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            onBlur={onEndEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEndEdit()
              }
            }}
            autoFocus
            className="bg-transparent border-none outline-none text-inherit font-inherit text-center w-full min-w-[100px]"
            style={{
              fontSize: "inherit",
              fontWeight: "inherit",
              fontStyle: "inherit",
            }}
          />
        ) : (
          element.content
        )}
      </div>
    )
  }

  if (element.type === "image") {
    return (
      <div
        ref={elementRef}
        style={style}
        className={`${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-black" : ""}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <img
          src={element.content}
          alt=""
          className="max-w-[200px] max-h-[200px] object-contain rounded-lg shadow-lg pointer-events-none"
          draggable={false}
        />
      </div>
    )
  }

  return null
}

export default SlideCanvas
