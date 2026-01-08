import { createClient } from "@/lib/supabase/server"

export interface EditionEvent {
  id: number
  line_item_id: string
  product_id: string
  edition_number: number
  event_type: 'edition_assigned' | 'nfc_authenticated' | 'ownership_transfer' | 'status_changed' | 'certificate_generated' | 'edition_revoked'
  event_data: Record<string, any>
  owner_name: string | null
  owner_email: string | null
  owner_id: string | null
  fulfillment_status: string | null
  status: string | null
  created_at: string
  created_by: string | null
}

export interface EditionHistory {
  line_item_id: string
  product_id: string
  edition_number: number
  events: EditionEvent[]
  current_owner: {
    name: string | null
    email: string | null
    id: string | null
  } | null
}

/**
 * Get complete event history for an edition
 */
export async function getEditionHistory(lineItemId: string): Promise<EditionEvent[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("edition_events")
    .select("*")
    .eq("line_item_id", lineItemId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching edition history:", error)
    throw error
  }

  return (data || []) as EditionEvent[]
}

/**
 * Get current owner information from line item
 */
export async function getCurrentOwner(lineItemId: string, orderId: string): Promise<{
  name: string | null
  email: string | null
  id: string | null
} | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("order_line_items_v2")
    .select("owner_name, owner_email, owner_id")
    .eq("line_item_id", lineItemId)
    .eq("order_id", orderId)
    .maybeSingle()

  if (error) {
    console.error("Error fetching current owner:", error)
    throw error
  }

  if (!data) {
    return null
  }

  return {
    name: data.owner_name,
    email: data.owner_email,
    id: data.owner_id,
  }
}

/**
 * Get ownership transfer history for an edition
 */
export async function getOwnershipHistory(lineItemId: string): Promise<EditionEvent[]> {
  const events = await getEditionHistory(lineItemId)
  return events.filter(event => event.event_type === 'ownership_transfer')
}

/**
 * Get complete provenance information for an edition
 */
export async function getEditionProvenance(lineItemId: string, orderId: string): Promise<EditionHistory | null> {
  const supabase = createClient()

  // Get current line item info
  const { data: lineItem, error: lineItemError } = await supabase
    .from("order_line_items_v2")
    .select("line_item_id, product_id, edition_number, owner_name, owner_email, owner_id")
    .eq("line_item_id", lineItemId)
    .eq("order_id", orderId)
    .maybeSingle()

  if (lineItemError) {
    console.error("Error fetching line item:", lineItemError)
    throw lineItemError
  }

  if (!lineItem || !lineItem.edition_number) {
    return null
  }

  // Get event history
  const events = await getEditionHistory(lineItemId)

  return {
    line_item_id: lineItem.line_item_id,
    product_id: lineItem.product_id,
    edition_number: lineItem.edition_number,
    events,
    current_owner: {
      name: lineItem.owner_name,
      email: lineItem.owner_email,
      id: lineItem.owner_id,
    },
  }
}

/**
 * Verify edition integrity by checking event history
 * Returns true if edition appears to be intact (has assignment and authentication events)
 */
export async function verifyEditionIntegrity(lineItemId: string): Promise<{
  is_valid: boolean
  has_assignment: boolean
  has_authentication: boolean
  event_count: number
  issues: string[]
}> {
  const events = await getEditionHistory(lineItemId)
  
  const has_assignment = events.some(e => e.event_type === 'edition_assigned')
  const has_authentication = events.some(e => e.event_type === 'nfc_authenticated')
  
  const issues: string[] = []
  if (!has_assignment) {
    issues.push("Edition assignment event not found")
  }
  if (!has_authentication) {
    issues.push("NFC authentication event not found")
  }

  return {
    is_valid: has_assignment && has_authentication && issues.length === 0,
    has_assignment,
    has_authentication,
    event_count: events.length,
    issues,
  }
}

