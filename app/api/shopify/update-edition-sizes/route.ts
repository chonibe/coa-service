import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

interface Product {
  id: string;
}

interface ShopifyMetafield {
  id: number;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

async function getProductMetafields(productId: number): Promise<ShopifyMetafield[]> {
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
    console.error(`Error fetching metafields for product ${productId}:`, error);
    return [];
  }
}

async function updateProductMetafield(productId: number, metafieldId: number | null, value: string) {
  try {
    const url = metafieldId 
      ? `https://${SHOPIFY_SHOP}/admin/api/2024-01/metafields/${metafieldId}.json`
      : `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}/metafields.json`;

    const response = await fetch(url, {
      method: metafieldId ? "PUT" : "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metafield: {
          namespace: "custom",
          key: "edition_size",
          value: value,
          type: "string"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update metafield: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating metafield for product ${productId}:`, error);
    throw error;
  }
}

export async function POST() {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized");
    }

    // Get all products with null edition sizes
    const { data: products, error } = await supabase
      .from("products")
      .select("id")
      .is("edition_size", null);

    if (error) {
      throw error;
    }

    console.log(`Found ${products?.length || 0} products with null edition sizes`);

    let updatedCount = 0;
    let errorCount = 0;

    // Update each product's metafield
    for (const product of (products as Product[]) || []) {
      try {
        // Extract the Shopify ID from the UUID
        const shopifyId = parseInt(product.id.split('-').pop() || '0', 16);
        
        if (isNaN(shopifyId)) {
          console.error(`Invalid Shopify ID for product ${product.id}`);
          errorCount++;
          continue;
        }

        // Get existing metafields
        const metafields = await getProductMetafields(shopifyId);
        const existingMetafield = metafields.find(
          m => m.namespace === 'custom' && m.key === 'edition_size'
        );

        // Update the metafield in Shopify
        await updateProductMetafield(shopifyId, existingMetafield?.id || null, "90");
        console.log(`Updated edition size for product ${shopifyId}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating product ${product.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      products_updated: updatedCount,
      errors: errorCount
    });
  } catch (error: any) {
    console.error("Error in update-edition-sizes:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 