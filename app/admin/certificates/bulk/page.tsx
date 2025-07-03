"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  Download,
  ArrowLeft,
  Layers,
  BadgeIcon as Certificate,
  Settings,
  Clock,
} from "lucide-react"
import { supabase } from "/dev/null"
import Link from "next/link"

export default function BulkCertificatesPage() {
  const [productId, setProductId] = useState("")
  const [certificates, setCertificates] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || window.location.origin

  const generateCertificates = async () => {
    if (!productId) {
      setError("Please enter a product ID")
      return
    }

    setIsLoading(true)
    setError(null)
    setCertificates([])

    try {
      // Fetch all line items for this product from the database
      const { data, error: queryError } = await supabase
        .from("order_line_items")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "active") // Only get active line items
        .order("edition_number", { ascending: true })

      if (queryError) {
        throw new Error(`Error fetching line items: ${queryError.message}`)
      }

      if (!data || data.length === 0) {
        setError("No line items found for this product")
        return
      }

      // Generate and store URLs for each line item
      const certificateData = []

      for (const item of data) {
        try {
          // Call the API to generate and store the certificate URL
          const response = await fetch("/api/certificate/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lineItemId: item.line_item_id }),
          })

          if (!response.ok) {
            console.error(`Failed to generate certificate for line item ${item.line_item_id}`)
            continue
          }

          const responseData = await response.json()

          certificateData.push({
            lineItemId: item.line_item_id,
            orderId: item.order_id,
            orderName: item.order_name,
            editionNumber: item.edition_number,
            editionTotal: item.edition_total,
            createdAt: item.created_at,
            certificateUrl: responseData.certificateUrl,
            accessToken: responseData.accessToken,
          })
        } catch (err) {
          console.error(`Error generating certificate for line item ${item.line_item_id}:`, err)
        }
      }

      setCertificates(certificateData)
    } catch (err: any) {
      console.error("Error generating certificates:", err)
      setError(err.message || "Failed to generate certificates")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadCsv = () => {
    if (certificates.length === 0) return

    // Prepare CSV headers
    const headers = [
      "Line Item ID",
      "Order ID",
      "Order Name",
      "Edition Number",
      "Edition Total",
      "Created At",
      "Certificate URL",
      "Access Token",
    ]

    // Prepare CSV rows
    const rows = certificates.map((cert) => [
      cert.lineItemId,
      cert.orderId,
      cert.orderName,
      cert.editionNumber,
      cert.editionTotal,
      cert.createdAt,
      cert.certificateUrl,
      cert.accessToken,
    ])

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.setAttribute("href", url)
    link.setAttribute("download", `certificates-product-${productId}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin/certificates" className="flex items-center text-sm mb-2 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Certificates
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Certificate Generation</h1>
          <p className="text-muted-foreground mt-2">Generate certificates for all editions of a product</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <Layers className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates">
                <Certificate className="mr-2 h-4 w-4" />
                Certificates
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/management">
                <Settings className="mr-2 h-4 w-4" />
                Certificate Management
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/logs">
                <Clock className="mr-2 h-4 w-4" />
                Access Logs
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Certificates</CardTitle>
            <CardDescription>
              Enter a product ID to generate certificate URLs for all editions of that product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-id">Product ID</Label>
                <Input
                  id="product-id"
                  placeholder="Enter product ID"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This is the Shopify product ID for which you want to generate certificates
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {certificates.length > 0 && (
                <Alert>
                  <AlertTitle>Generated {certificates.length} Certificate URLs</AlertTitle>
                  <AlertDescription>
                    <Button size="sm" variant="outline" onClick={downloadCsv} className="mt-2">
                      <Download className="h-4 w-4 mr-1" />
                      Download CSV
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {certificates.length > 0 && (
                <div className="mt-4">
                  <div className="rounded-md border">
                    <div className="bg-muted px-4 py-2 grid grid-cols-12 gap-2 font-medium text-sm">
                      <div className="col-span-2">Edition #</div>
                      <div className="col-span-3">Order</div>
                      <div className="col-span-7">Certificate URL</div>
                    </div>
                    <div className="divide-y">
                      {certificates.map((cert) => (
                        <div key={cert.lineItemId} className="px-4 py-3 grid grid-cols-12 gap-2 text-sm">
                          <div className="col-span-2 font-medium">
                            #{cert.editionNumber}/{cert.editionTotal}
                          </div>
                          <div className="col-span-3 truncate">{cert.orderName}</div>
                          <div className="col-span-7 truncate text-primary underline">
                            <Link href={cert.certificateUrl} target="_blank">
                              {cert.certificateUrl}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateCertificates} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Certificate URLs"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
