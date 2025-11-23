'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Package, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
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
          No packages found for this order
        </CardContent>
      </Card>
    )
  }

  const getPackageStatus = (pkg: ChinaDivisionOrderInfo['info'][0]) => {
    if (pkg.tracking_number) {
      return { label: 'Shipped', icon: Truck, variant: 'default' as const }
    }
    return { label: 'Preparing', icon: Clock, variant: 'outline' as const }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Packages ({packages.length})
        </CardTitle>
        <CardDescription>
          Track individual packages for order {orderId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {packages.map((pkg, index) => {
              const status = getPackageStatus(pkg)
              const StatusIcon = status.icon

              return (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Package {index + 1}</span>
                          <Badge variant={status.variant} className="ml-2">
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {pkg.product_name}
                        </p>
                        {pkg.sku && (
                          <p className="text-xs text-muted-foreground mt-1">
                            SKU: {pkg.sku} {pkg.sku_code && `(${pkg.sku_code})`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Qty: {pkg.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
                      {pkg.color && (
                        <div>
                          <span className="font-medium">Color:</span> {pkg.color}
                        </div>
                      )}
                      {pkg.size && (
                        <div>
                          <span className="font-medium">Size:</span> {pkg.size}
                        </div>
                      )}
                      {pkg.category && (
                        <div>
                          <span className="font-medium">Category:</span> {pkg.category}
                        </div>
                      )}
                      {pkg.supplier && (
                        <div>
                          <span className="font-medium">Supplier:</span> {pkg.supplier}
                        </div>
                      )}
                    </div>

                    {pkg.tracking_number && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Tracking Number</p>
                            <p className="text-muted-foreground font-mono">
                              {pkg.tracking_number}
                            </p>
                            {pkg.shipping_method && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Method: {pkg.shipping_method}
                              </p>
                            )}
                            {pkg.package_number && (
                              <p className="text-xs text-muted-foreground">
                                Package #: {pkg.package_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {pkg.product_url && (
                      <div className="mt-2">
                        <a
                          href={pkg.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View Product <span>↗</span>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

