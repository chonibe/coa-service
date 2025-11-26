"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Image as ImageIcon, DollarSign } from "lucide-react"
import type { ProductSubmissionData, ProductCreationFields } from "@/types/product-submission"

interface ReviewStepProps {
  formData: ProductSubmissionData
  fieldsConfig: ProductCreationFields | null
}

export function ReviewStep({ formData, fieldsConfig }: ReviewStepProps) {
  const editionSizeMetafield = formData.metafields?.find(
    (m) => m.namespace === "custom" && m.key === "edition_size",
  )
  const variant = formData.variants && formData.variants.length > 0 ? formData.variants[0] : null
  const firstImage = formData.images && formData.images.length > 0 ? formData.images[0] : null
  const additionalImages = formData.images?.slice(1) || []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review Your Product</h3>
        <p className="text-sm text-muted-foreground">
          Please review all information before submitting. You can go back to make changes.
        </p>
      </div>

      {/* Unified Product Preview Card */}
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-muted aspect-square">
            {firstImage ? (
              <img
                src={firstImage.src}
                alt={formData.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
            )}
            {firstImage && (
              <Badge className="absolute top-3 left-3">Primary Image</Badge>
            )}
            {additionalImages.length > 0 && (
              <Badge variant="secondary" className="absolute top-3 right-3">
                +{additionalImages.length} more
              </Badge>
            )}
          </div>

          {/* Product Details Section */}
          <CardContent className="p-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold">{formData.title}</h2>
                {formData.vendor && (
                  <p className="text-sm text-muted-foreground mt-1">by {formData.vendor}</p>
                )}
              </div>

              {/* Description */}
              {formData.description && (
                <div>
                  <div
                    className="text-sm prose prose-sm max-w-none line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                </div>
              )}

              {/* Pricing & Edition Info */}
              <div className="flex items-center gap-4 flex-wrap pt-2 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Price</div>
                  <div className="text-2xl font-bold">£{variant?.price || "0.00"}</div>
                </div>
                {editionSizeMetafield && (
                  <div>
                    <div className="text-xs text-muted-foreground">Edition Size</div>
                    <div className="text-xl font-semibold">{editionSizeMetafield.value} editions</div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Images Preview */}
            {additionalImages.length > 0 && (
              <div className="pt-4 border-t mt-4">
                <div className="text-xs text-muted-foreground mb-2">Additional Images</div>
                <div className="grid grid-cols-4 gap-2">
                  {additionalImages.slice(0, 4).map((image, index) => (
                    <div key={index} className="aspect-square border rounded overflow-hidden bg-muted">
                      <img
                        src={image.src}
                        alt={`Image ${index + 2}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  ))}
                  {additionalImages.length > 4 && (
                    <div className="aspect-square border rounded flex items-center justify-center bg-muted text-xs text-muted-foreground">
                      +{additionalImages.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
