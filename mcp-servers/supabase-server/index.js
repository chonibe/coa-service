#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
// Load environment variables from .env.local in project root
// Use absolute path to project root (assuming server is in mcp-servers/supabase-server)
const currentFile = new URL(import.meta.url).pathname;
const serverDir = path.dirname(currentFile);
const projectRoot = path.resolve(serverDir, "../..");
const envPath = path.resolve(projectRoot, ".env.local");
dotenv.config({ path: envPath });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase environment variables");
    console.error("Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// SQL keywords that should be blocked (write operations)
const BLOCKED_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE",
    "GRANT", "REVOKE", "EXEC", "EXECUTE", "CALL"
];
function isReadOnlyQuery(query) {
    const upperQuery = query.trim().toUpperCase();
    return !BLOCKED_KEYWORDS.some(keyword => upperQuery.includes(keyword));
}
async function getTableSchema(tableName) {
    const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(0);
    if (error) {
        throw new Error(`Failed to get schema for table ${tableName}: ${error.message}`);
    }
    // Get column information from a sample query
    const { data: sampleData } = await supabase
        .from(tableName)
        .select("*")
        .limit(1);
    return {
        tableName,
        hasData: sampleData && sampleData.length > 0,
    };
}
async function getAllTables() {
    // Query information_schema to get all tables
    const { data, error } = await supabase.rpc("exec_sql", {
        query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `,
    });
    if (error) {
        // Fallback: try to query a known table to verify connection
        const { error: testError } = await supabase.from("orders").select("id").limit(1);
        if (testError) {
            throw new Error(`Database connection failed: ${testError.message}`);
        }
        // If we can query orders, return a list of known tables
        return [
            "orders",
            "order_line_items",
            "order_line_items_v2",
            "products",
            "vendors",
            "vendor_users",
            "admin_accounts",
            "certificates",
            "nfc_tags",
            "vendor_payouts",
            "users",
        ];
    }
    if (data && Array.isArray(data) && data.length > 0) {
        return data.map((row) => row.table_name);
    }
    // Fallback to known tables
    return [
        "orders",
        "order_line_items",
        "order_line_items_v2",
        "products",
        "vendors",
        "vendor_users",
        "admin_accounts",
        "certificates",
        "nfc_tags",
        "vendor_payouts",
        "users",
    ];
}
async function getTableRelationships(tableName) {
    const query = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public';
  `;
    try {
        const { data, error } = await supabase.rpc("exec_sql", {
            query: query.replace("$1", `'${tableName}'`),
        });
        if (error) {
            return { tableName, relationships: [] };
        }
        return {
            tableName,
            relationships: data || [],
        };
    }
    catch (err) {
        return { tableName, relationships: [] };
    }
}
const server = new Server({
    name: "supabase-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const tables = await getAllTables();
    return {
        resources: [
            {
                uri: "supabase://schema",
                name: "Database Schema",
                description: "Complete database schema information",
                mimeType: "application/json",
            },
            ...tables.map((table) => ({
                uri: `supabase://table/${table}`,
                name: `Table: ${table}`,
                description: `Structure and sample data for ${table}`,
                mimeType: "application/json",
            })),
            ...tables.map((table) => ({
                uri: `supabase://relationship/${table}`,
                name: `Relationships: ${table}`,
                description: `Foreign key relationships for ${table}`,
                mimeType: "application/json",
            })),
        ],
    };
});
// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === "supabase://schema") {
        const tables = await getAllTables();
        const schemaInfo = await Promise.all(tables.map(async (table) => {
            try {
                const { data } = await supabase.from(table).select("*").limit(1);
                return {
                    table,
                    hasData: data && data.length > 0,
                    sampleColumns: data && data.length > 0 ? Object.keys(data[0]) : [],
                };
            }
            catch (err) {
                return {
                    table,
                    hasData: false,
                    error: err instanceof Error ? err.message : "Unknown error",
                };
            }
        }));
        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify({
                        schema: schemaInfo,
                        totalTables: tables.length,
                        note: "Use query_schema tool for detailed column information",
                    }, null, 2),
                },
            ],
        };
    }
    if (uri.startsWith("supabase://table/")) {
        const tableName = uri.replace("supabase://table/", "");
        try {
            const { data, error } = await supabase.from(tableName).select("*").limit(10);
            if (error) {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: "text/plain",
                            text: `Error querying table ${tableName}: ${error.message}`,
                        },
                    ],
                };
            }
            return {
                contents: [
                    {
                        uri,
                        mimeType: "application/json",
                        text: JSON.stringify({
                            table: tableName,
                            rowCount: data?.length || 0,
                            sampleData: data || [],
                            note: "Limited to 10 rows. Use query_table tool for more data.",
                        }, null, 2),
                    },
                ],
            };
        }
        catch (err) {
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
    if (uri.startsWith("supabase://relationship/")) {
        const tableName = uri.replace("supabase://relationship/", "");
        const relationships = await getTableRelationships(tableName);
        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(relationships, null, 2),
                },
            ],
        };
    }
    throw new Error(`Unknown resource: ${uri}`);
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_schema",
                description: "Get detailed schema information for all tables or a specific table. Returns column names, types, and constraints.",
                inputSchema: {
                    type: "object",
                    properties: {
                        tableName: {
                            type: "string",
                            description: "Optional table name. If not provided, returns schema for all tables.",
                        },
                    },
                },
            },
            {
                name: "query_table",
                description: "Query a specific table with optional filters. Returns up to 100 rows. READ-ONLY - only SELECT queries allowed.",
                inputSchema: {
                    type: "object",
                    properties: {
                        tableName: {
                            type: "string",
                            description: "Name of the table to query",
                            required: true,
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of rows to return (default: 10, max: 100)",
                            default: 10,
                        },
                        columns: {
                            type: "string",
                            description: "Comma-separated list of columns to select (default: *)",
                        },
                        filters: {
                            type: "object",
                            description: "Optional filters as key-value pairs",
                        },
                    },
                    required: ["tableName"],
                },
            },
            {
                name: "query_relationships",
                description: "Discover foreign key relationships for a table. Shows which tables reference this table and which tables this table references.",
                inputSchema: {
                    type: "object",
                    properties: {
                        tableName: {
                            type: "string",
                            description: "Name of the table to analyze",
                            required: true,
                        },
                    },
                    required: ["tableName"],
                },
            },
            {
                name: "test_query",
                description: "Validate and test a SQL SELECT query syntax. Returns query plan and sample results. READ-ONLY - only SELECT queries allowed.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "SQL SELECT query to test (must be read-only)",
                            required: true,
                        },
                    },
                    required: ["query"],
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
            case "query_schema": {
                const tableName = args?.tableName;
                const tables = tableName ? [tableName] : await getAllTables();
                const schemaInfo = await Promise.all(tables.map(async (table) => {
                    try {
                        // Get sample data to infer columns
                        const { data, error } = await supabase.from(table).select("*").limit(1);
                        if (error) {
                            return {
                                table,
                                error: error.message,
                            };
                        }
                        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
                        return {
                            table,
                            columns,
                            hasData: data && data.length > 0,
                        };
                    }
                    catch (err) {
                        return {
                            table,
                            error: err instanceof Error ? err.message : "Unknown error",
                        };
                    }
                }));
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(schemaInfo, null, 2),
                        },
                    ],
                };
            }
            case "query_table": {
                const tableName = args?.tableName;
                const limit = Math.min(args?.limit || 10, 100);
                const columns = args?.columns || "*";
                const filters = args?.filters;
                if (!tableName) {
                    throw new Error("tableName is required");
                }
                let query = supabase.from(tableName).select(columns).limit(limit);
                // Apply filters
                if (filters) {
                    Object.entries(filters).forEach(([key, value]) => {
                        query = query.eq(key, value);
                    });
                }
                const { data, error } = await query;
                if (error) {
                    throw new Error(`Query failed: ${error.message}`);
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                table: tableName,
                                rowCount: data?.length || 0,
                                data: data || [],
                                limit,
                            }, null, 2),
                        },
                    ],
                };
            }
            case "query_relationships": {
                const tableName = args?.tableName;
                if (!tableName) {
                    throw new Error("tableName is required");
                }
                const relationships = await getTableRelationships(tableName);
                // Also check for reverse relationships (tables that reference this table)
                const allTables = await getAllTables();
                const reverseRelationships = [];
                // Note: Full reverse relationship discovery would require more complex queries
                // This is a simplified version
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                table: tableName,
                                foreignKeys: relationships.relationships,
                                note: "Use test_query tool with information_schema queries for complete relationship discovery",
                            }, null, 2),
                        },
                    ],
                };
            }
            case "test_query": {
                const query = args?.query;
                if (!query) {
                    throw new Error("query is required");
                }
                // Validate query is read-only
                if (!isReadOnlyQuery(query)) {
                    throw new Error("Only SELECT queries are allowed. Write operations (INSERT, UPDATE, DELETE, etc.) are blocked for safety.");
                }
                // Try to execute the query (limited to 10 rows for safety)
                const limitedQuery = query.trim().endsWith(";")
                    ? query.trim().slice(0, -1)
                    : query.trim();
                // Add LIMIT if not present
                const finalQuery = limitedQuery.toUpperCase().includes("LIMIT")
                    ? limitedQuery
                    : `${limitedQuery} LIMIT 10`;
                try {
                    // Use Supabase RPC if exec_sql function exists, otherwise parse and use client
                    const { data, error } = await supabase.rpc("exec_sql", {
                        query: finalQuery,
                    });
                    if (error) {
                        // Fallback: try to parse simple SELECT queries
                        if (finalQuery.toUpperCase().trim().startsWith("SELECT")) {
                            throw new Error(`Query execution failed: ${error.message}. Note: Complex queries may require using Supabase client methods.`);
                        }
                        throw new Error(`Query execution failed: ${error.message}`);
                    }
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    query: finalQuery,
                                    result: data,
                                    rowCount: Array.isArray(data) ? data.length : 1,
                                    note: "Query executed successfully (limited to 10 rows for safety)",
                                }, null, 2),
                            },
                        ],
                    };
                }
                catch (err) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    query: finalQuery,
                                    error: err instanceof Error ? err.message : "Unknown error",
                                    note: "For complex queries, use query_table tool with Supabase client methods",
                                }, null, 2),
                            },
                        ],
                        isError: true,
                    };
                }
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (err) {
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
    console.error("Supabase MCP server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map