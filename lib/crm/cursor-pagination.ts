/**
 * Cursor-Based Pagination
 * Implements Attio-style cursor pagination for better performance with large datasets
 */

export interface Cursor {
  id: string
  sortValue?: any // The value of the sort field for this record
  sortField?: string // The field being sorted by
  sortDirection?: "asc" | "desc"
}

/**
 * Encode a cursor to a base64 string
 * @param cursor - The cursor object to encode
 * @returns Base64 encoded cursor string
 */
export function encodeCursor(cursor: Cursor): string {
  const json = JSON.stringify(cursor)
  return Buffer.from(json).toString("base64url")
}

/**
 * Decode a cursor from a base64 string
 * @param cursorString - The base64 encoded cursor string
 * @returns Decoded cursor object or null if invalid
 */
export function decodeCursor(cursorString: string): Cursor | null {
  try {
    const json = Buffer.from(cursorString, "base64url").toString("utf-8")
    return JSON.parse(json) as Cursor
  } catch (error) {
    console.error("[CRM] Error decoding cursor:", error)
    return null
  }
}

/**
 * Generate a cursor from the last record in a result set
 * @param lastRecord - The last record from the current page
 * @param sortConfig - The sort configuration used for this query
 * @returns Encoded cursor string
 */
export function generateCursor(
  lastRecord: any,
  sortConfig?: Array<{ field: string; direction: "asc" | "desc" }>
): string | null {
  if (!lastRecord || !lastRecord.id) {
    return null
  }

  const cursor: Cursor = {
    id: lastRecord.id,
  }

  // If sorting is specified, include sort value
  if (sortConfig && sortConfig.length > 0) {
    const firstSort = sortConfig[0]
    cursor.sortField = firstSort.field
    cursor.sortDirection = firstSort.direction
    cursor.sortValue = lastRecord[firstSort.field]
  }

  return encodeCursor(cursor)
}

/**
 * Build a Supabase query with cursor-based pagination
 * Note: This is a helper that returns query modifications
 * The actual query building happens in the API routes
 */
export interface CursorPaginationOptions {
  cursor?: string | null
  limit: number
  sortConfig?: Array<{ field: string; direction: "asc" | "desc" }>
}

/**
 * Get the cursor value for pagination
 * Returns the decoded cursor or null
 */
export function getCursorForPagination(cursorString?: string | null): Cursor | null {
  if (!cursorString) {
    return null
  }
  return decodeCursor(cursorString)
}

/**
 * Apply cursor-based filtering to a query
 * This modifies the query to start from the cursor position
 * Note: Supabase query builder limitations mean we use a simpler approach
 * For complex sorting, we'll use ID-based pagination
 */
export function applyCursorToQuery(
  query: any,
  cursor: Cursor | null,
  sortConfig?: Array<{ field: string; direction: "asc" | "desc" }>
): any {
  if (!cursor || !cursor.id) {
    return query
  }

  // For now, use ID-based cursor pagination
  // This works well when sorting by ID or when ID is part of the sort
  // For more complex cases, we'd need RPC functions
  
  // If sorting by ID or no sort specified, use simple ID comparison
  if (!sortConfig || sortConfig.length === 0 || sortConfig[0].field === "id") {
    const direction = sortConfig?.[0]?.direction || "desc"
    if (direction === "asc") {
      query = query.gt("id", cursor.id)
    } else {
      query = query.lt("id", cursor.id)
    }
  } else {
    // For other sorts, use ID as tiebreaker
    // This is a simplified approach - full implementation would need RPC
    const direction = sortConfig[0].direction
    if (direction === "asc") {
      query = query.gt("id", cursor.id)
    } else {
      query = query.lt("id", cursor.id)
    }
  }

  return query
}

/**
 * Response format for cursor-paginated endpoints
 */
export interface CursorPaginatedResponse<T> {
  data: T[]
  next_cursor: string | null
  limit: number
  has_more: boolean
}

/**
 * Create a cursor-paginated response
 */
export function createCursorResponse<T>(
  data: T[],
  limit: number,
  sortConfig?: Array<{ field: string; direction: "asc" | "desc" }>
): CursorPaginatedResponse<T> {
  const hasMore = data.length > limit
  const actualData = hasMore ? data.slice(0, limit) : data
  const lastRecord = actualData.length > 0 ? actualData[actualData.length - 1] : null

  const nextCursor = lastRecord ? generateCursor(lastRecord, sortConfig) : null

  return {
    data: actualData,
    next_cursor: nextCursor,
    limit,
    has_more: hasMore,
  }
}

