/**
 * Attio-style Filter Parser
 * Converts Attio filter syntax to Supabase query filters
 * 
 * Supports:
 * - Shorthand: { email: "value" }
 * - Verbose: { email: { $contains: "value" } }
 * - Logical operators: { $and: [...], $or: [...] }
 * - Operators: $eq, $ne, $contains, $starts_with, $ends_with, $not_empty, $empty, $gt, $gte, $lt, $lte, $in, $not_in
 */

type FilterValue = string | number | boolean | null | FilterObject | FilterValue[];
type FilterObject = {
  [key: string]: FilterValue | {
    $eq?: FilterValue;
    $ne?: FilterValue;
    $contains?: string;
    $starts_with?: string;
    $ends_with?: string;
    $not_empty?: boolean;
    $empty?: boolean;
    $gt?: number | string;
    $gte?: number | string;
    $lt?: number | string;
    $lte?: number | string;
    $in?: FilterValue[];
    $not_in?: FilterValue[];
  } | {
    $and?: FilterObject[];
    $or?: FilterObject[];
    $not?: FilterObject;
  };
};

interface SupabaseQuery {
  [key: string]: any;
}

/**
 * Parse Attio-style filter into Supabase query conditions
 */
export function parseFilter(filter: FilterObject | null | undefined, baseQuery: any): any {
  if (!filter || Object.keys(filter).length === 0) {
    return baseQuery;
  }

  // Handle logical operators first
  if ('$and' in filter) {
    return parseLogicalOperator('$and', filter.$and as FilterObject[], baseQuery);
  }
  
  if ('$or' in filter) {
    return parseLogicalOperator('$or', filter.$or as FilterObject[], baseQuery);
  }
  
  if ('$not' in filter) {
    // Supabase doesn't have direct $not, so we'll need to handle this differently
    // For now, we'll skip $not and log a warning
    console.warn('$not operator not yet fully supported');
    return baseQuery;
  }

  // Process individual field filters
  let query = baseQuery;
  
  for (const [field, condition] of Object.entries(filter)) {
    if (field.startsWith('$')) {
      continue; // Skip logical operators already handled
    }

    query = applyFieldFilter(query, field, condition);
  }

  return query;
}

function parseLogicalOperator(
  operator: '$and' | '$or',
  conditions: FilterObject[],
  baseQuery: any
): any {
  if (operator === '$and') {
    // For $and, we apply all conditions sequentially
    let query = baseQuery;
    for (const condition of conditions) {
      query = parseFilter(condition, query);
    }
    return query;
  } else if (operator === '$or') {
    // For $or, Supabase uses .or() method
    const orConditions = conditions.map(cond => {
      // Convert each condition to a filter string
      return buildOrCondition(cond);
    }).filter(Boolean);
    
    if (orConditions.length > 0) {
      return baseQuery.or(orConditions.join(','));
    }
  }
  
  return baseQuery;
}

function buildOrCondition(condition: FilterObject): string {
  const parts: string[] = [];
  
  for (const [field, value] of Object.entries(condition)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if ('$eq' in value) {
        parts.push(`${field}.eq.${value.$eq}`);
      } else if ('$contains' in value) {
        parts.push(`${field}.ilike.%${value.$contains}%`);
      } else if ('$starts_with' in value) {
        parts.push(`${field}.ilike.${value.$starts_with}%`);
      } else if ('$ends_with' in value) {
        parts.push(`${field}.ilike.%${value.$ends_with}`);
      } else if ('$not_empty' in value && value.$not_empty) {
        parts.push(`${field}.not.is.null`);
      } else if ('$empty' in value && value.$empty) {
        parts.push(`${field}.is.null`);
      } else if ('$gt' in value) {
        parts.push(`${field}.gt.${value.$gt}`);
      } else if ('$gte' in value) {
        parts.push(`${field}.gte.${value.$gte}`);
      } else if ('$lt' in value) {
        parts.push(`${field}.lt.${value.$lt}`);
      } else if ('$lte' in value) {
        parts.push(`${field}.lte.${value.$lte}`);
      } else if ('$in' in value && Array.isArray(value.$in)) {
        parts.push(`${field}.in.(${value.$in.join(',')})`);
      }
    } else {
      // Shorthand: direct value means equality
      parts.push(`${field}.eq.${value}`);
    }
  }
  
  return parts.join(',');
}

function applyFieldFilter(query: any, field: string, condition: any): any {
  // Handle nested field paths (e.g., "name.first_name")
  const fieldPath = field.split('.');
  const actualField = fieldPath[fieldPath.length - 1];

  // If condition is a direct value (shorthand), treat as $eq
  if (typeof condition !== 'object' || condition === null || Array.isArray(condition)) {
    return query.eq(actualField, condition);
  }

  // Handle operators
  if ('$eq' in condition) {
    return query.eq(actualField, condition.$eq);
  }
  
  if ('$ne' in condition) {
    return query.neq(actualField, condition.$ne);
  }
  
  if ('$contains' in condition) {
    return query.ilike(actualField, `%${condition.$contains}%`);
  }
  
  if ('$starts_with' in condition) {
    return query.ilike(actualField, `${condition.$starts_with}%`);
  }
  
  if ('$ends_with' in condition) {
    return query.ilike(actualField, `%${condition.$ends_with}`);
  }
  
  if ('$not_empty' in condition && condition.$not_empty) {
    return query.not(actualField, 'is', null);
  }
  
  if ('$empty' in condition && condition.$empty) {
    return query.is(actualField, null);
  }
  
  if ('$gt' in condition) {
    return query.gt(actualField, condition.$gt);
  }
  
  if ('$gte' in condition) {
    return query.gte(actualField, condition.$gte);
  }
  
  if ('$lt' in condition) {
    return query.lt(actualField, condition.$lt);
  }
  
  if ('$lte' in condition) {
    return query.lte(actualField, condition.$lte);
  }
  
  if ('$in' in condition && Array.isArray(condition.$in)) {
    return query.in(actualField, condition.$in);
  }
  
  if ('$not_in' in condition && Array.isArray(condition.$not_in)) {
    // Supabase doesn't have direct $not_in, so we'll need to use .not() with .in()
    // This is a limitation - we might need to handle this differently
    return query.not(actualField, 'in', `(${condition.$not_in.join(',')})`);
  }

  return query;
}

/**
 * Validate filter structure
 */
export function validateFilter(filter: any): { valid: boolean; error?: string } {
  if (!filter || typeof filter !== 'object') {
    return { valid: false, error: 'Filter must be an object' };
  }

  // Check for valid operators
  const validOperators = [
    '$eq', '$ne', '$contains', '$starts_with', '$ends_with',
    '$not_empty', '$empty', '$gt', '$gte', '$lt', '$lte', '$in', '$not_in',
    '$and', '$or', '$not'
  ];

  function checkObject(obj: any, path: string = ''): { valid: boolean; error?: string } {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) {
        if (!validOperators.includes(key)) {
          return { valid: false, error: `Invalid operator: ${key} at ${path}` };
        }
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const result = checkObject(value, path ? `${path}.${key}` : key);
        if (!result.valid) {
          return result;
        }
      }
    }

    return { valid: true };
  }

  return checkObject(filter);
}

