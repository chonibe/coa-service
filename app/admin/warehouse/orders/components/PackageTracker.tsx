'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'
import type { ChinaDivisionOrderInfo } from '@/lib/chinadivision/client'

interface PackageTrackerProps {
  packages: ChinaDivisionOrderInfo['info']
  orderId: string
}

export function PackageTracker({ packages, orderId }: PackageTrackerProps) {
  if (!packages || packages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No items found for this order
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Items ({packages.length})
        </CardTitle>
        <CardDescription>
          Items included in order {orderId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {packages.map((item, index) => (
            <div key={index} className="flex items-start justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {item.product_name || item.sku || 'Unknown Product'}
                </p>
                {item.sku && item.product_name && item.product_name !== item.sku && (
                  <p className="text-xs text-muted-foreground mt-1">
                    SKU: {item.sku} {item.sku_code && `(${item.sku_code})`}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {item.color && (
                    <span><span className="font-medium">Color:</span> {item.color}</span>
                  )}
                  {item.size && (
                    <span><span className="font-medium">Size:</span> {item.size}</span>
                  )}
                  {item.category && (
                    <span><span className="font-medium">Category:</span> {item.category}</span>
                  )}
                  {item.supplier && (
                    <span><span className="font-medium">Supplier:</span> {item.supplier}</span>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-medium">
                  Qty: {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

