"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Settings2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Column {
  key: string
  label: string
  visible: boolean
}

interface ColumnCustomizerProps {
  columns: Column[]
  onColumnsChange: (columns: Column[]) => void
  entityType: "person" | "company"
}

const DEFAULT_PERSON_COLUMNS: Column[] = [
  { key: "name", label: "Name", visible: true },
  { key: "email", label: "Email", visible: true },
  { key: "phone", label: "Phone", visible: true },
  { key: "company", label: "Company", visible: true },
  { key: "tags", label: "Tags", visible: true },
  { key: "total_orders", label: "Orders", visible: true },
  { key: "total_spent", label: "Total Spent", visible: true },
  { key: "last_order_date", label: "Last Order", visible: false },
  { key: "created_at", label: "Created", visible: false },
]

const DEFAULT_COMPANY_COLUMNS: Column[] = [
  { key: "name", label: "Name", visible: true },
  { key: "domain", label: "Domain", visible: true },
  { key: "industry", label: "Industry", visible: true },
  { key: "total_people", label: "People", visible: true },
  { key: "total_orders", label: "Orders", visible: true },
  { key: "total_spent", label: "Total Spent", visible: true },
  { key: "last_order_date", label: "Last Order", visible: false },
  { key: "created_at", label: "Created", visible: false },
]

export function ColumnCustomizer({
  columns,
  onColumnsChange,
  entityType,
}: ColumnCustomizerProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [localColumns, setLocalColumns] = useState<Column[]>(columns)

  const defaultColumns =
    entityType === "person" ? DEFAULT_PERSON_COLUMNS : DEFAULT_COMPANY_COLUMNS

  const handleSave = () => {
    onColumnsChange(localColumns)
    setOpen(false)
    toast({
      title: "Columns updated",
      description: "Your column preferences have been saved.",
    })
  }

  const handleReset = () => {
    setLocalColumns(defaultColumns)
  }

  const toggleColumn = (key: string) => {
    setLocalColumns(
      localColumns.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Columns</DialogTitle>
          <DialogDescription>
            Choose which columns to display in the list view
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3 max-h-[400px] overflow-y-auto">
          {localColumns.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={column.key}
                checked={column.visible}
                onCheckedChange={() => toggleColumn(column.key)}
              />
              <Label
                htmlFor={column.key}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {column.label}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

