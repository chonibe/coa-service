#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { determineLineItemStatus, getRefundedLineItemIds, isOrderCancelled } from "./lib/status-logic.js";
import { getFilteredCollectorEditions, deduplicateOrders, filterActiveEditions } from "./lib/collector-editions.js";
import type { ShopifyOrder, DatabaseLineItem, DataIntegrityIssue } from "./lib/types.js";

// Load environment variables from .env.local in project root
const currentFile = new URL(import.meta.url).pathname;
const serverDir = path.dirname(currentFile);
const projectRoot = path.resolve(serverDir, "../..");
const envPath = path.resolve(projectRoot, ".env.local");
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase environment variables");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const server = new Server(
  {
    name: "edition-ledger-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: verify_edition_number
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "verify_edition_number",
      description: "Verify an edition number exists and get its current state (owner, status, etc.)",
      inputSchema: {
        type: "object",
        properties: {
          line_item_id: {
            type: "string",
            description: "The line item ID to verify",
          },
          order_id: {
            type: "string",
            description: "The order ID (optional, for additional validation)",
          },
        },
        required: ["line_item_id"],
      },
    },
    {
      name: "get_edition_history",
      description: "Get complete event history for an edition (all events: assignment, authentication, transfers, etc.)",
      inputSchema: {
        type: "object",
        properties: {
          line_item_id: {
            type: "string",
            description: "The line item ID to get history for",
          },
        },
        required: ["line_item_id"],
      },
    },
    {
      name: "get_ownership_history",
      description: "Get ownership transfer history for an edition",
      inputSchema: {
        type: "object",
        properties: {
          line_item_id: {
            type: "string",
            description: "The line item ID to get ownership history for",
          },
        },
        required: ["line_item_id"],
      },
    },
    {
      name: "check_duplicates",
      description: "Check for duplicate edition numbers for a product",
      inputSchema: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            description: "The product ID to check for duplicates",
          },
        },
        required: ["product_id"],
      },
    },
    {
      name: "get_product_editions",
      description: "Get all editions for a product with their current state and history",
      inputSchema: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            description: "The product ID to get editions for",
          },
          include_history: {
            type: "boolean",
            description: "Whether to include event history for each edition (default: false)",
            default: false,
          },
        },
        required: ["product_id"],
      },
    },
    {
      name: "sync_order_line_items",
      description: "Syncs line items from a Shopify order with proper status determination using centralized business logic",
      inputSchema: {
        type: "object",
        properties: {
          order: {
            type: "object",
            description: "The complete Shopify order object (including refunds)",
          },
          skip_editions: {
            type: "boolean",
            description: "Skip edition number assignment (default: false)",
            default: false,
          },
        },
        required: ["order"],
      },
    },
    {
      name: "mark_line_item_inactive",
      description: "Explicitly marks a line item as inactive with audit trail in edition_events",
      inputSchema: {
        type: "object",
        properties: {
          line_item_id: {
            type: "string",
            description: "The line item ID to mark as inactive",
          },
          reason: {
            type: "string",
            description: "Reason for marking inactive",
            enum: ["refunded", "restocked", "removed", "manual"],
          },
          notes: {
            type: "string",
            description: "Optional additional notes",
          },
        },
        required: ["line_item_id", "reason"],
      },
    },
    {
      name: "get_collector_editions",
      description: "Returns properly filtered editions for a collector with deduplication and status checks",
      inputSchema: {
        type: "object",
        properties: {
          collector_id: {
            type: "string",
            description: "Collector identifier (email, shopify_id, or public_id)",
          },
        },
        required: ["collector_id"],
      },
    },
    {
      name: "reassign_editions",
      description: "Triggers edition number reassignment for a product using the assign_edition_numbers RPC",
      inputSchema: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            description: "The product ID to reassign edition numbers for",
          },
        },
        required: ["product_id"],
      },
    },
    {
      name: "validate_data_integrity",
      description: "Audits data for inconsistencies like refunded-but-active items, duplicates, etc.",
      inputSchema: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            description: "Optional product ID to limit validation scope",
          },
          collector_id: {
            type: "string",
            description: "Optional collector ID to limit validation scope",
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "verify_edition_number": {
        const { line_item_id, order_id } = args as { line_item_id: string; order_id?: string };
        
        let query = supabase
          .from("order_line_items_v2")
          .select("line_item_id, order_id, product_id, edition_number, edition_total, owner_name, owner_email, owner_id, status, fulfillment_status, nfc_claimed_at, created_at")
          .eq("line_item_id", line_item_id);
        
        if (order_id) {
          query = query.eq("order_id", order_id);
        }
        
        const { data, error } = await query.maybeSingle();
        
        if (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        
        if (!data) {
          return {
            content: [
              {
                type: "text",
                text: "Edition not found",
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                verified: true,
                line_item_id: data.line_item_id,
                order_id: data.order_id,
                product_id: data.product_id,
                edition_number: data.edition_number,
                edition_total: data.edition_total,
                owner: {
                  name: data.owner_name,
                  email: data.owner_email,
                  id: data.owner_id,
                },
                status: data.status,
                fulfillment_status: data.fulfillment_status,
                nfc_authenticated: data.nfc_claimed_at !== null,
                nfc_claimed_at: data.nfc_claimed_at,
                created_at: data.created_at,
              }, null, 2),
            },
          ],
        };
      }

      case "get_edition_history": {
        const { line_item_id } = args as { line_item_id: string };
        
        const { data, error } = await supabase
          .from("edition_events")
          .select("*")
          .eq("line_item_id", line_item_id)
          .order("created_at", { ascending: true });
        
        if (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                line_item_id,
                event_count: data?.length || 0,
                events: data || [],
              }, null, 2),
            },
          ],
        };
      }

      case "get_ownership_history": {
        const { line_item_id } = args as { line_item_id: string };
        
        const { data, error } = await supabase
          .from("edition_events")
          .select("*")
          .eq("line_item_id", line_item_id)
          .eq("event_type", "ownership_transfer")
          .order("created_at", { ascending: true });
        
        if (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                line_item_id,
                transfer_count: data?.length || 0,
                transfers: data || [],
              }, null, 2),
            },
          ],
        };
      }

      case "check_duplicates": {
        const { product_id } = args as { product_id: string };
        
        const { data, error } = await supabase
          .from("order_line_items_v2")
          .select("edition_number, line_item_id, order_id")
          .eq("product_id", product_id)
          .eq("status", "active")
          .not("edition_number", "is", null);
        
        if (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        
        // Check for duplicates
        const editionNumbers = (data || []).map(item => item.edition_number);
        const duplicates = editionNumbers.filter((num, index) => editionNumbers.indexOf(num) !== index);
        const uniqueDuplicates = [...new Set(duplicates)];
        
        const duplicateItems = (data || []).filter(item => uniqueDuplicates.includes(item.edition_number));
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                product_id,
                total_editions: editionNumbers.length,
                unique_editions: new Set(editionNumbers).size,
                has_duplicates: uniqueDuplicates.length > 0,
                duplicate_edition_numbers: uniqueDuplicates,
                duplicate_items: duplicateItems,
              }, null, 2),
            },
          ],
        };
      }

      case "get_product_editions": {
        const { product_id, include_history = false } = args as { product_id: string; include_history?: boolean };
        
        const { data: lineItems, error: lineItemsError } = await supabase
          .from("order_line_items_v2")
          .select("line_item_id, order_id, edition_number, edition_total, owner_name, owner_email, owner_id, status, fulfillment_status, nfc_claimed_at, created_at")
          .eq("product_id", product_id)
          .eq("status", "active")
          .not("edition_number", "is", null)
          .order("edition_number", { ascending: true });
        
        if (lineItemsError) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${lineItemsError.message}`,
              },
            ],
            isError: true,
          };
        }
        
        const editions = (lineItems || []).map(item => ({
          line_item_id: item.line_item_id,
          order_id: item.order_id,
          edition_number: item.edition_number,
          edition_total: item.edition_total,
          owner: {
            name: item.owner_name,
            email: item.owner_email,
            id: item.owner_id,
          },
          status: item.status,
          fulfillment_status: item.fulfillment_status,
          nfc_authenticated: item.nfc_claimed_at !== null,
          created_at: item.created_at,
        }));
        
        let result: any = {
          product_id,
          total_editions: editions.length,
          editions,
        };
        
        if (include_history) {
          // Get history for each edition
          const histories = await Promise.all(
            editions.map(async (edition) => {
              const { data: events } = await supabase
                .from("edition_events")
                .select("*")
                .eq("line_item_id", edition.line_item_id)
                .order("created_at", { ascending: true });
              
              return {
                ...edition,
                history: events || [],
              };
            })
          );
          
          result.editions = histories;
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "sync_order_line_items": {
        const { order, skip_editions = false } = args as { order: ShopifyOrder; skip_editions?: boolean };
        
        const orderId = order.id.toString();
        const orderName = order.name;
        
        // Get refunded line item IDs using centralized logic
        const refundedIds = getRefundedLineItemIds(order);
        
        // Process each line item with centralized status logic
        const dbLineItems: DatabaseLineItem[] = order.line_items.map((li) => {
          const statusResult = determineLineItemStatus(order, li);
          
          return {
            order_id: orderId,
            order_name: orderName,
            line_item_id: li.id.toString(),
            product_id: li.product_id?.toString() || '',
            variant_id: li.variant_id?.toString() || null,
            name: li.title,
            description: li.title,
            quantity: li.quantity,
            price: parseFloat(li.price.toString()),
            sku: li.sku || null,
            vendor_name: li.vendor || null,
            fulfillment_status: li.fulfillment_status || null,
            status: statusResult.status,
            owner_email: order.email?.toLowerCase()?.trim() || null,
            owner_name: order.customer?.first_name || order.customer?.last_name 
              ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
              : null,
            img_url: null,
            created_at: order.created_at,
            updated_at: new Date().toISOString(),
            restocked: statusResult.isRestocked,
            refund_status: statusResult.isRefunded ? 'refunded' : 'none',
          };
        });
        
        // Upsert line items to database
        const { error: liError } = await supabase
          .from('order_line_items_v2')
          .upsert(dbLineItems, { onConflict: 'line_item_id' });
        
        if (liError) {
          return {
            content: [
              {
                type: "text",
                text: `Error syncing line items: ${liError.message}`,
              },
            ],
            isError: true,
          };
        }
        
        // Assign edition numbers if not skipped
        if (!skip_editions) {
          const productIds = Array.from(new Set(dbLineItems.map(li => li.product_id).filter(Boolean)));
          
          for (const pid of productIds) {
            await supabase.rpc('assign_edition_numbers', { p_product_id: pid });
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                order_id: orderId,
                order_name: orderName,
                line_items_synced: dbLineItems.length,
                line_items: dbLineItems.map(li => ({
                  line_item_id: li.line_item_id,
                  status: li.status,
                  restocked: li.restocked,
                  refund_status: li.refund_status,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case "mark_line_item_inactive": {
        const { line_item_id, reason, notes } = args as { 
          line_item_id: string; 
          reason: 'refunded' | 'restocked' | 'removed' | 'manual';
          notes?: string;
        };
        
        // Get current state
        const { data: beforeState, error: fetchError } = await supabase
          .from('order_line_items_v2')
          .select('*')
          .eq('line_item_id', line_item_id)
          .single();
        
        if (fetchError || !beforeState) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Line item not found - ${fetchError?.message || 'Not found'}`,
              },
            ],
            isError: true,
          };
        }
        
        // Update to inactive
        const { error: updateError } = await supabase
          .from('order_line_items_v2')
          .update({ 
            status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('line_item_id', line_item_id);
        
        if (updateError) {
          return {
            content: [
              {
                type: "text",
                text: `Error updating line item: ${updateError.message}`,
              },
            ],
            isError: true,
          };
        }
        
        // Log to edition_events for audit trail (if edition exists)
        if (beforeState.product_id && beforeState.edition_number) {
          const { error: eventError } = await supabase
            .from('edition_events')
            .insert({
              line_item_id,
              product_id: beforeState.product_id,
              edition_number: beforeState.edition_number,
              event_type: 'status_changed',
              event_data: {
                reason,
                notes,
                before_status: beforeState.status,
                after_status: 'inactive',
                changed_by: 'mcp_server',
              },
              owner_name: beforeState.owner_name,
              owner_email: beforeState.owner_email,
              owner_id: beforeState.owner_id,
              status: 'inactive',
              created_at: new Date().toISOString(),
              created_by: 'mcp_server',
            });
          
          if (eventError) {
            console.error('Failed to log edition event:', eventError);
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                line_item_id,
                before_status: beforeState.status,
                after_status: 'inactive',
                reason,
                notes,
              }, null, 2),
            },
          ],
        };
      }

      case "get_collector_editions": {
        const { collector_id } = args as { collector_id: string };
        
        // Determine if it's email or ID
        const isEmail = collector_id.includes('@');
        
        // Fetch orders with line items
        let query = supabase
          .from("orders")
          .select(`
            id,
            processed_at,
            customer_email,
            customer_id,
            order_name,
            order_number,
            fulfillment_status,
            financial_status,
            order_line_items_v2 (*)
          `)
          .not("fulfillment_status", "in", "(canceled,restocked)")
          .not("financial_status", "in", "(voided,refunded)");
        
        if (isEmail) {
          query = query.ilike('customer_email', collector_id);
        } else {
          query = query.eq('customer_id', collector_id);
        }
        
        const { data: orders, error: ordersError } = await query.order("processed_at", { ascending: false });
        
        if (ordersError) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching orders: ${ordersError.message}`,
              },
            ],
            isError: true,
          };
        }
        
        // Use centralized filtering logic
        const filteredEditions = getFilteredCollectorEditions(orders || []);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                collector_id,
                total_orders: orders?.length || 0,
                total_editions: filteredEditions.length,
                editions: filteredEditions.map(li => ({
                  line_item_id: li.line_item_id,
                  product_id: li.product_id,
                  name: li.name,
                  edition_number: li.edition_number,
                  edition_total: li.edition_total,
                  status: li.status,
                  owner_email: li.owner_email,
                  owner_name: li.owner_name,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case "reassign_editions": {
        const { product_id } = args as { product_id: string };
        
        // Call the assign_edition_numbers RPC
        const { data, error } = await supabase.rpc('assign_edition_numbers', { 
          p_product_id: product_id 
        });
        
        if (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error reassigning editions: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        
        // Get count of editions assigned
        const { data: editions, error: countError } = await supabase
          .from('order_line_items_v2')
          .select('line_item_id', { count: 'exact', head: true })
          .eq('product_id', product_id)
          .eq('status', 'active')
          .not('edition_number', 'is', null);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                product_id,
                editions_assigned: editions || 0,
              }, null, 2),
            },
          ],
        };
      }

      case "validate_data_integrity": {
        const { product_id, collector_id } = args as { product_id?: string; collector_id?: string };
        
        const issues: DataIntegrityIssue[] = [];
        
        // Build query for line items
        let query = supabase
          .from('order_line_items_v2')
          .select(`
            *,
            orders!inner (
              fulfillment_status,
              financial_status
            )
          `);
        
        if (product_id) {
          query = query.eq('product_id', product_id);
        }
        
        if (collector_id) {
          const isEmail = collector_id.includes('@');
          if (isEmail) {
            query = query.ilike('owner_email', collector_id);
          } else {
            query = query.eq('owner_id', collector_id);
          }
        }
        
        const { data: lineItems, error: fetchError } = await query;
        
        if (fetchError) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${fetchError.message}`,
              },
            ],
            isError: true,
          };
        }
        
        // Check for refunded but active items
        (lineItems || []).forEach((li: any) => {
          if (li.status === 'active' && li.refund_status === 'refunded') {
            issues.push({
              type: 'refunded_but_active',
              line_item_id: li.line_item_id,
              product_id: li.product_id,
              description: `Line item ${li.line_item_id} is marked active but has refund_status='refunded'`,
              severity: 'critical',
            });
          }
          
          if (li.status === 'active' && li.restocked === true) {
            issues.push({
              type: 'status_mismatch',
              line_item_id: li.line_item_id,
              product_id: li.product_id,
              description: `Line item ${li.line_item_id} is marked active but restocked=true`,
              severity: 'critical',
            });
          }
          
          const order = (li.orders as any);
          if (li.status === 'active' && order) {
            if (['refunded', 'voided'].includes(order.financial_status)) {
              issues.push({
                type: 'status_mismatch',
                line_item_id: li.line_item_id,
                product_id: li.product_id,
                description: `Line item ${li.line_item_id} is active but order is ${order.financial_status}`,
                severity: 'critical',
              });
            }
          }
        });
        
        // Check for duplicate edition numbers
        if (product_id) {
          const activeItems = (lineItems || []).filter((li: any) => 
            li.status === 'active' && li.edition_number !== null
          );
          
          const editionMap = new Map<number, string[]>();
          activeItems.forEach((li: any) => {
            const num = li.edition_number;
            if (!editionMap.has(num)) {
              editionMap.set(num, []);
            }
            editionMap.get(num)!.push(li.line_item_id);
          });
          
          editionMap.forEach((lineItemIds, editionNum) => {
            if (lineItemIds.length > 1) {
              issues.push({
                type: 'duplicate_edition',
                product_id,
                edition_number: editionNum,
                description: `Edition #${editionNum} assigned to ${lineItemIds.length} line items: ${lineItemIds.join(', ')}`,
                severity: 'critical',
              });
            }
          });
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                issues_found: issues.length,
                issues,
                scope: {
                  product_id: product_id || 'all',
                  collector_id: collector_id || 'all',
                },
              }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Edition Verification MCP server running on stdio");
}

main().catch(console.error);

