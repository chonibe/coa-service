/**
 * Webhook Filter Evaluator
 * Evaluates server-side filters against webhook payloads
 */

export interface WebhookFilter {
  field: string // e.g., "object" or "actor.type" for nested
  operator: "equals" | "not_equals"
  value: string
}

/**
 * Evaluate a webhook filter against a payload
 * @param filter - The filter configuration
 * @param payload - The webhook payload
 * @returns true if payload matches filter, false otherwise
 */
export function evaluateWebhookFilter(
  filter: WebhookFilter | null,
  payload: any
): boolean {
  if (!filter) {
    return true // No filter means all events pass
  }

  const { field, operator, value } = filter

  // Get value from payload (support nested paths)
  let payloadValue: any
  if (field.includes(".")) {
    // Nested path (e.g., "actor.type")
    const pathParts = field.split(".")
    payloadValue = payload
    for (const part of pathParts) {
      if (payloadValue === null || payloadValue === undefined) {
        return false
      }
      payloadValue = payloadValue[part]
    }
  } else {
    // Simple field
    payloadValue = payload[field]
  }

  // Convert to string for comparison
  const payloadValueStr = String(payloadValue || "")

  // Evaluate operator
  switch (operator) {
    case "equals":
      return payloadValueStr === value
    case "not_equals":
      return payloadValueStr !== value
    default:
      console.warn(`[Webhook Filter] Unknown operator: ${operator}`)
      return false
  }
}

/**
 * Validate a webhook filter configuration
 */
export function validateWebhookFilter(filter: any): {
  valid: boolean
  error?: string
} {
  if (!filter) {
    return { valid: true } // No filter is valid
  }

  if (typeof filter !== "object") {
    return { valid: false, error: "Filter must be an object" }
  }

  if (!filter.field || typeof filter.field !== "string") {
    return { valid: false, error: "Filter must have a 'field' string property" }
  }

  if (!filter.operator || !["equals", "not_equals"].includes(filter.operator)) {
    return {
      valid: false,
      error: "Filter operator must be 'equals' or 'not_equals'",
    }
  }

  if (filter.value === undefined || filter.value === null) {
    return { valid: false, error: "Filter must have a 'value' property" }
  }

  return { valid: true }
}


