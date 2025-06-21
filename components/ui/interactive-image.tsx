"use client"

import { useState } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { motion } from "framer-motion"
import { ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react"
import { Button } from "./button"

interface InteractiveImageProps {
  src: string
  alt: string
  className?: string
}

export function InteractiveImage({ src, alt, className = "" }: InteractiveImageProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        onZoomChange={(ref) => {
          setIsZoomed(ref.state.scale !== 1)
        }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full"
              >
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-full object-contain rounded-lg"
                />
              </TransformComponent>

              {/* Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-black/50 border-zinc-700 hover:bg-black/70"
                  onClick={() => zoomIn()}
                >
                  <ZoomIn className="h-4 w-4 text-white" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-black/50 border-zinc-700 hover:bg-black/70"
                  onClick={() => zoomOut()}
                >
                  <ZoomOut className="h-4 w-4 text-white" />
                </Button>
                {isZoomed && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-black/50 border-zinc-700 hover:bg-black/70"
                    onClick={() => resetTransform()}
                  >
                    <MoveHorizontal className="h-4 w-4 text-white" />
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </TransformWrapper>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-2 text-xs text-white"
      >
        Pinch or use buttons to zoom
      </motion.div>
    </div>
  )
} 