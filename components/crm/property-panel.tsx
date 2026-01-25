"use client"







import { Save, X } from "lucide-react"
import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Button, Badge } from "@/components/ui"
interface Property {
  label: string
  value: string | null
  type: "text" | "email" | "phone" | "textarea" | "date" | "number"
  editable?: boolean
}

interface PropertyPanelProps {
  title: string
  properties: Property[]
  onSave?: (updates: Record<string, string>) => void
  isLoading?: boolean
}

export function PropertyPanel({ title, properties, onSave, isLoading }: PropertyPanelProps) {
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleEdit = (label: string, value: string | null) => {
    setEditing(label)
    setEditValue(value || "")
  }

  const handleSave = () => {
    if (onSave && editing) {
      onSave({ [editing]: editValue })
    }
    setEditing(null)
    setEditValue("")
  }

  const handleCancel = () => {
    setEditing(null)
    setEditValue("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {properties.map((prop) => (
          <div key={prop.label} className="space-y-2">
            <Label htmlFor={prop.label}>{prop.label}</Label>
            {editing === prop.label ? (
              <div className="flex gap-2">
                {prop.type === "textarea" ? (
                  <Textarea
                    id={prop.label}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <Input
                    id={prop.label}
                    type={prop.type === "date" ? "date" : prop.type === "number" ? "number" : "text"}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1"
                  />
                )}
                <Button size="icon" onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <div className="flex-1">
                  {prop.value ? (
                    <p className="text-sm">{prop.value}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not set</p>
                  )}
                </div>
                {prop.editable && onSave && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(prop.label, prop.value)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

