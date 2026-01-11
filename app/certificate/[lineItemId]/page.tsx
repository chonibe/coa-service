"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import DOMPurify from "dompurify"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
} from "lucide-react"
import { InkOGatchi } from "@/app/collector/dashboard/components/ink-o-gatchi"

export default function CertificatePage() {
  const params = useParams()
  const lineItemId = params.lineItemId as string

  const [certificate, setCertificate] = useState<any>(null)
  const [ownerAvatar, setOwnerAvatar] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/certificate/${lineItemId}`)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: Certificate not found`)
        }

        const data = await response.json()
        setCertificate(data.certificate)

        // Fetch owner avatar if they have one
        const ownerEmail = data.certificate.lineItem.ownerEmail
        const ownerId = data.certificate.lineItem.ownerId
        
        if (ownerEmail || ownerId) {
          const avatarRes = await fetch(`/api/collector/avatar?email=${ownerEmail || ''}&userId=${ownerId || ''}`)
          if (avatarRes.ok) {
            const avatarData = await avatarRes.json()
            if (avatarData.success) {
              setOwnerAvatar(avatarData.avatar)
            }
          }
        }
      } catch (err: any) {
        console.error("Error fetching certificate:", err)
        setError(err.message || "Failed to load certificate")
      } finally {
        setIsLoading(false)
      }
    }

    if (lineItemId) {
      fetchCertificate()
    }
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
            <h1 className="text-3xl font-extrabold">Loading Certificate...</h1>
            <p className="mt-2 text-lg text-gray-600">Please wait while we verify your edition</p>
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

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Certificate Error</AlertTitle>
            <AlertDescription>
              {error || "Certificate not found. The provided edition ID may be invalid."}
            </AlertDescription>
          </Alert>
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Certificate Verification Failed</h2>
              <p className="text-gray-600 mb-6">
                We couldn't verify this certificate. Please check the URL and try again.
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
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
                      src={certificate.product.images[0].src || "/placeholder.svg"}
                      alt={certificate.product.images[0].alt || certificate.product.title}
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
                          {formatDate(certificate.lineItem.updatedAt || certificate.lineItem.createdAt)}
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
                          {formatDate(certificate.order.processedAt || certificate.order.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Ownership</h3>
                        <div className="flex items-center gap-3 mt-1">
                          {ownerAvatar && (
                            <div className="h-12 w-12 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center overflow-hidden">
                              <InkOGatchi 
                                stage={ownerAvatar.evolutionStage} 
                                equippedItems={{
                                  hat: ownerAvatar.equippedItems?.hat?.asset_url,
                                  eyes: ownerAvatar.equippedItems?.eyes?.asset_url,
                                  body: ownerAvatar.equippedItems?.body?.asset_url,
                                  accessory: ownerAvatar.equippedItems?.accessory?.asset_url,
                                }}
                                size={48} 
                              />
                            </div>
                          )}
                          <div>
                            {certificate.order.customer ? (
                              <p className="text-gray-600 font-medium">
                                {certificate.order.customer.firstName} {certificate.order.customer.lastName}
                              </p>
                            ) : (
                              <p className="text-gray-600 font-medium">Verified Owner</p>
                            )}
                            {ownerAvatar?.level && (
                              <p className="text-[10px] uppercase font-bold text-indigo-500">LVL {ownerAvatar.level} Collector</p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Original Purchaser</p>
                      </div>
                    </div>
                  </div>

                  {certificate.lineItem.certificateGeneratedAt && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start">
                        <Certificate className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Certificate Details</h3>
                          <p className="text-gray-600">
                            Generated on {formatDate(certificate.lineItem.certificateGeneratedAt)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Certificate ID: {certificate.lineItem.accessToken?.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Certificate Description */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-2">Product Description</h3>
                  <div className="text-gray-600 prose prose-sm max-w-none">
                    {certificate.product.description ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(certificate.product.description, {
                            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
                            ALLOWED_ATTR: ['href', 'target', 'rel'],
                          }),
                        }}
                      />
                    ) : (
                      <p>{certificate.product.title}</p>
                    )}
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
