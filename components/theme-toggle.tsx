"use client"

import * as React from "react"
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icon } from "@/components/icon"

import { Button } from "@/components/ui"
export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10 flex items-center justify-center">
        <Icon size="sm">
          <SunIcon className="h-5 w-5" />
        </Icon>
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 flex items-center justify-center">
          {theme === "light" ? (
            <Icon size="sm">
              <SunIcon className="h-5 w-5" />
            </Icon>
          ) : (
            <Icon size="sm">
              <MoonIcon className="h-5 w-5" />
            </Icon>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2 cursor-pointer">
          <Icon size="sm">
            <SunIcon className="h-5 w-5" />
          </Icon>
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2 cursor-pointer">
          <Icon size="sm">
            <MoonIcon className="h-5 w-5" />
          </Icon>
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2 cursor-pointer">
          <Icon size="sm">
            <ComputerDesktopIcon className="h-5 w-5" />
          </Icon>
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

