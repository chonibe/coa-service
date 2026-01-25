"use client"

import { useEffect, useState } from "react"
import Image from "next/image"



import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  CheckCircle,
  Download,
  Share2,
  Clock,
  ShoppingBag,
  User,
  BadgeIcon as Certificate,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Button, Card, CardContent, Alert, AlertDescription, AlertTitle } from "@/components/ui"
// Sample data for preview
const sampleCertificate = {
  lineItem: {
    id: "123456789",
    editionNumber: 42,
    editionTotal: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    certificateGeneratedAt: new Date().toISOString(),
    accessToken: "sample-token-123456789",
  },
  product: {
    id: "987654321",
    title: "Limited Edition Artwork",
    vendor: "Artist Name",
    description: "This is a beautiful limited edition artwork created by the artist. Each piece is individually numbered and verified for authenticity.",
    images: [
      {
        src: "https://placehold.co/600x400",
        alt: "Sample Artwork",
      },
    ],
  },
  order: {
    orderName: "Order #1001",
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    customer: {
      firstName: "John",
      lastName: "Doe",
    },
  },
  verificationUrl: "https://your-domain.com/certificate/123456789",
}

export default function CertificatePreviewPage() {
  const searchParams = useSearchParams()
  const lineItemId = searchParams.get("lineItemId")
  const [certificate, setCertificate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (lineItemId) {
          const response = await fetch(`/api/certificate/${lineItemId}`)
          if (!response.ok) {
            throw new Error(`Error ${response.status}: Certificate not found`)
          }
          const data = await response.json()
          setCertificate(data.certificate)
        } else {
          // Use sample data if no line item ID is provided
          setCertificate(sampleCertificate)
        }
      } catch (err: any) {
        console.error("Error fetching certificate:", err)
        setError(err.message || "Failed to load certificate")
        // Fallback to sample data on error
        setCertificate(sampleCertificate)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCertificate()
  }, [lineItemId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleShare = () => {
    if (navigator.share && certificate) {
      navigator.share({
        title: `Certificate of Authenticity - Edition #${certificate.lineItem.editionNumber}`,
        text: `View my certificate of authenticity for ${certificate.product.title} - Edition #${certificate.lineItem.editionNumber} of ${certificate.lineItem.editionTotal}`,
        url: window.location.href,
      })
    } else {
      // Fallback to clipboard copy
      navigator.clipboard.writeText(window.location.href)
      alert("Certificate URL copied to clipboard!")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold">Loading Certificate Preview...</h1>
            <p className="mt-2 text-lg text-gray-600">Please wait while we generate the preview</p>
          </div>
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                  <Skeleton className="absolute inset-0" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Preview Error</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Showing sample certificate preview instead.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" asChild>
            <Link href="/admin/certificates/management">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Management
            </Link>
          </Button>
          <div className="text-sm text-gray-500">
            {lineItemId ? "Preview Mode" : "Sample Preview"}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold">Certificate of Authenticity</h1>
          <p className="mt-2 text-lg text-gray-600">
            Edition #{certificate.lineItem.editionNumber} of {certificate.lineItem.editionTotal}
          </p>
        </div>

        <Card className="mb-8 overflow-hidden border-none shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1">
            <CardContent className="p-0">
              <div className="bg-white p-8">
                {/* Product Image */}
                {certificate.product.images && certificate.product.images.length > 0 && (
                  <div className="mb-8 aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={certificate.product.images[0].src}
                      alt={certificate.product.images[0].alt}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                {/* Certificate Header */}
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold">{certificate.product.title}</h2>
                  <p className="text-gray-500">{certificate.product.vendor}</p>
                </div>

                {/* Certificate Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start">
                      <Certificate className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Edition Details</h3>
                        <p className="text-indigo-600 font-bold text-lg">
                          #{certificate.lineItem.editionNumber} of {certificate.lineItem.editionTotal}
                        </p>
                        <p className="text-sm text-gray-500">Limited Edition</p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Authentication Date</h3>
                        <p className="text-gray-600">
                          {formatDate(certificate.lineItem.updatedAt)}
                        </p>
                        <p className="text-sm text-gray-500">Last verified edition number</p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-start">
                      <ShoppingBag className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Purchase Information</h3>
                        <p className="text-gray-600">{certificate.order.orderName}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(certificate.order.processedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Ownership</h3>
                        <p className="text-gray-600">
                          {certificate.order.customer.firstName} {certificate.order.customer.lastName}
                        </p>
                        <p className="text-sm text-gray-500">Original Purchaser</p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-start">
                      <Certificate className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Certificate Details</h3>
                        <p className="text-gray-600">
                          Generated on {formatDate(certificate.lineItem.certificateGeneratedAt)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Certificate ID: {certificate.lineItem.accessToken.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Description */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-2">Product Description</h3>
                  <div className="text-gray-600 prose prose-sm max-w-none">
                    <p>{certificate.product.description}</p>
                  </div>
                </div>

                {/* Verification Information */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">
                        Verification URL:
                        <span className="ml-1 text-indigo-600 break-all">{certificate.verificationUrl}</span>
                      </p>
                      <p className="text-xs text-gray-500">Line Item ID: {certificate.lineItem.id}</p>
                      <p className="text-xs text-gray-500">Product ID: {certificate.product.id}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.print()}>
                        <Download className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            This certificate serves as proof of authenticity and ownership for the limited edition item. Each
            certificate is uniquely tied to the purchase record and cannot be transferred.
          </p>
          <div className="inline-flex items-center justify-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">Verified Authentic</span>
          </div>
        </div>
      </div>
    </div>
  )
} 