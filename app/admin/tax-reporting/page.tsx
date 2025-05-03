"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, RefreshCw, FileText, Download, Calendar, Send, CheckCircle, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface TaxSummary {
  vendor_name: string
  total_amount: number
  payment_count: number
  tax_forms_generated: number
  tax_id: string | null
  tax_country: string | null
  is_company: boolean
  paypal_email: string | null
}

interface TaxForm {
  id: number
  vendor_name: string
  tax_year: number
  form_type: string
  form_number: string
  total_amount: number
  generated_at: string
  status: string
  sent_to_vendor: boolean
  sent_at: string | null
}

export default function TaxReportingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [taxSummary, setTaxSummary] = useState<TaxSummary[]>([])
  const [taxForms, setTaxForms] = useState<TaxForm[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [isGenerateFormDialogOpen, setIsGenerateFormDialogOpen] = useState(false)
  const [isGeneratingForms, setIsGeneratingForms] = useState(false)
  const [formType, setFormType] = useState<string>("1099-MISC")
  const { toast } = useToast()

  // Initialize tables and functions
  useEffect(() => {
    const initializeTaxReporting = async () => {
      setIsInitializing(true)
      try {
        // Initialize tax reporting tables
        await fetch("/api/tax-reporting/init-tables", {
          method: "POST",
        })

        // Initialize tax reporting functions
        await fetch("/api/tax-reporting/init-functions", {
          method: "POST",
        })

        // Fetch tax reporting data
        await fetchTaxReportingData()
      } catch (err: any) {
        console.error("Error initializing tax reporting:", err)
        setError(err.message || "Failed to initialize tax reporting")
      } finally {
        setIsInitializing(false)
      }
    }

    initializeTaxReporting()
  }, [])

  // Fetch tax reporting data when year changes
  useEffect(() => {
    if (!isInitializing) {
      fetchTaxReportingData()
    }
  }, [selectedYear, isInitializing])

  // Fetch tax reporting data
  const fetchTaxReportingData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tax-reporting/summary?year=${selectedYear}`)
      if (!response.ok) {
        throw new Error("Failed to fetch tax reporting data")
      }

      const data = await response.json()
      setTaxSummary(data.summary || [])
      setAvailableYears(data.availableYears || [])
      setTaxForms(data.taxForms || [])

      // If no year is selected and we have available years, select the most recent
      if ((!selectedYear || selectedYear === "null") && data.availableYears && data.availableYears.length > 0) {
        setSelectedYear(data.availableYears[0].toString())
      }
    } catch (err: any) {
      console.error("Error fetching tax reporting data:", err)
      setError(err.message || "Failed to fetch tax reporting data")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    await fetchTaxReportingData()
    toast({
      title: "Data refreshed",
      description: "Tax reporting data has been updated.",
    })
  }

  // Toggle vendor selection
  const toggleVendorSelection = (vendorName: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorName) ? prev.filter((name) => name !== vendorName) : [...prev, vendorName],
    )
  }

  // Select/deselect all vendors
  const toggleSelectAll = () => {
    if (selectedVendors.length === filteredTaxSummary.length) {
      setSelectedVendors([])
    } else {
      setSelectedVendors(filteredTaxSummary.map((summary) => summary.vendor_name))
    }
  }

  // Generate tax forms for selected vendors
  const generateTaxForms = async () => {
    if (selectedVendors.length === 0) return

    setIsGeneratingForms(true)
    try {
      const response = await fetch("/api/tax-reporting/generate-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: selectedYear,
          vendorNames: selectedVendors,
          formType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate tax forms")
      }

      const result = await response.json()

      toast({
        title: "Tax forms generated",
        description: `Successfully generated ${result.generated} tax forms.`,
      })

      // Refresh data
      await fetchTaxReportingData()

      // Close dialog and reset selection
      setIsGenerateFormDialogOpen(false)
      setSelectedVendors([])
    } catch (err: any) {
      console.error("Error generating tax forms:", err)
      setError(err.message || "Failed to generate tax forms")
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to generate tax forms",
      })
    } finally {
      setIsGeneratingForms(false)
    }
  }

  // Download tax form
  const downloadTaxForm = async (formId: number) => {
    try {
      const response = await fetch(`/api/tax-reporting/download-form/${formId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to download tax form")
      }

      const result = await response.json()

      // In a real implementation, we would open the PDF in a new tab
      // For now, we'll just show a success message
      toast({
        title: "Tax form downloaded",
        description: "The tax form has been downloaded successfully.",
      })

      // If there's a PDF URL, open it in a new tab
      if (result.pdfUrl) {
        window.open(result.pdfUrl, "_blank")
      }
    } catch (err: any) {
      console.error("Error downloading tax form:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to download tax form",
      })
    }
  }

  // Filter tax summary based on search query
  const filteredTaxSummary = taxSummary.filter((summary) =>
    summary.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filter tax forms based on search query
  const filteredTaxForms = taxForms.filter((form) => form.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tax Reporting</h1>
            <p className="text-muted-foreground mt-2">Generate and manage year-end tax forms for vendors</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.length > 0 ? (
                  availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Tax Summary
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Generated Forms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Tax Summary for {selectedYear}</CardTitle>
                <CardDescription>Review vendor payment totals and generate tax forms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:justify-between">
                    <div className="flex-1">
                      <Input
                        placeholder="Search vendors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div>
                      {selectedVendors.length > 0 && (
                        <Button onClick={() => setIsGenerateFormDialogOpen(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Forms ({selectedVendors.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredTaxSummary.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No tax data available</AlertTitle>
                      <AlertDescription>There are no vendor payments for the selected year.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox
                                checked={
                                  selectedVendors.length === filteredTaxSummary.length && filteredTaxSummary.length > 0
                                }
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Tax ID</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                            <TableHead>Payments</TableHead>
                            <TableHead>Forms</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTaxSummary.map((summary) => (
                            <TableRow key={summary.vendor_name}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedVendors.includes(summary.vendor_name)}
                                  onCheckedChange={() => toggleVendorSelection(summary.vendor_name)}
                                  aria-label={`Select ${summary.vendor_name}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{summary.vendor_name}</TableCell>
                              <TableCell>
                                {summary.tax_id ? (
                                  <span className="text-sm">{summary.tax_id}</span>
                                ) : (
                                  <Badge variant="outline" className="text-red-500 border-red-200">
                                    Not set
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{summary.tax_country || "Unknown"}</TableCell>
                              <TableCell className="text-right font-medium">
                                £{summary.total_amount.toFixed(2)}
                              </TableCell>
                              <TableCell>{summary.payment_count}</TableCell>
                              <TableCell>
                                {summary.tax_forms_generated > 0 ? (
                                  <Badge className="bg-green-500">{summary.tax_forms_generated}</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-500 border-amber-200">
                                    None
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleVendorSelection(summary.vendor_name)}
                                >
                                  {selectedVendors.includes(summary.vendor_name) ? "Deselect" : "Select"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Generated Tax Forms</CardTitle>
                  <CardDescription>View and download tax forms for {selectedYear}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex">
                    <Input
                      placeholder="Search vendors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredTaxForms.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No tax forms</AlertTitle>
                      <AlertDescription>No tax forms have been generated for the selected year.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Form Number</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Form Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Generated</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTaxForms.map((form) => (
                            <TableRow key={form.id}>
                              <TableCell className="font-mono text-xs">{form.form_number}</TableCell>
                              <TableCell className="font-medium">{form.vendor_name}</TableCell>
                              <TableCell>{form.form_type}</TableCell>
                              <TableCell className="text-right">£{form.total_amount.toFixed(2)}</TableCell>
                              <TableCell>{formatDate(form.generated_at)}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    form.status === "generated"
                                      ? "bg-green-500"
                                      : form.status === "pending"
                                        ? "bg-amber-500"
                                        : "bg-blue-500"
                                  }
                                >
                                  {form.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {form.sent_to_vendor ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-amber-500" />
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => downloadTaxForm(form.id)}
                                    title="Download Form"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={form.sent_to_vendor}
                                    title="Send to Vendor"
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Generate Tax Forms Dialog */}
      <Dialog open={isGenerateFormDialogOpen} onOpenChange={setIsGenerateFormDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Tax Forms</DialogTitle>
            <DialogDescription>
              You are about to generate tax forms for {selectedVendors.length} vendors for the year {selectedYear}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Form Type</h4>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1099-MISC">1099-MISC (US)</SelectItem>
                  <SelectItem value="1099-NEC">1099-NEC (US)</SelectItem>
                  <SelectItem value="P60">P60 (UK)</SelectItem>
                  <SelectItem value="P45">P45 (UK)</SelectItem>
                  <SelectItem value="CUSTOM">Custom Form</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This will generate tax forms for all selected vendors. Make sure all vendor tax information is correct
                before proceeding.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateFormDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateTaxForms} disabled={isGeneratingForms}>
              {isGeneratingForms ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Forms
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
