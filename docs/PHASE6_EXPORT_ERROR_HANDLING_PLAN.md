# Phase 6: Export Functionality & Error Handling Improvements

## Overview

Improve export functionality with filter support and standardize error handling across all API endpoints to match Attio's structured error format.

## Current State

### Export Functionality
- Basic export exists but limited
- No filter application
- Limited format options
- No progress tracking

### Error Handling
- Inconsistent error formats
- No structured error codes
- Missing error documentation

## Phase 6 Implementation Plan

### 6.1 Export Functionality Enhancements

**Files to Create/Modify:**
- `app/api/crm/export/route.ts` - Enhanced export endpoint
- `lib/crm/export-utils.ts` - Export utilities
- `components/crm/export-dialog.tsx` - Export UI component

**Features:**
1. **Filter Application**
   - Apply saved views/filters to exports
   - Support all filter types (platform, status, tags, etc.)
   - Date range filtering

2. **Format Options**
   - CSV export
   - Excel export (XLSX)
   - JSON export
   - PDF export (optional)

3. **Progress Tracking**
   - Background job processing
   - Progress updates via polling or webhooks
   - Email notification when complete

4. **Export Scope**
   - Export people/contacts
   - Export companies
   - Export conversations
   - Export activities/timeline

### 6.2 Error Handling Standardization

**Files to Create/Modify:**
- `lib/crm/errors.ts` - Error definitions and utilities
- Update all API routes to use standardized errors

**Error Format:**
```json
{
  "status_code": 400,
  "type": "validation_error",
  "code": "INVALID_FILTER",
  "message": "Filter syntax is invalid",
  "details": {
    "field": "filter",
    "reason": "Unsupported operator"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Permission denied
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error
- `INVALID_FILTER` - Filter syntax error
- `MULTIPLE_MATCH_RESULTS` - Multiple records match (assert endpoints)

## Implementation Checklist

### Export Enhancements
- [ ] Create export endpoint with filter support
- [ ] Add CSV export functionality
- [ ] Add Excel export functionality
- [ ] Add JSON export functionality
- [ ] Implement progress tracking
- [ ] Create export UI component
- [ ] Add export to people/companies/conversations pages

### Error Handling
- [ ] Create error utility library
- [ ] Define all error codes
- [ ] Update all API routes to use standardized errors
- [ ] Add error documentation
- [ ] Create error code reference

## Estimated Time

- **Export Enhancements:** 4-6 hours
- **Error Handling:** 2-3 hours
- **Testing & Documentation:** 1-2 hours

**Total:** ~7-11 hours

