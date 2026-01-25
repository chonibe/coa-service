"use client"

import { ArrowUpDown, Clock, Star, Mail, User } from "lucide-react"


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
export type SortOption =
  | "recent"
  | "oldest"
  | "unread"
  | "starred"
  | "customer_name"
  | "last_message"

export interface SortDropdownProps {
  value: SortOption
  onValueChange: (value: SortOption) => void
  className?: string
}

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  {
    value: "recent",
    label: "Most Recent",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: "oldest",
    label: "Oldest First",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: "unread",
    label: "Unread First",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    value: "starred",
    label: "Starred First",
    icon: <Star className="h-4 w-4" />,
  },
  {
    value: "customer_name",
    label: "Customer Name",
    icon: <User className="h-4 w-4" />,
  },
  {
    value: "last_message",
    label: "Last Message",
    icon: <Mail className="h-4 w-4" />,
  },
]

export function SortDropdown({ value, onValueChange, className = "" }: SortDropdownProps) {
  const selectedOption = sortOptions.find((opt) => opt.value === value)

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`w-[160px] h-9 ${className}`}>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <SelectValue>
            {selectedOption ? (
              <div className="flex items-center gap-2">
                {selectedOption.icon}
                <span>{selectedOption.label}</span>
              </div>
            ) : (
              "Sort by"
            )}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

