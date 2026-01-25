"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SmartCondition {
  field: 'tag' | 'title' | 'type' | 'price' | 'created_at'
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'before' | 'after'
  value: string | number
}

interface SmartConditionsBuilderProps {
  conditions: SmartCondition[]
  onChange: (conditions: SmartCondition[]) => void
  match: 'all' | 'any'
  onMatchChange: (match: 'all' | 'any') => void
}

const FIELD_OPTIONS = [
  { value: 'tag', label: 'Tag' },
  { value: 'title', label: 'Title' },
  { value: 'type', label: 'Type' },
  { value: 'price', label: 'Price' },
  { value: 'created_at', label: 'Created' },
]

const getOperatorsForField = (field: SmartCondition['field']) => {
  switch (field) {
    case 'tag':
    case 'title':
      return [
        { value: 'equals', label: 'is equal to' },
        { value: 'contains', label: 'contains' },
        { value: 'starts_with', label: 'starts with' },
      ]
    case 'type':
      return [{ value: 'equals', label: 'is' }]
    case 'price':
      return [
        { value: 'greater_than', label: 'greater than' },
        { value: 'less_than', label: 'less than' },
      ]
    case 'created_at':
      return [
        { value: 'before', label: 'before' },
        { value: 'after', label: 'after' },
      ]
    default:
      return []
  }
}

export function SmartConditionsBuilder({
  conditions,
  onChange,
  match,
  onMatchChange,
}: SmartConditionsBuilderProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch available tags from artworks
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/vendor/products/submissions", {
          credentials: "include",
        })
        
        if (response.ok) {
          const data = await response.json()
          const submissions = data.submissions || []
          
          // Extract unique tags
          const tagsSet = new Set<string>()
          submissions.forEach((sub: any) => {
            const tags = sub.product_data?.tags || []
            tags.forEach((tag: string) => tagsSet.add(tag))
          })
          
          setAvailableTags(Array.from(tagsSet).sort())
        }
      } catch (error) {
        console.error("Error fetching tags:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  const handleAddCondition = () => {
    const newCondition: SmartCondition = {
      field: 'tag',
      operator: 'equals',
      value: '',
    }
    onChange([...conditions, newCondition])
  }

  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index))
  }

  const handleUpdateCondition = (index: number, updates: Partial<SmartCondition>) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], ...updates }
    
    // Reset operator if field changes and current operator is invalid
    if (updates.field) {
      const validOperators = getOperatorsForField(updates.field)
      if (!validOperators.find(op => op.value === newConditions[index].operator)) {
        newConditions[index].operator = validOperators[0]?.value as any
      }
    }
    
    onChange(newConditions)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Conditions</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Artworks must match these conditions to be added automatically
        </p>
      </div>

      {conditions.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No conditions set. Add conditions to automatically include artworks.
          </p>
          <Button onClick={handleAddCondition} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add condition
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-2">
                <Select
                  value={condition.field}
                  onValueChange={(value) =>
                    handleUpdateCondition(index, { field: value as SmartCondition['field'] })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={condition.operator}
                  onValueChange={(value) =>
                    handleUpdateCondition(index, { operator: value as SmartCondition['operator'] })
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getOperatorsForField(condition.field).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {condition.field === 'tag' && availableTags.length > 0 ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "flex-1 justify-between",
                          !condition.value && "text-muted-foreground"
                        )}
                      >
                        {condition.value || "Select tag..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search tags..." />
                        <CommandEmpty>No tag found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {availableTags.map((tag) => (
                            <CommandItem
                              key={tag}
                              value={tag}
                              onSelect={() => {
                                handleUpdateCondition(index, { value: tag })
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  condition.value === tag ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {tag}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input
                    value={condition.value}
                    onChange={(e) =>
                      handleUpdateCondition(index, {
                        value:
                          condition.field === 'price'
                            ? parseFloat(e.target.value) || 0
                            : e.target.value,
                      })
                    }
                    placeholder={
                      condition.field === 'price'
                        ? '0.00'
                        : condition.field === 'created_at'
                        ? 'YYYY-MM-DD'
                        : 'Value...'
                    }
                    type={condition.field === 'price' ? 'number' : 'text'}
                    className="flex-1"
                  />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCondition(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          <Button onClick={handleAddCondition} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add another condition
          </Button>
        </div>
      )}

      {conditions.length > 1 && (
        <div className="space-y-2">
          <Label>Match</Label>
          <RadioGroup value={match} onValueChange={(v) => onMatchChange(v as 'all' | 'any')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="match-all" />
              <Label htmlFor="match-all" className="font-normal cursor-pointer">
                All conditions (AND)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="match-any" />
              <Label htmlFor="match-any" className="font-normal cursor-pointer">
                Any condition (OR)
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  )
}
