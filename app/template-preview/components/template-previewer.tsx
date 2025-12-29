"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

interface TemplatePreviewerProps {
  templateUrl: string
  artworkImage: string | null
}

export function TemplatePreviewer({ templateUrl, artworkImage }: TemplatePreviewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [artworkPosition, setArtworkPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showFullscreen, setShowFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const artworkRef = useRef<HTMLImageElement>(null)

  // Reset position when new image is uploaded
  useEffect(() => {
    if (artworkImage && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setArtworkPosition({ 
        x: rect.width / 2, 
        y: rect.height / 2 
      })
      setScale(1)
      setRotation(0)
    }
  }, [artworkImage])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!artworkImage || !containerRef.current) return
    e.preventDefault()
    setIsDragging(true)
    const rect = containerRef.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left - artworkPosition.x,
      y: e.clientY - rect.top - artworkPosition.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !artworkImage || !containerRef.current) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    setArtworkPosition({
      x: e.clientX - rect.left - dragStart.x,
      y: e.clientY - rect.top - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setArtworkPosition({ 
        x: rect.width / 2, 
        y: rect.height / 2 
      })
    }
    setScale(1)
    setRotation(0)
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      {artworkImage && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="w-32">
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[3rem]">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="h-4 w-4 mr-2" />
            Rotate
          </Button>

          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      )}

      {/* Preview Container */}
      <div
        ref={containerRef}
        className="relative border-2 border-muted rounded-lg overflow-hidden bg-gray-100"
        style={{ minHeight: "600px" }}
      >
        {/* PDF Viewer */}
        <div className="w-full h-full">
          <iframe
            src={`${templateUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-[600px] border-0"
            title="Template PDF"
          />
        </div>

        {/* Artwork Overlay */}
        {artworkImage && (
          <div
            className="absolute inset-0 pointer-events-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: isDragging ? "grabbing" : "default",
            }}
          >
            <div
              className="absolute pointer-events-auto"
              style={{
                left: `${artworkPosition.x}px`,
                top: `${artworkPosition.y}px`,
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                cursor: isDragging ? "grabbing" : "grab",
              }}
              onMouseDown={handleMouseDown}
            >
              <img
                ref={artworkRef}
                src={artworkImage}
                alt="Artwork overlay"
                className="max-w-md max-h-md object-contain shadow-2xl border-2 border-primary/50 rounded"
                draggable={false}
                style={{
                  opacity: 0.9,
                }}
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        {!artworkImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none">
            <div className="text-center p-8 bg-background/90 rounded-lg border border-muted">
              <p className="text-muted-foreground">
                Upload an artwork image to see how it looks on the template
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
          <div className="relative w-full h-full">
            <iframe
              src={`${templateUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              title="Template PDF Fullscreen"
            />
            {artworkImage && (
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute pointer-events-auto"
                  style={{
                    left: `${artworkPosition.x}px`,
                    top: `${artworkPosition.y}px`,
                    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  <img
                    src={artworkImage}
                    alt="Artwork overlay"
                    className="max-w-2xl max-h-2xl object-contain shadow-2xl border-2 border-primary/50 rounded"
                    draggable={false}
                    style={{
                      opacity: 0.9,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

