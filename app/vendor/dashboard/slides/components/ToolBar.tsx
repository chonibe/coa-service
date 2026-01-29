"use client"

import { Type, Image, Music, Palette, Sliders } from "lucide-react"
import { Button } from "@/components/ui"

interface ToolBarProps {
  hasAudio: boolean
  onAddText: () => void
  onAddImage: () => void
  onOpenAudio: () => void
  onOpenBackground: () => void
  onOpenTextStyle: () => void
}

/**
 * ToolBar - Bottom toolbar for the slide editor
 * 
 * Provides quick access to:
 * - Add text
 * - Add image (opens media library)
 * - Audio (Spotify, upload, record)
 * - Background (gradient, image, video)
 * - Text style (when text is selected)
 */
export function ToolBar({
  hasAudio,
  onAddText,
  onAddImage,
  onOpenAudio,
  onOpenBackground,
  onOpenTextStyle,
}: ToolBarProps) {
  return (
    <div className="flex items-center justify-around px-4 py-3 border-t border-white/10">
      <ToolbarButton
        icon={<Type className="w-5 h-5" />}
        label="Text"
        onClick={onAddText}
      />
      <ToolbarButton
        icon={<Image className="w-5 h-5" />}
        label="Photo"
        onClick={onAddImage}
      />
      <ToolbarButton
        icon={<Music className="w-5 h-5" />}
        label="Audio"
        onClick={onOpenAudio}
        hasIndicator={hasAudio}
      />
      <ToolbarButton
        icon={<Palette className="w-5 h-5" />}
        label="Background"
        onClick={onOpenBackground}
      />
      <ToolbarButton
        icon={<Sliders className="w-5 h-5" />}
        label="Style"
        onClick={onOpenTextStyle}
      />
    </div>
  )
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  hasIndicator?: boolean
}

function ToolbarButton({ icon, label, onClick, hasIndicator }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[56px] relative"
    >
      <span className="text-white">{icon}</span>
      <span className="text-[10px] text-white/70">{label}</span>
      {hasIndicator && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
      )}
    </button>
  )
}

export default ToolBar
