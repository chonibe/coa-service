"use client"

import { motion } from "framer-motion"
import { Layers } from "lucide-react"

// Import all block components for rendering children
import { TextBlock } from "./TextBlock"
import { ImageBlock } from "./ImageBlock"
import { VideoBlock } from "./VideoBlock"
import { AudioBlock } from "./AudioBlock"
import VoiceNoteSection from "./VoiceNoteSection"
import ProcessGallerySection from "./ProcessGallerySection"
import InspirationBoardSection from "./InspirationBoardSection"
import ArtistNoteSection from "./ArtistNoteSection"
import SoundtrackSection from "./SoundtrackSection"

interface ChildBlock {
  id: number
  block_type: string
  title: string
  description: string | null
  content_url: string | null
  block_config: any
  display_order_in_parent: number
}

interface SectionGroupBlockProps {
  title?: string
  description?: string
  config?: {
    style?: "default" | "highlighted" | "minimal"
  }
  childBlocks: ChildBlock[]
  artworkId?: string
  artistPhoto?: string
  artistName?: string
}

export function SectionGroupBlock({
  title,
  description,
  config,
  childBlocks,
  artworkId,
  artistPhoto,
  artistName,
}: SectionGroupBlockProps) {
  const style = config?.style || "default"
  
  // Sort children by display_order_in_parent
  const sortedChildren = [...childBlocks].sort(
    (a, b) => a.display_order_in_parent - b.display_order_in_parent
  )

  // Style variants
  const containerStyles = {
    default: "py-12 md:py-16",
    highlighted: "py-12 md:py-16 bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl px-6 md:px-10 my-8",
    minimal: "py-8 md:py-12",
  }

  const renderChildBlock = (block: ChildBlock, index: number) => {
    const blockType = block.block_type || ""
    const animationDelay = index * 0.1

    switch (blockType) {
      case "Artwork Text Block":
      case "text":
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.5 }}
          >
            <TextBlock title={block.title} description={block.description} />
          </motion.div>
        )

      case "Artwork Image Block":
      case "image":
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.5 }}
          >
            <ImageBlock
              title={block.title}
              contentUrl={block.content_url}
              blockConfig={block.block_config}
            />
          </motion.div>
        )

      case "Artwork Video Block":
      case "video":
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.5 }}
          >
            <VideoBlock
              title={block.title}
              contentUrl={block.content_url}
              artworkId={artworkId}
              blockConfig={block.block_config}
            />
          </motion.div>
        )

      case "Artwork Audio Block":
      case "audio":
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.5 }}
          >
            <AudioBlock
              title={block.title}
              contentUrl={block.content_url}
              artworkId={artworkId}
            />
          </motion.div>
        )

      case "Artwork Soundtrack Block":
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.5 }}
          >
            <SoundtrackSection
              title={block.title}
              config={block.block_config || {}}
            />
          </motion.div>
        )

      case "Artwork Voice Note Block":
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.5 }}
          >
            <VoiceNoteSection
              title={block.title}
              contentUrl={block.content_url || ""}
              config={{
                transcript: block.block_config?.transcript,
                artistPhoto: artistPhoto,
              }}
            />
          </motion.div>
        )

      case "Artwork Process Gallery Block":
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.5 }}
          >
            <ProcessGallerySection
              title={block.title}
              config={block.block_config || { images: [] }}
            />
          </motion.div>
        )

      case "Artwork Inspiration Block":
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.5 }}
          >
            <InspirationBoardSection
              title={block.title}
              config={block.block_config || { images: [] }}
            />
          </motion.div>
        )

      case "Artwork Artist Note Block":
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay, duration: 0.5 }}
          >
            <ArtistNoteSection
              content={block.description || ""}
              signatureUrl={block.block_config?.signature_url}
              artistName={artistName || ""}
            />
          </motion.div>
        )

      default:
        return null
    }
  }

  if (sortedChildren.length === 0 && !title) {
    return null
  }

  return (
    <section className={containerStyles[style]}>
      {/* Section Header */}
      {(title || description) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12"
        >
          {title && (
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-3">
              <Layers className="h-6 w-6 text-indigo-500" />
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </motion.div>
      )}

      {/* Child Blocks - rendered seamlessly */}
      <div className="space-y-4">
        {sortedChildren.map((block, index) => renderChildBlock(block, index))}
      </div>
    </section>
  )
}
