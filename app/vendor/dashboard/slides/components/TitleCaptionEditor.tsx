"use client"

interface TitleCaptionEditorProps {
  title: string
  caption: string
  onTitleChange: (title: string) => void
  onCaptionChange: (caption: string) => void
}

/**
 * TitleCaptionEditor - Editable title and caption fields
 * 
 * The title (from pill suggestions or custom) appears larger above the caption.
 * Both are optional and fully editable.
 */
export function TitleCaptionEditor({
  title,
  caption,
  onTitleChange,
  onCaptionChange,
}: TitleCaptionEditorProps) {
  return (
    <div className="space-y-2">
      {/* Title field */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Add a title..."
        className="w-full bg-transparent border-none outline-none text-white font-semibold text-lg placeholder:text-white/40"
      />

      {/* Caption field */}
      <textarea
        value={caption}
        onChange={(e) => onCaptionChange(e.target.value)}
        placeholder="Write a caption..."
        rows={2}
        className="w-full bg-transparent border-none outline-none text-white/80 text-sm placeholder:text-white/40 resize-none"
      />
    </div>
  )
}

export default TitleCaptionEditor
