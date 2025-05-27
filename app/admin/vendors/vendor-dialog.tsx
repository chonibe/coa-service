"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VendorDialogProps {
  vendor: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function VendorDialog({ vendor, open, onOpenChange, onSave }: VendorDialogProps) {
  const [instagramUrl, setInstagramUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [taxId, setTaxId] = useState("")
  const [taxCountry, setTaxCountry] = useState("GB")
  const [isCompany, setIsCompany] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)

  // Reset form when vendor changes
  useEffect(() => {
    if (vendor) {
      setInstagramUrl(vendor.instagram_url || "")
      setNotes(vendor.notes || "")
      setPaypalEmail(vendor.paypal_email || "")
      setTaxId(vendor.tax_id || "")
      setTaxCountry(vendor.tax_country || "GB")
      setIsCompany(vendor.is_company || false)
      setSignatureUrl(vendor.signature_url || null)
    } else {
      setInstagramUrl("")
      setNotes("")
      setPaypalEmail("")
      setTaxId("")
      setTaxCountry("GB")
      setIsCompany(false)
      setSignatureUrl(null)
    }
    setError(null)
  }, [vendor, open])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !vendor) return

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("field", "signature")
      formData.append("vendorId", vendor.name)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      const data = await response.json()
      setSignatureUrl(data.url)
    } catch (error) {
      console.error("Error uploading file:", error)
      setError("Failed to upload signature. Please try again.")
    }
  }

  const handleSave = async () => {
    if (!vendor) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/vendors/custom-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor_name: vendor.name,
          instagram_url: instagramUrl,
          notes: notes,
          paypal_email: paypalEmail,
          tax_id: taxId,
          tax_country: taxCountry,
          is_company: isCompany,
          signature_url: signatureUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to save vendor data")
      }

      onSave()
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error saving vendor data:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Vendor: {vendor?.name}</DialogTitle>
          <DialogDescription>Update vendor information and settings.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="instagram" className="text-right">
              Instagram
            </Label>
            <Input
              id="instagram"
              placeholder="https://instagram.com/username"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paypal" className="text-right">
              PayPal Email
            </Label>
            <Input
              id="paypal"
              type="email"
              placeholder="email@example.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right">
              <Label htmlFor="is-company">Business Type</Label>
            </div>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="is-company"
                checked={isCompany}
                onCheckedChange={(checked) => setIsCompany(checked as boolean)}
              />
              <label
                htmlFor="is-company"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                This vendor is a registered business/company
              </label>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tax-id" className="text-right">
              Tax ID
            </Label>
            <Input
              id="tax-id"
              placeholder={isCompany ? "VAT/Tax Registration Number" : "National Insurance/SSN"}
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tax-country" className="text-right">
              Tax Country
            </Label>
            <Select value={taxCountry} onValueChange={setTaxCountry}>
              <SelectTrigger id="tax-country" className="col-span-3">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="IT">Italy</SelectItem>
                <SelectItem value="ES">Spain</SelectItem>
                <SelectItem value="JP">Japan</SelectItem>
                <SelectItem value="CN">China</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="signature" className="text-right">
              Signature
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="signature"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Upload a clear image of the vendor's signature for certificates of authenticity.
              </p>
              {signatureUrl && (
                <div className="mt-2 p-4 border rounded-md">
                  <img
                    src={signatureUrl}
                    alt="Current signature"
                    className="h-16 object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this vendor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
