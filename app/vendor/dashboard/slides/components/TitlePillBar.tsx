"use client"

import { useRef } from "react"
import { TITLE_SUGGESTIONS } from "@/lib/slides/types"

interface TitlePillBarProps {
  currentTitle: string
  onSelectTitle: (title: string) => void
}

/**
 * TitlePillBar - Swipeable horizontal bar of title suggestions
 * 
 * Tapping a pill fills the title field with that text.
 * The title is fully editable after selection.
 */
export function TitlePillBar({ currentTitle, onSelectTitle }: TitlePillBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-1 -mx-1 px-1"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Clear option */}
      <PillButton
        label="None"
        isSelected={!currentTitle}
        onClick={() => onSelectTitle("")}
      />
      
      {/* Suggestions */}
      {TITLE_SUGGESTIONS.map((suggestion) => (
        <PillButton
          key={suggestion.id}
          label={suggestion.label}
          isSelected={currentTitle === suggestion.label}
          onClick={() => onSelectTitle(suggestion.label)}
        />
      ))}
    </div>
  )
}

interface PillButtonProps {
  label: string
  isSelected: boolean
  onClick: () => void
}

function PillButton({ label, isSelected, onClick }: PillButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium
        transition-colors snap-start
        ${
          isSelected
            ? "bg-white text-black"
            : "bg-white/10 text-white/80 hover:bg-white/20"
        }
      `}
    >
      {label}
    </button>
  )
}

export default TitlePillBar
