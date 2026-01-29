"use client"

import { useState } from "react"
import { X, Image as ImageIcon, Video, Palette } from "lucide-react"
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { SlideBackground, GradientPreset } from "@/lib/slides/types"
import { GRADIENT_PRESETS, DEFAULT_BACKGROUND } from "@/lib/slides/types"

interface BackgroundPickerProps {
  isOpen: boolean
  onClose: () => void
  currentBackground: SlideBackground
  onSelect: (background: SlideBackground) => void
}

/**
 * BackgroundPicker - Bottom sheet for selecting slide background
 * 
 * Options:
 * - Gradient presets (dark, warm, cool, nature, sunset, midnight)
 * - Solid color picker
 * - Image from media library
 * - Video from media library
 */
export function BackgroundPicker({
  isOpen,
  onClose,
  currentBackground,
  onSelect,
}: BackgroundPickerProps) {
  const [activeTab, setActiveTab] = useState("gradient")

  const handleGradientSelect = (preset: GradientPreset) => {
    onSelect({
      ...DEFAULT_BACKGROUND,
      type: "gradient",
      value: preset,
    })
  }

  const handleSolidSelect = (color: string) => {
    onSelect({
      ...DEFAULT_BACKGROUND,
      type: "solid",
      value: color,
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[60vh] bg-zinc-900 border-zinc-800">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white">Background</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            <TabsTrigger value="gradient" className="data-[state=active]:bg-zinc-700">
              <Palette className="w-4 h-4 mr-2" />
              Gradient
            </TabsTrigger>
            <TabsTrigger value="solid" className="data-[state=active]:bg-zinc-700">
              <div className="w-4 h-4 mr-2 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
              Color
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-zinc-700">
              <ImageIcon className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
          </TabsList>

          {/* Gradient presets */}
          <TabsContent value="gradient" className="mt-4">
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(GRADIENT_PRESETS) as [GradientPreset, { from: string; to: string }][]).map(
                ([name, colors]) => (
                  <button
                    key={name}
                    onClick={() => handleGradientSelect(name)}
                    className={`
                      aspect-[4/3] rounded-lg overflow-hidden relative
                      ring-offset-zinc-900 transition-all
                      ${
                        currentBackground.type === "gradient" &&
                        currentBackground.value === name
                          ? "ring-2 ring-white ring-offset-2"
                          : "hover:ring-2 hover:ring-white/50 hover:ring-offset-2"
                      }
                    `}
                    style={{
                      background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                    }}
                  >
                    <span className="absolute bottom-1 left-1 text-[10px] text-white/70 capitalize">
                      {name}
                    </span>
                  </button>
                )
              )}
            </div>
          </TabsContent>

          {/* Solid colors */}
          <TabsContent value="solid" className="mt-4">
            <div className="grid grid-cols-6 gap-2">
              {[
                "#000000", "#1a1a1a", "#333333", "#666666", "#999999", "#ffffff",
                "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#2563eb",
                "#7c3aed", "#c026d3", "#db2777", "#f43f5e", "#78716c", "#44403c",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => handleSolidSelect(color)}
                  className={`
                    w-full aspect-square rounded-lg
                    ring-offset-zinc-900 transition-all
                    ${
                      currentBackground.type === "solid" &&
                      currentBackground.value === color
                        ? "ring-2 ring-white ring-offset-2"
                        : "hover:ring-2 hover:ring-white/50 hover:ring-offset-2"
                    }
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </TabsContent>

          {/* Media (image/video) */}
          <TabsContent value="media" className="mt-4">
            <div className="text-center py-8 text-white/60">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select from your media library</p>
              <Button
                variant="outline"
                className="mt-4 border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  // TODO: Open media library modal
                  console.log("Open media library for background")
                }}
              >
                Open Media Library
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

export default BackgroundPicker
