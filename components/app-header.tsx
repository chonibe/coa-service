"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Award, ShoppingCart, Truck } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

export function AppHeader() {
  const [open, setOpen] = useState(false)
  const isMobile = useMobile()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] pr-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center border-b h-16 px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Award className="h-6 w-6" />
                <span>Vendor Portal</span>
              </Link>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="flex-1">
              <div className="px-2 py-4">
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Award className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                  <Link
                    href="/my-collection"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>My Collection</span>
                  </Link>
                  <Link
                    href="/vendor/login"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Vendor Login</span>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Award className="h-6 w-6" />
        <span className="hidden md:inline-block">Vendor Portal</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/admin"
          className="hidden md:flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Award className="h-4 w-4" />
          <span>Admin</span>
        </Link>
        <Link
          href="/my-collection"
          className="hidden md:flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>My Collection</span>
        </Link>
        <Link
          href="/vendor/login"
          className="hidden md:flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Truck className="h-4 w-4" />
          <span>Vendor Login</span>
        </Link>
      </div>
    </header>
  )
}
