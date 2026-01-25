"use client"

import { ReactNode, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Search } from "lucide-react"

import { GlobalSearch } from "@/components/crm/global-search"
import { Toaster } from "@/components/ui/toaster"
import { CRMErrorBoundary } from "@/components/crm/error-boundary"

import { Button } from "@/components/ui"
interface CRMLayoutProps {
  children: ReactNode
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <CRMErrorBoundary>
      <div className="flex flex-col h-full bg-background">
        {/* Top Bar with Search */}
        <header className="h-16 border-b flex items-center gap-4 px-6 bg-background">
          <div className="flex-1 max-w-2xl">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search people, companies, conversations...
              <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
        </header>

        {/* Global Search Dialog */}
        <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <Toaster />
      </div>
    </CRMErrorBoundary>
  )
}

