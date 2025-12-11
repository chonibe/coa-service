"use client"

import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

type CommandNavItem = {
  title: string
  href: string
  group?: string
}

interface AdminCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CommandNavItem[]
}

export function AdminCommandPalette({ open, onOpenChange, items }: AdminCommandPaletteProps) {
  const router = useRouter()
  const groups = items.reduce<Record<string, CommandNavItem[]>>((acc, item) => {
    const key = item.group || "Navigation"
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const handleSelect = (href: string) => {
    router.push(href)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to a page or vendor tool..." />
      <CommandList>
        <CommandEmpty>No matches found.</CommandEmpty>
        {Object.entries(groups).map(([groupName, groupItems], index) => (
          <div key={groupName}>
            <CommandGroup heading={groupName}>
              {groupItems.map((item) => (
                <CommandItem key={item.href} value={item.href} onSelect={() => handleSelect(item.href)}>
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {groupName}
                      <ChevronRight className="h-3 w-3" />
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {index < Object.keys(groups).length - 1 ? <CommandSeparator /> : null}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

