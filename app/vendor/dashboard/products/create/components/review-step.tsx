"use client"



import { Image as ImageIcon, DollarSign, Video, Lock, LockOpen } from "lucide-react"
import DOMPurify from "dompurify"
import type { ProductSubmissionData, ProductCreationFields } from "@/types/product-submission"

import { Card, CardContent, Badge } from "@/components/ui"
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
        <h3 className="text-lg font-semibold mb-2">Review Your Artwork</h3>
        <p className="text-sm text-muted-foreground">
          Please review all information before submitting. You can go back to make changes.
        </p>
      </div>

      {/* Unified Artwork Preview Card */}
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Artwork Image Section - Smaller Display */}
          <div className="relative bg-muted aspect-square flex items-center justify-center p-6">
            {firstImage ? (
              <div className="w-2/3 max-w-md aspect-square relative">
                {firstImage.mediaType === 'video' ? (
                  <video
                    src={firstImage.src}
                    className="w-full h-full object-contain rounded-lg"
                    muted
                    loop
                    playsInline
                    controls
                  />
                ) : (
                  <img
                    src={firstImage.src}
                    alt={formData.title}
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                )}
                <Badge className="absolute top-2 left-2">Artwork Image</Badge>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
            )}
            {additionalImages.length > 0 && (
              <Badge variant="secondary" className="absolute top-3 right-3">
                +{additionalImages.length} more
              </Badge>
            )}
          </div>

          {/* Artwork Details Section */}
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
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(formData.description, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
                        ALLOWED_ATTR: ['href', 'target', 'rel'],
                      }),
                    }}
                  />
                </div>
              )}

              {/* Pricing & Edition Info */}
              <div className="flex items-center gap-4 flex-wrap pt-2 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Price</div>
                  <div className="text-2xl font-bold">${variant?.price || "0.00"}</div>
                </div>
                {editionSizeMetafield && (
                  <div>
                    <div className="text-xs text-muted-foreground">Edition Size</div>
                    <div className="text-xl font-semibold">{editionSizeMetafield.value} editions</div>
                  </div>
                )}
              </div>

              {/* Series Information */}
              {formData.series_id && formData.series_name && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Series</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{formData.series_name}</Badge>
                    {formData.is_locked && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Locked
                      </Badge>
                    )}
                    {formData.unlock_order && (
                      <Badge variant="outline">
                        Unlock Order: {formData.unlock_order}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Images Preview */}
            {additionalImages.length > 0 && (
              <div className="pt-4 border-t mt-4">
                <div className="text-xs text-muted-foreground mb-2">Additional Images & Videos</div>
                <div className="grid grid-cols-4 gap-2">
                  {additionalImages.slice(0, 4).map((image, index) => (
                    <div key={index} className="aspect-square border rounded overflow-hidden bg-muted relative">
                      {image.mediaType === 'video' ? (
                        <video
                          src={image.src}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={image.src}
                          alt={`Image ${index + 2}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      )}
                      {image.mediaType === 'video' && (
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                          <Video className="h-3 w-3" />
                        </div>
                      )}
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
