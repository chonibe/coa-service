"use client"

import { useState, useEffect } from "react"



import { Skeleton } from "@/components/ui"

import { AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PurchaseDialog } from "./purchase-dialog"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription } from "@/components/ui"
interface LampProduct {
  sku: string
  name: string
  type: "lamp"
  regularPrice: number
  discountEligible: boolean
  discountPercentage: number
}

export function LampPurchaseCard() {
  const [products, setProducts] = useState<LampProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasAddress, setHasAddress] = useState<boolean | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<LampProduct | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vendor/store/products", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      if (data.success && data.products?.lamps) {
        setProducts(data.products.lamps)
        setHasAddress(data.hasAddress ?? false)
      }
    } catch (error: any) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = (product: LampProduct) => {
    setSelectedProduct(product)
    setShowPurchaseDialog(true)
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  const calculatePrice = (product: LampProduct) => {
    if (product.discountEligible && product.discountPercentage > 0) {
      return product.regularPrice * (1 - product.discountPercentage / 100)
    }
    return product.regularPrice
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No Lamp products available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {products.map((product) => {
        const finalPrice = calculatePrice(product)
        const hasDiscount = product.discountEligible && product.discountPercentage > 0

        return (
          <Card key={product.sku}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{product.name}</CardTitle>
                </div>
                {hasDiscount && (
                  <Badge variant="default" className="bg-green-600">
                    50% OFF
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  {hasDiscount ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{formatCurrency(finalPrice)}</span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.regularPrice)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold">{formatCurrency(finalPrice)}</div>
                  )}
                  {hasDiscount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      First-time purchase discount applied
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handlePurchase(product)}
                  className="w-full"
                  size="lg"
                >
                  Purchase {product.name}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {selectedProduct && (
        <PurchaseDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
          purchaseType="lamp"
          productSku={selectedProduct.sku}
          productName={selectedProduct.name}
          price={calculatePrice(selectedProduct)}
          onSuccess={() => {
            setShowPurchaseDialog(false)
            fetchProducts() // Refresh to update discount eligibility
          }}
        />
      )}
    </>
  )
}

