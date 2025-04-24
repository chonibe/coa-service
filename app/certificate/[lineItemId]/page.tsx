"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { AppleButton } from "@/components/apple-button"
import { CardContent } from "@/components/ui/card"
import { AppleCard } from "@/components/apple-card"
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
import { fadeIn, slideUp, staggerContainer } from "@/lib/motion-variants"

// Keep the rest of the component implementation

export default function CertificatePage() {
  const params = useParams()
  const lineItemId = params.lineItemId as string

  const [certificate, setCertificate] = useState<any>(null)
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
      <motion.div
        className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <motion.h1 className="text-3xl font-extrabold" variants={slideUp}>
              Loading Certificate...
            </motion.h1>
            <motion.p className="mt-2 text-lg text-gray-600" variants={slideUp}>
              Please wait while we verify your edition
            </motion.p>
          </div>
          <motion.div variants={slideUp}>
            <AppleCard>
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
            </AppleCard>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  if (error || !certificate) {
    return (
      <motion.div
        className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Certificate Error</AlertTitle>
            <AlertDescription>
              {error || "Certificate not found. The provided edition ID may be invalid."}
            </AlertDescription>
          </Alert>
          <motion.div variants={slideUp}>
            <AppleCard>
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                </motion.div>
                <h2 className="text-xl font-bold mb-2">Certificate Verification Failed</h2>
                <p className="text-gray-600 mb-6">
                  We couldn't verify this certificate. Please check the URL and try again.
                </p>
                <AppleButton variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </AppleButton>
              </CardContent>
            </AppleCard>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="max-w-3xl mx-auto">
        <motion.div className="text-center mb-8" variants={slideUp}>
          <motion.div
            className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CheckCircle className="h-8 w-8 text-green-600" />
          </motion.div>
          <h1 className="text-3xl font-extrabold">Certificate of Authenticity</h1>
          <p className="mt-2 text-lg text-gray-600">
            Edition #{certificate.lineItem.editionNumber} of {certificate.lineItem.editionTotal}
          </p>
        </motion.div>

        <motion.div variants={slideUp}>
          <AppleCard className="mb-8 overflow-hidden border-none shadow-lg">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1">
              <CardContent className="p-0">
                <div className="bg-white p-8">
                  {/* Product Image */}
                  {certificate.product.images && certificate.product.images.length > 0 && (
                    <motion.div
                      className="mb-8 aspect-video relative bg-gray-100 rounded-lg overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <Image
                        src={certificate.product.images[0].src || "/placeholder.svg"}
                        alt={certificate.product.images[0].alt || certificate.product.title}
                        fill
                        className="object-contain"
                      />
                    </motion.div>
                  )}

                  {/* Certificate Header */}
                  <motion.div
                    className="mb-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <h2 className="text-2xl font-bold">{certificate.product.title}</h2>
                    <p className="text-gray-500">{certificate.product.vendor}</p>
                  </motion.div>

                  {/* Certificate Details */}
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="border rounded-lg p-4" variants={slideUp}>
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
                    </motion.div>

                    <motion.div className="border rounded-lg p-4" variants={slideUp}>
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
                    </motion.div>

                    <motion.div className="border rounded-lg p-4" variants={slideUp}>
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
                    </motion.div>

                    <motion.div className="border rounded-lg p-4" variants={slideUp}>
                      <div className="flex items-start">
                        <User className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Ownership</h3>
                          {certificate.order.customer ? (
                            <p className="text-gray-600">
                              {certificate.order.customer.firstName} {certificate.order.customer.lastName}
                            </p>
                          ) : (
                            <p className="text-gray-600">Verified Owner</p>
                          )}
                          <p className="text-sm text-gray-500">Original Purchaser</p>
                        </div>
                      </div>
                    </motion.div>

                    {certificate.lineItem.certificateGeneratedAt && (
                      <motion.div className="border rounded-lg p-4" variants={slideUp}>
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
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Certificate Description */}
                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">Product Description</h3>
                    <div className="text-gray-600 prose prose-sm max-w-none">
                      {certificate.product.description ? (
                        <div dangerouslySetInnerHTML={{ __html: certificate.product.description }} />
                      ) : (
                        <p>{certificate.product.title}</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Verification Information */}
                  <motion.div
                    className="border-t pt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
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
                        <AppleButton size="sm" onClick={handleShare}>
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </AppleButton>
                        <AppleButton size="sm" variant="outline" onClick={() => window.print()}>
                          <Download className="h-4 w-4 mr-1" />
                          Print
                        </AppleButton>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </div>
          </AppleCard>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="text-sm text-gray-500 mb-4">
            This certificate serves as proof of authenticity and ownership for the limited edition item. Each
            certificate is uniquely tied to the purchase record and cannot be transferred.
          </p>
          <div className="inline-flex items-center justify-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">Verified Authentic</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
