"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
function createClient(cookieStore) {
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
        },
        global: {
            headers: { "Content-Type": "application/json" },
        },
    });
}
