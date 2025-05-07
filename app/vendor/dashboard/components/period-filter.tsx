"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type PeriodOption = {
  value: string
  label: string
}

const defaultPeriods: PeriodOption[] = [
  { value: "all-time", label: "All Time" },
  { value: "this-year", label: "This Year" },
  { value: "last-year", label: "Last Year" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "last-6-months", label: "Last 6 Months" },
]

interface PeriodFilterProps {
  value: string
  onChange: (value: string) => void
  periods?: PeriodOption[]
  className?: string
}

export function PeriodFilter({ value, onChange, periods = defaultPeriods, className }: PeriodFilterProps) {
  const [open, setOpen] = useState(false)

  const selectedPeriod = periods.find((period) => period.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between", className)}
        >
          {selectedPeriod?.label || "Select period"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search period..." />
          <CommandList>
            <CommandEmpty>No period found.</CommandEmpty>
            <CommandGroup>
              {periods.map((period) => (
                <CommandItem
                  key={period.value}
                  value={period.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === period.value ? "opacity-100" : "opacity-0")} />
                  {period.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
