# CRM API Error Codes Reference

This document provides a comprehensive reference for all error codes used in the CRM API, matching Attio's structured error format.

## Error Response Format

All errors follow this standardized structure:

```json
{
  "status_code": 400,
  "type": "validation_error",
  "code": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "details": {
    "field": "email",
    "reason": "Must be a valid email address"
  }
}
```

## Error Types

### 1. VALIDATION_ERROR
**Status Code:** 400  
**Type:** `validation_error`  
**Description:** Input validation failed

**Common Scenarios:**
- Missing required fields
- Invalid data format (email, phone, etc.)
- Value out of acceptable range
- Invalid JSON format

**Example:**
```json
{
  "status_code": 400,
  "type": "validation_error",
  "code": "VALIDATION_ERROR",
  "message": "Email is required",
  "details": {
    "field": "email",
    "reason": "Field cannot be empty"
  }
}
```

### 2. NOT_FOUND
**Status Code:** 404  
**Type:** `not_found`  
**Description:** Resource not found

**Common Scenarios:**
- Person/Company/Conversation not found
- Invalid ID provided
- Resource was deleted

**Example:**
```json
{
  "status_code": 404,
  "type": "not_found",
  "code": "NOT_FOUND",
  "message": "Person not found"
}
```

### 3. UNAUTHORIZED
**Status Code:** 401  
**Type:** `unauthorized`  
**Description:** Authentication required

**Common Scenarios:**
- Missing authentication token
- Invalid or expired token
- Token verification failed

**Example:**
```json
{
  "status_code": 401,
  "type": "unauthorized",
  "code": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### 4. FORBIDDEN
**Status Code:** 403  
**Type:** `forbidden`  
**Description:** Permission denied

**Common Scenarios:**
- Insufficient permissions for action
- Workspace access denied
- Role-based access control violation

**Example:**
```json
{
  "status_code": 403,
  "type": "forbidden",
  "code": "FORBIDDEN",
  "message": "Permission denied: You don't have access to manage tags"
}
```

### 5. RATE_LIMIT_EXCEEDED
**Status Code:** 429  
**Type:** `rate_limit_exceeded`  
**Description:** Too many requests

**Common Scenarios:**
- API rate limit exceeded
- Too many requests per minute/hour
- Client-side rate limiting triggered

**Example:**
```json
{
  "status_code": 429,
  "type": "rate_limit_exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded",
  "details": {
    "retry_after": 60
  }
}
```

**Note:** Check `Retry-After` header for seconds to wait before retrying.

### 6. INVALID_FILTER
**Status Code:** 400  
**Type:** `invalid_filter`  
**Description:** Filter syntax is invalid

**Common Scenarios:**
- Unsupported filter operator
- Invalid filter path
- Malformed filter JSON
- Filter validation failed

**Example:**
```json
{
  "status_code": 400,
  "type": "invalid_filter",
  "code": "INVALID_FILTER",
  "message": "Invalid filter: Unsupported operator '$unknown'",
  "details": {
    "field": "filter",
    "reason": "Operator '$unknown' is not supported"
  }
}
```

### 7. MULTIPLE_MATCH_RESULTS
**Status Code:** 409  
**Type:** `multiple_match_results`  
**Description:** Multiple records match the criteria

**Common Scenarios:**
- Assert endpoint finds multiple matches
- Ambiguous unique identifier
- Duplicate records exist

**Example:**
```json
{
  "status_code": 409,
  "type": "multiple_match_results",
  "code": "MULTIPLE_MATCH_RESULTS",
  "message": "Multiple records match the criteria (3 found)",
  "details": {
    "match_count": 3
  }
}
```

### 8. CONFLICT
**Status Code:** 409  
**Type:** `conflict`  
**Description:** Resource conflict

**Common Scenarios:**
- Tag name already exists
- Email already in use
- Unique constraint violation
- Duplicate entry

**Example:**
```json
{
  "status_code": 409,
  "type": "conflict",
  "code": "CONFLICT",
  "message": "Email already exists",
  "details": {
    "field": "email"
  }
}
```

### 9. BAD_REQUEST
**Status Code:** 400  
**Type:** `bad_request`  
**Description:** Bad request

**Common Scenarios:**
- Invalid request format
- Missing required parameters
- Malformed request body

**Example:**
```json
{
  "status_code": 400,
  "type": "bad_request",
  "code": "BAD_REQUEST",
  "message": "Invalid request format"
}
```

### 10. INTERNAL_SERVER_ERROR
**Status Code:** 500  
**Type:** `internal_server_error`  
**Description:** Internal server error

**Common Scenarios:**
- Database connection failed
- Unexpected error occurred
- Server-side processing error

**Example:**
```json
{
  "status_code": 500,
  "type": "internal_server_error",
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error"
}
```

## Error Handling Best Practices

### Client-Side Handling

1. **Check Status Code First**
   ```typescript
   if (response.status === 401) {
     // Handle authentication error
   } else if (response.status === 429) {
     // Handle rate limit - check Retry-After header
   }
   ```

2. **Parse Error Response**
   ```typescript
   const error = await response.json()
   console.error(`Error ${error.code}: ${error.message}`)
   if (error.details) {
     console.error('Details:', error.details)
   }
   ```

3. **Handle Specific Error Codes**
   ```typescript
   switch (error.code) {
     case 'VALIDATION_ERROR':
       // Show field-specific validation errors
       break
     case 'NOT_FOUND':
       // Show "not found" message
       break
     case 'RATE_LIMIT_EXCEEDED':
       // Implement retry logic with backoff
       break
   }
   ```

### Rate Limiting

When receiving `RATE_LIMIT_EXCEEDED`:
- Check `Retry-After` header for wait time
- Implement exponential backoff
- Reduce request frequency
- Consider batching requests

### Filter Errors

When receiving `INVALID_FILTER`:
- Check `details.field` for which filter field is invalid
- Review `details.reason` for specific issue
- Validate filter syntax before sending
- Use filter builder UI to avoid syntax errors

## Error Code Quick Reference

| Code | Status | Type | Description |
|------|--------|------|-------------|
| `VALIDATION_ERROR` | 400 | validation_error | Input validation failed |
| `NOT_FOUND` | 404 | not_found | Resource not found |
| `UNAUTHORIZED` | 401 | unauthorized | Authentication required |
| `FORBIDDEN` | 403 | forbidden | Permission denied |
| `RATE_LIMIT_EXCEEDED` | 429 | rate_limit_exceeded | Too many requests |
| `INVALID_FILTER` | 400 | invalid_filter | Filter syntax is invalid |
| `MULTIPLE_MATCH_RESULTS` | 409 | multiple_match_results | Multiple records match |
| `CONFLICT` | 409 | conflict | Resource conflict |
| `BAD_REQUEST` | 400 | bad_request | Bad request |
| `INTERNAL_SERVER_ERROR` | 500 | internal_server_error | Server error |

## Implementation Status

✅ **Standardized Error Format** - All errors use consistent structure  
✅ **Error Utility Library** - `lib/crm/errors.ts` provides error creators  
✅ **Applied to Key Endpoints** - People, Companies, Export APIs  
🔄 **In Progress** - Applying to remaining endpoints

## Migration Guide

To update an endpoint to use standardized errors:

1. Import the Errors utility:
   ```typescript
   import { Errors } from "@/lib/crm/errors"
   ```

2. Replace error responses:
   ```typescript
   // Before
   return NextResponse.json({ error: "Not found" }, { status: 404 })
   
   // After
   return NextResponse.json(Errors.notFound("Person"), { status: 404 })
   ```

3. Handle specific error cases:
   ```typescript
   if (error.code === "23505") {
     return NextResponse.json(
       Errors.conflict("Email already exists", { field: "email" }),
       { status: 409 }
     )
   }
   ```



