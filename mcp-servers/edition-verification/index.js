#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
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
const server = new Server({
    name: "edition-verification-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
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
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "verify_edition_number": {
                const { line_item_id, order_id } = args;
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
                const { line_item_id } = args;
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
                const { line_item_id } = args;
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
                const { product_id } = args;
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
                const { product_id, include_history = false } = args;
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
                let result = {
                    product_id,
                    total_editions: editions.length,
                    editions,
                };
                if (include_history) {
                    // Get history for each edition
                    const histories = await Promise.all(editions.map(async (edition) => {
                        const { data: events } = await supabase
                            .from("edition_events")
                            .select("*")
                            .eq("line_item_id", edition.line_item_id)
                            .order("created_at", { ascending: true });
                        return {
                            ...edition,
                            history: events || [],
                        };
                    }));
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
    }
    catch (error) {
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
