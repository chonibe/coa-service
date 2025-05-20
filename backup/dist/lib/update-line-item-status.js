"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLineItemStatus = updateLineItemStatus;
const supabase_1 = require("@/lib/supabase");
const crypto_1 = __importDefault(require("crypto"));
if (!supabase_1.supabase) {
    throw new Error("Supabase client is not initialized");
}
/**
 * Updates the status of a line item and sets the updated_at timestamp
 */
async function updateLineItemStatus(lineItemId, orderId, status, reason) {
    try {
        const now = new Date();
        console.log(`Updating line item ${lineItemId} in order ${orderId} to status: ${status} at ${now.toISOString()}`);
        // Get the current status and product ID before updating
        const { data: currentItem, error: fetchError } = await supabase_1.supabase
            .from("order_line_items_v2")
            .select("status, product_id, created_at")
            .eq("line_item_id", lineItemId)
            .eq("order_id", orderId)
            .single();
        if (fetchError) {
            console.error("Error fetching current item status:", fetchError);
            throw fetchError;
        }
        // Prepare the update data
        const updateData = {
            status,
            updated_at: now.toISOString(),
        };
        // Add reason if provided
        if (reason) {
            updateData.removed_reason = reason;
        }
        // If marking as inactive, set edition_number to null
        if (status === "inactive") {
            updateData.edition_number = null;
        }
        console.log("Update data:", updateData);
        // Update the line item
        const { error, data } = await supabase_1.supabase
            .from("order_line_items_v2")
            .update(updateData)
            .eq("line_item_id", lineItemId)
            .eq("order_id", orderId);
        if (error) {
            console.error("Error updating line item status:", error);
            throw error;
        }
        console.log("Update successful, affected rows:", data?.length || 0);
        // Handle resequencing based on status transition
        if (currentItem && currentItem.product_id) {
            if (status === "inactive") {
                // When becoming inactive, resequence all active items
                await resequenceEditionNumbers(currentItem.product_id);
            }
            else if (status === "active" && currentItem.status === "inactive") {
                // When becoming active from inactive, resequence with the new item
                await resequenceEditionNumbersWithNewItem(currentItem.product_id, lineItemId, orderId, currentItem.created_at);
            }
        }
        return { success: true, updatedAt: now.toISOString() };
    }
    catch (error) {
        console.error("Error in updateLineItemStatus:", error);
        throw error;
    }
}
/**
 * Resequences edition numbers for a product after items have been removed or marked inactive
 */
async function resequenceEditionNumbers(productId) {
    try {
        console.log(`Resequencing edition numbers for product ${productId}`);
        // Get all active line items for this product, ordered by creation date
        const { data: activeItems, error } = await supabase_1.supabase
            .from("order_line_items_v2")
            .select("*")
            .eq("product_id", productId)
            .eq("status", "active") // Only select active items, explicitly exclude inactive/removed items
            .order("created_at", { ascending: true });
        if (error) {
            console.error("Error fetching active items for resequencing:", error);
            return;
        }
        if (!activeItems || activeItems.length === 0) {
            console.log("No active items found for resequencing");
            return;
        }
        console.log(`Found ${activeItems.length} active items to resequence`);
        // Assign new sequential edition numbers starting from 1
        let editionCounter = 1;
        for (const item of activeItems) {
            // Generate certificate URL if it doesn't exist
            const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
            const certificateUrl = `${baseUrl}/certificate/${item.line_item_id}`;
            const certificateToken = crypto_1.default.randomUUID();
            const { error: updateError } = await supabase_1.supabase
                .from("order_line_items_v2")
                .update({
                edition_number: editionCounter,
                updated_at: new Date().toISOString(),
                // Only set certificate fields if they don't exist yet
                certificate_url: item.certificate_url || certificateUrl,
                certificate_token: item.certificate_token || certificateToken,
                certificate_generated_at: item.certificate_generated_at || new Date().toISOString(),
            })
                .eq("line_item_id", item.line_item_id)
                .eq("order_id", item.order_id);
            if (updateError) {
                console.error(`Error updating edition number for item ${item.line_item_id}:`, updateError);
            }
            else {
                console.log(`Updated item ${item.line_item_id} with new edition number ${editionCounter}`);
                editionCounter++;
            }
        }
        console.log(`Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`);
    }
    catch (error) {
        console.error("Error in resequenceEditionNumbers:", error);
    }
}
/**
 * Resequences edition numbers for a product when a previously inactive item becomes active
 */
async function resequenceEditionNumbersWithNewItem(productId, lineItemId, orderId, created_at) {
    try {
        console.log(`Resequencing edition numbers for product ${productId} with new active item ${lineItemId}`);
        // Get all active line items for this product, ordered by creation date
        const { data: activeItems, error } = await supabase_1.supabase
            .from("order_line_items_v2")
            .select("*")
            .eq("product_id", productId)
            .eq("status", "active")
            .order("created_at", { ascending: true });
        if (error) {
            console.error("Error fetching active items for resequencing:", error);
            return;
        }
        if (!activeItems || activeItems.length === 0) {
            console.log("No active items found for resequencing");
            return;
        }
        console.log(`Found ${activeItems.length} active items to resequence`);
        // Assign new sequential edition numbers starting from 1
        let editionCounter = 1;
        for (const item of activeItems) {
            // Skip the item we're updating if it's not in the correct position yet
            if (item.line_item_id === lineItemId && item.created_at !== created_at) {
                continue;
            }
            // Generate certificate URL if it doesn't exist
            const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
            const certificateUrl = `${baseUrl}/certificate/${item.line_item_id}`;
            const certificateToken = crypto_1.default.randomUUID();
            const { error: updateError } = await supabase_1.supabase
                .from("order_line_items_v2")
                .update({
                edition_number: editionCounter,
                updated_at: new Date().toISOString(),
                // Only set certificate fields if they don't exist yet
                certificate_url: item.certificate_url || certificateUrl,
                certificate_token: item.certificate_token || certificateToken,
                certificate_generated_at: item.certificate_generated_at || new Date().toISOString(),
            })
                .eq("line_item_id", item.line_item_id)
                .eq("order_id", item.order_id);
            if (updateError) {
                console.error(`Error updating edition number for item ${item.line_item_id}:`, updateError);
            }
            else {
                console.log(`Updated item ${item.line_item_id} with new edition number ${editionCounter}`);
                editionCounter++;
            }
        }
        console.log(`Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`);
    }
    catch (error) {
        console.error("Error in resequenceEditionNumbersWithNewItem:", error);
    }
}
