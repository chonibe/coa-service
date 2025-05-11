import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"

interface Product {
  id: string
  product_id: string
  name: string
  vendor_name: string
  sku: string
  edition_size: string | null
  price: number | null
  image_url: string | null
}

export default async function ProductEditionsPage() {
  const supabase = createClient()
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Error loading products')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Product Editions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button className="flex items-center space-x-1">
                      <span>Vendor</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button className="flex items-center space-x-1">
                      <span>SKU</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button className="flex items-center space-x-1">
                      <span>Edition Size</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <button className="flex items-center space-x-1">
                      <span>Price</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: Product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-4">
                      <Link 
                        href={`/admin/product-editions/${product.product_id}`}
                        className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
                      >
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <span className="text-xs text-muted-foreground">No image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-primary">{product.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4">{product.vendor_name}</td>
                    <td className="p-4">{product.sku}</td>
                    <td className="p-4">
                      {product.edition_size ? (
                        <Badge variant="outline">{product.edition_size}</Badge>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="p-4">
                      {product.price ? `$${product.price.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/product-editions/${product.product_id}`}
                        className="text-primary hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 