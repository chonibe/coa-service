/**
 * Path Filter Resolver
 * Handles path-based filtering for related record attributes
 * 
 * Example: Filter people by their company's industry
 * { "path": [["people", "company"], ["companies", "industry"]], "$eq": "Technology" }
 */

export interface PathFilter {
  path: Array<[string, string]> // [["people", "company"], ["companies", "industry"]]
  [operator: string]: any // $eq, $contains, etc.
}

/**
 * Known relationship mappings
 * Maps entity types to their relationship fields
 */
const RELATIONSHIP_MAP: Record<string, Record<string, string>> = {
  people: {
    company: "company_id", // people.company -> company_id foreign key
  },
  companies: {
    team: "company_id", // companies.team -> people with company_id
  },
}

/**
 * Resolve a path filter to determine the query structure needed
 */
export function resolvePathFilter(pathFilter: PathFilter): {
  sourceEntity: string
  targetEntity: string
  targetField: string
  relationshipField: string
  operators: Record<string, any>
} | null {
  if (!pathFilter.path || !Array.isArray(pathFilter.path) || pathFilter.path.length === 0) {
    return null
  }

export function hasPathFilters(filters: any): boolean {
  if (!filters || typeof filters !== "object") return false
  if (Array.isArray(filters)) return filters.some(hasPathFilters)
  if (filters.path) return true
  return Object.values(filters).some(hasPathFilters)
}

  const path = pathFilter.path
  const sourceEntity = path[0][0] // e.g., "people"
  const relationshipName = path[0][1] // e.g., "company"
  const targetEntity = path[path.length - 1][0] // e.g., "companies"
  const targetField = path[path.length - 1][1] // e.g., "industry"

  // Get the relationship field name
  const relationshipField = RELATIONSHIP_MAP[sourceEntity]?.[relationshipName]
  if (!relationshipField) {
    console.warn(`[Path Filter] Unknown relationship: ${sourceEntity}.${relationshipName}`)
    return null
  }

  // Extract operators (everything except 'path')
  const operators: Record<string, any> = {}
  for (const [key, value] of Object.entries(pathFilter)) {
    if (key !== "path") {
      operators[key] = value
    }
  }

  return {
    sourceEntity,
    targetEntity,
    targetField,
    relationshipField,
    operators,
  }
}

/**
 * Check if a filter contains path-based filters
 */
export function hasPathFilters(filter: any): boolean {
  if (!filter || typeof filter !== "object") {
    return false
  }

  // Check if any field has a "path" property
  for (const value of Object.values(filter)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      if ("path" in value && Array.isArray(value.path)) {
        return true
      }
      // Recursively check nested objects
      if (hasPathFilters(value)) {
        return true
      }
    }
  }

  // Check $and and $or arrays
  if ("$and" in filter && Array.isArray(filter.$and)) {
    return filter.$and.some((cond: any) => hasPathFilters(cond))
  }
  if ("$or" in filter && Array.isArray(filter.$or)) {
    return filter.$or.some((cond: any) => hasPathFilters(cond))
  }

  return false
}

/**
 * Apply path-based filter using Supabase query
 * This uses a subquery approach for path filtering
 */
export async function applyPathFilter(
  query: any,
  pathFilter: PathFilter,
  supabase: any
): Promise<any> {
  const resolved = resolvePathFilter(pathFilter)
  if (!resolved) {
    return query
  }

  const { sourceEntity, targetEntity, targetField, relationshipField, operators } = resolved

  // Build a subquery to find matching target records
  // For example: Find companies where industry = "Technology"
  let targetQuery = supabase.from(`crm_${targetEntity}`).select("id")

  // Apply operators to target query
  for (const [operator, value] of Object.entries(operators)) {
    if (operator === "$eq") {
      targetQuery = targetQuery.eq(targetField, value)
    } else if (operator === "$contains") {
      targetQuery = targetQuery.ilike(targetField, `%${value}%`)
    } else if (operator === "$starts_with") {
      targetQuery = targetQuery.ilike(targetField, `${value}%`)
    } else if (operator === "$ends_with") {
      targetQuery = targetQuery.ilike(targetField, `%${value}`)
    } else if (operator === "$in" && Array.isArray(value)) {
      targetQuery = targetQuery.in(targetField, value)
    } else if (operator === "$gt") {
      targetQuery = targetQuery.gt(targetField, value)
    } else if (operator === "$gte") {
      targetQuery = targetQuery.gte(targetField, value)
    } else if (operator === "$lt") {
      targetQuery = targetQuery.lt(targetField, value)
    } else if (operator === "$lte") {
      targetQuery = targetQuery.lte(targetField, value)
    }
  }

  // Execute subquery to get matching IDs
  const { data: matchingTargets, error } = await targetQuery

  if (error) {
    console.error("[Path Filter] Error in subquery:", error)
    return query
  }

  if (!matchingTargets || matchingTargets.length === 0) {
    // No matches, return query that will return no results
    return query.in("id", [])
  }

  const targetIds = matchingTargets.map((t: any) => t.id)

  // Filter source records by relationship field
  // For example: Filter people where company_id IN (matching company IDs)
  return query.in(relationshipField, targetIds)
}


