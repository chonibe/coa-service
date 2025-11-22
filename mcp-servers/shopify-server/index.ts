#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local in project root
// Use absolute path to project root (assuming server is in mcp-servers/shopify-server)
const currentFile = new URL(import.meta.url).pathname;
const serverDir = path.dirname(currentFile);
const projectRoot = path.resolve(serverDir, "../..");
const envPath = path.resolve(projectRoot, ".env.local");
dotenv.config({ path: envPath });

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
  console.error("Missing Shopify environment variables");
  console.error("Required: SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN");
  process.exit(1);
}

// Rate limiting state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests (2 requests per second max)

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shopifyFetch(endpoint: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();

  const fullUrl = endpoint.startsWith("https")
    ? endpoint
    : `https://${SHOPIFY_SHOP}/admin/api/2024-01/${endpoint}`;

  if (!SHOPIFY_ACCESS_TOKEN) {
    throw new Error("SHOPIFY_ACCESS_TOKEN is not set");
  }

  const headers: Record<string, string> = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Enforce read-only: only allow GET requests
  if (options.method && options.method !== "GET") {
    throw new Error("Only GET requests are allowed. This is a read-only MCP server.");
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      method: "GET", // Force GET
      headers,
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "2", 10);
      if (retries > 0) {
        await delay(retryAfter * 1000);
        return shopifyFetch(endpoint, options, retries - 1);
      }
      throw new Error(`Rate limited by Shopify API. Retry after ${retryAfter} seconds.`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    return response;
  } catch (error) {
    if (retries > 0 && error instanceof Error && !error.message.includes("Rate limited")) {
      await delay(1000);
      return shopifyFetch(endpoint, options, retries - 1);
    }
    throw error;
  }
}

async function getProducts(limit = 50, pageInfo?: string): Promise<any> {
  let url = `products.json?limit=${Math.min(limit, 250)}&status=active`;
  if (pageInfo) {
    url += `&page_info=${pageInfo}`;
  }

  const response = await shopifyFetch(url);
  const data = await response.json();

  return {
    products: data.products || [],
    hasNextPage: !!response.headers.get("Link")?.includes('rel="next"'),
    linkHeader: response.headers.get("Link"),
  };
}

async function getProduct(productId: string): Promise<any> {
  const response = await shopifyFetch(`products/${productId}.json`);
  const data = await response.json();
  return data.product || null;
}

async function getProductMetafields(productId: string): Promise<any[]> {
  try {
    const response = await shopifyFetch(`products/${productId}/metafields.json`);
    const data = await response.json();
    return data.metafields || [];
  } catch (error) {
    return [];
  }
}

async function getOrders(limit = 50, status = "any"): Promise<any> {
  const response = await shopifyFetch(`orders.json?limit=${Math.min(limit, 250)}&status=${status}`);
  const data = await response.json();
  return {
    orders: data.orders || [],
    count: data.orders?.length || 0,
  };
}

const server = new Server(
  {
    name: "shopify-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "shopify://products",
        name: "Products Catalog",
        description: "Overview of all products in the Shopify store",
        mimeType: "application/json",
      },
      {
        uri: "shopify://orders",
        name: "Orders Overview",
        description: "Overview of recent orders",
        mimeType: "application/json",
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "shopify://products") {
    try {
      const result = await getProducts(10);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                productCount: result.products.length,
                products: result.products.map((p: any) => ({
                  id: p.id,
                  title: p.title,
                  handle: p.handle,
                  vendor: p.vendor,
                  product_type: p.product_type,
                  status: p.status,
                  variants_count: p.variants?.length || 0,
                })),
                note: "Limited to 10 products. Use get_products tool for more data.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
        ],
      };
    }
  }

  if (uri === "shopify://orders") {
    try {
      const result = await getOrders(10);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                orderCount: result.count,
                orders: result.orders.map((o: any) => ({
                  id: o.id,
                  order_number: o.order_number,
                  name: o.name,
                  email: o.email,
                  financial_status: o.financial_status,
                  fulfillment_status: o.fulfillment_status,
                  total_price: o.total_price,
                  created_at: o.created_at,
                })),
                note: "Limited to 10 orders. Use get_orders tool for more data.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
        ],
      };
    }
  }

  if (uri.startsWith("shopify://product/")) {
    const productId = uri.replace("shopify://product/", "");
    try {
      const product = await getProduct(productId);
      if (!product) {
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: `Product ${productId} not found`,
            },
          ],
        };
      }

      const metafields = await getProductMetafields(productId);

      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                product,
                metafields,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_products",
        description: "List products from Shopify store with pagination support. READ-ONLY operation.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of products to return (default: 50, max: 250)",
              default: 50,
            },
            pageInfo: {
              type: "string",
              description: "Pagination token from previous request (optional)",
            },
          },
        },
      },
      {
        name: "get_product",
        description: "Get detailed information about a specific product by ID. Includes variants, images, and metafields. READ-ONLY operation.",
        inputSchema: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "Shopify product ID",
              required: true,
            },
          },
          required: ["productId"],
        },
      },
      {
        name: "get_product_metafields",
        description: "Get metafields for a specific product. READ-ONLY operation.",
        inputSchema: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "Shopify product ID",
              required: true,
            },
          },
          required: ["productId"],
        },
      },
      {
        name: "get_orders",
        description: "List orders from Shopify store. Limited to recent orders. READ-ONLY operation.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of orders to return (default: 50, max: 250)",
              default: 50,
            },
            status: {
              type: "string",
              description: "Order status filter: any, open, closed, cancelled (default: any)",
              default: "any",
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_products": {
        const limit = Math.min((args?.limit as number) || 50, 250);
        const pageInfo = args?.pageInfo as string | undefined;

        const result = await getProducts(limit, pageInfo);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  products: result.products,
                  count: result.products.length,
                  hasNextPage: result.hasNextPage,
                  linkHeader: result.linkHeader,
                  note: "Use pageInfo from linkHeader for pagination",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_product": {
        const productId = args?.productId as string;

        if (!productId) {
          throw new Error("productId is required");
        }

        const product = await getProduct(productId);
        const metafields = await getProductMetafields(productId);

        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  product,
                  metafields,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_product_metafields": {
        const productId = args?.productId as string;

        if (!productId) {
          throw new Error("productId is required");
        }

        const metafields = await getProductMetafields(productId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  productId,
                  metafields,
                  count: metafields.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_orders": {
        const limit = Math.min((args?.limit as number) || 50, 250);
        const status = (args?.status as string) || "any";

        const result = await getOrders(limit, status);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  orders: result.orders,
                  count: result.count,
                  status,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Shopify MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

