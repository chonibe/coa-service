"use strict";
/**
 * Client-side Supabase helpers that use the API proxy
 * Use these functions in client components instead of direct Supabase access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEditionInfo = getEditionInfo;
exports.updateLineItemStatus = updateLineItemStatus;
exports.resequenceEditionNumbers = resequenceEditionNumbers;
exports.fetchOrderLineItems = fetchOrderLineItems;
async function getEditionInfo(orderId, lineItemId) {
    try {
        const response = await fetch("/api/supabase-proxy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "getEditionInfo",
                params: { orderId, lineItemId },
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch edition information");
        }
        return await response.json();
    }
    catch (error) {
        console.error("Error fetching edition info:", error);
        throw error;
    }
}
async function updateLineItemStatus(lineItemId, orderId, status, reason) {
    try {
        const response = await fetch("/api/update-line-item-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                lineItemId,
                orderId,
                status,
                reason,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update item status");
        }
        return await response.json();
    }
    catch (error) {
        console.error("Error updating line item status:", error);
        throw error;
    }
}
async function resequenceEditionNumbers(productId) {
    try {
        const response = await fetch("/api/supabase-proxy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "resequenceEditionNumbers",
                params: { productId },
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to resequence edition numbers");
        }
        return await response.json();
    }
    catch (error) {
        console.error("Error resequencing edition numbers:", error);
        throw error;
    }
}
async function fetchOrderLineItems(limit = 20) {
    try {
        const response = await fetch("/api/supabase-proxy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "fetchOrderLineItems",
                params: { limit },
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch order line items");
        }
        return await response.json();
    }
    catch (error) {
        console.error("Error fetching order line items:", error);
        throw error;
    }
}
