"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Image as ImageIcon, Package, DollarSign, Tag, FileText } from "lucide-react"
import type { ProductSubmissionData, ProductCreationFields } from "@/types/product-submission"

interface ReviewStepProps {
  formData: ProductSubmissionData
  fieldsConfig: ProductCreationFields | null
}

export function ReviewStep({ formData, fieldsConfig }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review Your Product</h3>
        <p className="text-sm text-muted-foreground">
          Please review all information before submitting. You can go back to make changes.
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Title</div>
            <div className="text-base font-semibold">{formData.title}</div>
          </div>
          {formData.description && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Description</div>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.description }}
              />
            </div>
          )}
          {formData.product_type && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Product Type</div>
              <div className="text-sm">{formData.product_type}</div>
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-muted-foreground">Handle</div>
            <div className="text-sm font-mono">{formData.handle || "Auto-generated"}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Vendor</div>
            <div className="text-sm">{formData.vendor}</div>
          </div>
        </CardContent>
      </Card>

      {/* Variants & Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Variants & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="font-medium">Variant {index + 1}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price: </span>
                    <span className="font-semibold">${variant.price}</span>
                  </div>
                  {variant.compare_at_price && (
                    <div>
                      <span className="text-muted-foreground">Compare at: </span>
                      <span className="line-through">${variant.compare_at_price}</span>
                    </div>
                  )}
                  {variant.sku && (
                    <div>
                      <span className="text-muted-foreground">SKU: </span>
                      <span>{variant.sku}</span>
                    </div>
                  )}
                  {variant.inventory_quantity !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Inventory: </span>
                      <span>{variant.inventory_quantity}</span>
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Requires shipping: </span>
                  <span>{variant.requires_shipping !== false ? "Yes" : "No"}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      {formData.images && formData.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Images ({formData.images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative aspect-square border rounded-md overflow-hidden bg-muted">
                  <img
                    src={image.src}
                    alt={image.alt || `Product image ${index + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                  {index === 0 && (
                    <Badge className="absolute top-2 left-2">Primary</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags & Collections */}
      {(formData.tags?.length || fieldsConfig?.vendor_collections?.length) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags & Collections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.tags && formData.tags.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {fieldsConfig?.vendor_collections?.[0] && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Collection</div>
                <div className="text-sm">{fieldsConfig.vendor_collections[0].collection_title}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metafields */}
      {formData.metafields && formData.metafields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Metafields ({formData.metafields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.metafields.map((metafield, index) => (
                <div key={index} className="text-sm">
                  <span className="font-mono text-muted-foreground">
                    {metafield.namespace}.{metafield.key}:
                  </span>{" "}
                  <span>{metafield.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

