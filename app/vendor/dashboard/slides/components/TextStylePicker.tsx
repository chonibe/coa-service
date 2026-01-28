"use client"

import { AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { CanvasElement, FontSize, TextAlign } from "@/lib/slides/types"

interface TextStylePickerProps {
  isOpen: boolean
  onClose: () => void
  element: CanvasElement | undefined
  onUpdate: (updates: Partial<CanvasElement>) => void
}

/**
 * TextStylePicker - Bottom sheet for styling text elements
 * 
 * Options:
 * - Font size (small, medium, large, xlarge)
 * - Bold/Italic toggles
 * - Text alignment (left, center, right)
 * - Text color
 * - Background bubble color (optional)
 */
export function TextStylePicker({
  isOpen,
  onClose,
  element,
  onUpdate,
}: TextStylePickerProps) {
  if (!element || element.type !== "text") {
    return null
  }

  const style = element.style || {
    fontSize: "large" as FontSize,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#ffffff",
    textAlign: "center" as TextAlign,
  }

  const updateStyle = (updates: Partial<typeof style>) => {
    onUpdate({
      style: { ...style, ...updates },
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh] bg-zinc-900 border-zinc-800">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white">Text Style</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Font size */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Size</label>
            <div className="flex gap-2">
              {(["small", "medium", "large", "xlarge"] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => updateStyle({ fontSize: size })}
                  className={`
                    flex-1 py-2 rounded-lg text-white capitalize
                    ${style.fontSize === size ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}
                  `}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Bold/Italic */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Style</label>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  updateStyle({
                    fontWeight: style.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`
                  p-3 rounded-lg
                  ${style.fontWeight === "bold" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}
                `}
              >
                <Bold className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() =>
                  updateStyle({
                    fontStyle: style.fontStyle === "italic" ? "normal" : "italic",
                  })
                }
                className={`
                  p-3 rounded-lg
                  ${style.fontStyle === "italic" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}
                `}
              >
                <Italic className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Alignment</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateStyle({ textAlign: "left" })}
                className={`
                  flex-1 p-3 rounded-lg flex justify-center
                  ${style.textAlign === "left" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}
                `}
              >
                <AlignLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => updateStyle({ textAlign: "center" })}
                className={`
                  flex-1 p-3 rounded-lg flex justify-center
                  ${style.textAlign === "center" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}
                `}
              >
                <AlignCenter className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => updateStyle({ textAlign: "right" })}
                className={`
                  flex-1 p-3 rounded-lg flex justify-center
                  ${style.textAlign === "right" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}
                `}
              >
                <AlignRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Text color */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Text Color</label>
            <div className="flex gap-2">
              {["#ffffff", "#000000", "#fbbf24", "#34d399", "#60a5fa", "#f472b6"].map(
                (color) => (
                  <button
                    key={color}
                    onClick={() => updateStyle({ color })}
                    className={`
                      w-10 h-10 rounded-full ring-offset-zinc-900
                      ${
                        style.color === color
                          ? "ring-2 ring-white ring-offset-2"
                          : "hover:ring-2 hover:ring-white/50 hover:ring-offset-2"
                      }
                    `}
                    style={{ backgroundColor: color }}
                  />
                )
              )}
            </div>
          </div>

          {/* Background bubble */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">Background Bubble</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateStyle({ backgroundColor: undefined })}
                className={`
                  w-10 h-10 rounded-full border-2 border-dashed border-white/30
                  flex items-center justify-center text-white/60 text-xs
                  ${!style.backgroundColor ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""}
                `}
              >
                ✕
              </button>
              {["rgba(0,0,0,0.6)", "rgba(255,255,255,0.9)", "rgba(0,0,0,0.8)"].map(
                (color) => (
                  <button
                    key={color}
                    onClick={() => updateStyle({ backgroundColor: color })}
                    className={`
                      w-10 h-10 rounded-full ring-offset-zinc-900
                      ${
                        style.backgroundColor === color
                          ? "ring-2 ring-white ring-offset-2"
                          : "hover:ring-2 hover:ring-white/50 hover:ring-offset-2"
                      }
                    `}
                    style={{ backgroundColor: color }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default TextStylePicker
