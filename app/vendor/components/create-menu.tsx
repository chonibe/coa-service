"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus as PlusIcon, Package, Lock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export function CreateMenu() {
  const router = useRouter()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleCreateArtwork = () => {
    setIsOpen(false)
    router.push("/vendor/dashboard/products/create")
  }

  const handleCreateSeries = () => {
    setIsOpen(false)
    router.push("/vendor/dashboard/series/create")
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="default"
        size="icon"
        className="flex items-center justify-center transition-all hover:bg-primary/90 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Create new"
        aria-expanded={isOpen}
      >
        <PlusIcon className="h-6 w-6" />
        <span className="sr-only">Create new</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            {isMobile ? (
              // Mobile: Fixed bottom sheet
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-x bg-background shadow-2xl"
              >
                <div className="p-4 pb-safe">
                  <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <button
                      onClick={handleCreateArtwork}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-base">Create Artwork</div>
                        <div className="text-sm text-muted-foreground">Add a new artwork to your catalog</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={handleCreateSeries}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Lock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-base">Create Series</div>
                        <div className="text-sm text-muted-foreground">Start a new unlockable series</div>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Desktop: Dropdown menu
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-2 z-50 w-56 rounded-lg border bg-background shadow-lg"
              >
                <div className="p-1">
                  <button
                    onClick={handleCreateArtwork}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Create Artwork</div>
                      <div className="text-xs text-muted-foreground">Add a new artwork to your catalog</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleCreateSeries}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Lock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Create Series</div>
                      <div className="text-xs text-muted-foreground">Start a new unlockable series</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

