/**
 * Client-side Supabase helpers that use the API proxy
 * Use these functions in client components instead of direct Supabase access
 */

export async function getEditionInfo(orderId: string, lineItemId: string) {
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
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to fetch edition information")
    }

    return await response.json()
  } catch (error: any) {
    console.error("Error fetching edition info:", error)
    throw error
  }
}

export async function updateLineItemStatus(
  lineItemId: string,
  orderId: string,
  status: "active" | "inactive" | "removed",
  reason?: string,
) {
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
  } catch (error: any) {
    console.error("Error updating line item status:", error);
    throw error;
  }
}

export async function resequenceEditionNumbers(productId: string) {
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
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to resequence edition numbers")
    }

    return await response.json()
  } catch (error: any) {
    console.error("Error resequencing edition numbers:", error)
    throw error
  }
}

export async function fetchOrderLineItems(limit = 20) {
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
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to fetch order line items")
    }

    return await response.json()
  } catch (error: any) {
    console.error("Error fetching order line items:", error)
    throw error
  }
}
