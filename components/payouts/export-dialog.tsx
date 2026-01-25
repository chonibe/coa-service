"use client"

import { useState } from "react"






import { Download, Loader2, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Checkbox, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from "@/components/ui"
interface ExportDialogProps {
  dataType: "payouts" | "history" | "analytics"
  isAdmin?: boolean
  vendorName?: string
  filterCriteria?: any
}

const exportFormats = [
  { value: "csv", label: "CSV", description: "Comma-separated values" },
  { value: "excel", label: "Excel", description: "Microsoft Excel (.xlsx)" },
  { value: "pdf", label: "PDF", description: "Portable Document Format" },
]

const defaultColumns = [
  { id: "date", label: "Date", default: true },
  { id: "vendor", label: "Vendor", default: true },
  { id: "amount", label: "Amount", default: true },
  { id: "status", label: "Status", default: true },
  { id: "paymentMethod", label: "Payment Method", default: true },
  { id: "reference", label: "Reference", default: false },
  { id: "invoiceNumber", label: "Invoice Number", default: false },
  { id: "productCount", label: "Product Count", default: false },
  { id: "taxAmount", label: "Tax Amount", default: false },
  { id: "processedBy", label: "Processed By", default: false },
]

export function ExportDialog({ dataType, isAdmin = false, vendorName, filterCriteria }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [format, setFormat] = useState("csv")
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    defaultColumns.filter((c) => c.default).map((c) => c.id)
  )
  const [reportType, setReportType] = useState("summary")
  const [email, setEmail] = useState("")
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly")
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    )
  }

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one column to export",
      })
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch("/api/payouts/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataType,
          format,
          columns: selectedColumns,
          reportType,
          isAdmin,
          vendorName,
          filterCriteria,
          email: email || undefined,
          schedule: scheduleEnabled
            ? {
                enabled: true,
                frequency: scheduleFrequency,
              }
            : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Export failed")
      }

      if (format === "pdf" || email) {
        toast({
          title: "Export Started",
          description: email
            ? `Report will be sent to ${email}`
            : scheduleEnabled
              ? `Scheduled report will be sent ${scheduleFrequency}`
              : "Your report is being generated and will be available shortly",
        })
      } else {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `payouts-export-${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Complete",
          description: "Your file has been downloaded",
        })
      }

      setIsOpen(false)
    } catch (error) {
      console.error("Export error:", error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An error occurred during export",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Payout Data</DialogTitle>
          <DialogDescription>
            Choose export format, columns, and options. You can also schedule regular exports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportFormats.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    {fmt.label} - {fmt.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Type (for PDF) */}
          {format === "pdf" && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="tax">Tax-Ready Report (1099 format)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Column Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Columns to Export</Label>
            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
              <div className="space-y-3">
                {defaultColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${column.id}`}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => handleColumnToggle(column.id)}
                    />
                    <label
                      htmlFor={`column-${column.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedColumns(defaultColumns.map((c) => c.id))}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedColumns(defaultColumns.filter((c) => c.default).map((c) => c.id))}
              >
                Reset to Defaults
              </Button>
            </div>
          </div>

          {/* Email Option */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="email-export"
                checked={!!email}
                onCheckedChange={(checked) => setEmail(checked ? "" : "")}
              />
              <Label htmlFor="email-export" className="text-sm font-medium">
                Send to Email
              </Label>
            </div>
            {email !== null && (
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Schedule Option */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="schedule-export"
                checked={scheduleEnabled}
                onCheckedChange={setScheduleEnabled}
              />
              <Label htmlFor="schedule-export" className="text-sm font-medium">
                Schedule Regular Exports
              </Label>
            </div>
            {scheduleEnabled && (
              <div className="mt-2 space-y-2">
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="email"
                  placeholder="Email for scheduled reports"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedColumns.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



