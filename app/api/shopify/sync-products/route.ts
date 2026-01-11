import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/supabase"

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string;
  grams: number;
  image_id: number | null;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  metafields?: ShopifyMetafield[];
}

interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
}

interface ShopifyMetafield {
  id: number;
  namespace: string;
  key: string;
  value: string;
  type: string;
  created_at: string;
  updated_at: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  status: string;
  body_html: string;
  variants: ShopifyVariant[];
  options: Array<{
    id: number;
    product_id: number;
    name: string;
    position: number;
    values: string[];
  }>;
  images: ShopifyImage[];
  image: ShopifyImage | null;
  metafields: ShopifyMetafield[];
}

async function fetchAllProductsFromShopify(): Promise<ShopifyProduct[]> {
  let allProducts: ShopifyProduct[] = [];
  let hasNextPage = true;
  let nextPageUrl: string | null = null;

  while (hasNextPage) {
    try {
      const url: string = nextPageUrl || 
        `https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=250&status=any`;
      
      console.log(`[Product Sync] Fetching products from: ${url}`);
      
      const response: Response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch products: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const products = data.products || [];
      allProducts = allProducts.concat(products);

      // Check for pagination
      const linkHeader: string | null = response.headers.get("link");
      if (linkHeader) {
        const match: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>; rel="next"/);
        nextPageUrl = match ? match[1] : null;
        hasNextPage = !!nextPageUrl;
      } else {
        hasNextPage = false;
      }

      console.log(`[Product Sync] Fetched ${products.length} products, total: ${allProducts.length}`);
    } catch (error) {
      console.error("[Product Sync] Error fetching products:", error);
      throw error;
    }
  }

  return allProducts;
}

async function fetchProductMetafields(productId: number): Promise<ShopifyMetafield[]> {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}/metafields.json`;
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metafields: ${response.status}`);
    }

    const data = await response.json();
    return data.metafields || [];
  } catch (error) {
    console.error(`[Product Sync] Error fetching metafields for product ${productId}:`, error);
    return [];
  }
}

async function fetchVariantMetafields(variantId: number): Promise<ShopifyMetafield[]> {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/variants/${variantId}/metafields.json`;
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch variant metafields: ${response.status}`);
    }

    const data = await response.json();
    return data.metafields || [];
  } catch (error) {
    console.error(`[Product Sync] Error fetching metafields for variant ${variantId}:`, error);
    return [];
  }
}

async function fetchParentProductId(variantId: number): Promise<number | null> {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/variants/${variantId}.json`;
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch variant: ${response.status}`);
    }

    const data = await response.json();
    return data.variant?.product_id ?? null;
  } catch (error) {
    console.error(`[Product Sync] Error fetching parent product ID for variant ${variantId}:`, error);
    return null;
  }
}

function generateUUIDFromShopifyId(shopifyId: number): string {
  // Convert the Shopify ID to a hex string and pad it to 12 characters
  const hexId = shopifyId.toString(16).padStart(12, '0');
  // Create a UUID v4-like string with the Shopify ID embedded
  return `00000000-0000-4000-8000-${hexId}`;
}

export async function POST() {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized");
    }

    const db = supabase;

    // Fetch all products from Shopify
    const products = await fetchAllProductsFromShopify();
    console.log(`[Product Sync] Found ${products.length} products to sync`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each product
    for (const product of products) {
      try {
        // Generate a UUID from the Shopify ID
        const uuid = generateUUIDFromShopifyId(product.id);

        // Get the first variant's SKU and price
        const firstVariant = product.variants?.[0];
        const sku = firstVariant?.sku || '';
        const price = firstVariant?.price ? parseFloat(firstVariant.price) : null;

        // Log product details for debugging
        console.log(`[Product Sync] Processing product:`, {
          id: product.id,
          title: product.title,
          hasImages: !!product.images?.length,
          firstImageSrc: product.images?.[0]?.src,
          variants: product.variants?.length,
          firstVariant: firstVariant ? {
            id: firstVariant.id,
            sku: firstVariant.sku,
            price: firstVariant.price
          } : null
        });

        // Fetch product metafields
        const productMetafields = await fetchProductMetafields(product.id);
        const productEditionSizeMetafield = productMetafields.find(
          m => m.namespace === 'custom' && m.key === 'edition_size'
        );
        let editionSize = productEditionSizeMetafield?.value ?? null;

        // Check if this is a variant and get parent product ID
        let parentProductId: string | null = null;
        if (firstVariant && firstVariant.product_id !== product.id) {
          parentProductId = firstVariant.product_id.toString();
          console.log(`[Product Sync] Found parent product ID ${parentProductId} for variant ${product.id}`);
        }

        // Check variant metafield
        if (firstVariant) {
          const variantMetafields = await fetchVariantMetafields(firstVariant.id);
          const variantEditionSizeMetafield = variantMetafields.find(
            m => m.namespace === 'custom' && m.key === 'edition_size'
          );
          const variantEditionSize = variantEditionSizeMetafield?.value ?? null;
          
          // If variant edition size is null and vendor is not Street Collector, set it to 90
          if (variantEditionSize === null && product.vendor !== "Street Collector") {
            editionSize = "90";
          } else {
            editionSize = variantEditionSize;
          }
        }

        // Prepare product data to match our table structure
        const productData = {
          id: uuid,
          product_id: parentProductId ?? product.id.toString(),
          parent_shopify_id: parentProductId,
          name: product.title,
          vendor_name: product.vendor,
          handle: product.handle,
          description: product.body_html || '',
          price: price,
          sku: sku,
          edition_size: editionSize,
          image_url: product.images?.[0]?.src || null,
          img_url: product.images?.[0]?.src || null, // Ensure both image fields are populated
          created_at: product.created_at,
          updated_at: product.updated_at
        };

        console.log(`[Product Sync] Syncing product ${product.title} with data:`, {
          id: productData.id,
          product_id: productData.product_id,
          parent_id: productData.parent_shopify_id,
          sku: productData.sku,
          edition_size: productData.edition_size,
          image_url: productData.image_url
        });

        // Check if product with same product_id already exists
        const { data: existingProduct } = await db
          .from("products")
          .select("id")
          .eq("product_id", productData.product_id)
          .single();

        if (existingProduct) {
          // Update existing product by product_id
          const { error: productError } = await db
            .from("products")
            .update({
              ...productData,
              id: existingProduct.id, // Keep the existing UUID
            })
            .eq("product_id", productData.product_id);
          
          if (productError) {
            console.error(`[Product Sync] Error updating product ${product.title}:`, productError);
            errorCount++;
            continue;
          }
        } else {
          // Insert new product
          const { error: productError } = await db
            .from("products")
            .insert(productData);
          
          if (productError) {
            console.error(`[Product Sync] Error inserting product ${product.title}:`, productError);
            errorCount++;
            continue;
          }
        }

        if (productError) {
          console.error(`[Product Sync] Error syncing product ${product.title}:`, productError);
          errorCount++;
          continue;
        }

        processedCount++;
      } catch (error) {
        console.error(`[Product Sync] Error processing product ${product.title}:`, error);
        errorCount++;
      }
    }

    // Log sync operation
    const syncLog = {
      type: "product_sync",
      details: {
        products_synced: processedCount,
        errors: errorCount,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
      } as Json,
    };

    const { error: logError } = await db.from("sync_logs").insert(syncLog);
    if (logError) {
      console.error("[Product Sync] Error logging sync:", logError);
    }

    return NextResponse.json({
      success: true,
      products_synced: processedCount,
      errors: errorCount,
    });
  } catch (error: any) {
    console.error("[Product Sync] Error in sync-products:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 