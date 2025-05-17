"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  product_id: string;
  name: string;
  vendor_name: string;
  sku: string;
  edition_size: string | null;
  price: number | null;
  image_url: string | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProductEditionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
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
                    Vendor
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    SKU
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Edition Size
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Price
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
                        View Editions
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
  );
} 