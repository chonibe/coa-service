# Authentication Error Handling

## Overview
Comprehensive authentication error handling system that catches auth failures and gracefully redirects users to login with informative error messages.

## Version
- **Version**: 1.0.0
- **Date**: January 25, 2026
- **Status**: ✅ Implemented

## Purpose
Prevent 500 errors and application crashes due to authentication failures by implementing a robust error handling system with fallback mechanisms.

## Implementation

### Core Component: `lib/auth-error-handler.ts`

**Features**:
- Detects authentication errors from Supabase
- Provides user-friendly error messages
- Redirects to login with error context
- Preserves return URL for post-login redirect
- Logging for debugging

**Key Functions**:

1. **`isAuthError(error)`**: Identifies auth-related errors
2. **`handleAuthError(error, options)`**: Handles errors with redirect
3. **`safeAuthOperation(operation, fallback)`**: Wraps operations with error handling

### Integration Points

#### Vendor Layout (`app/vendor/layout.tsx`)
```typescript
try {
  // Layout logic
} catch (error) {
  if (isAuthError(error)) {
    handleAuthError(error, { redirectTo: '/login' })
  }
  // Handle other errors
}
```

#### Collector Layout (`app/collector/layout.tsx`)
```typescript
try {
  // Layout logic
} catch (error) {
  if (isAuthError(error)) {
    handleAuthError(error, { redirectTo: '/login' })
  }
  // Handle other errors
}
```

### Error Types Handled

1. **Supabase `unexpected_failure`**: Generic auth failure
2. **500 Server Errors**: Server-side auth issues
3. **Session Errors**: Expired or invalid sessions
4. **Token Errors**: Invalid or malformed tokens

### User Experience

**Before**:
- 500 error page with no context
- User stuck with no clear action
- No way to recover without manual URL navigation

**After**:
- Graceful redirect to login page
- Clear error message displayed
- Return URL preserved for post-login redirect
- User can immediately retry authentication

### Error Messages

| Error Type | User Message |
|------------|--------------|
| `unexpected_failure` | "Authentication failed. Please log in again." |
| 500 error | "Server error. Please try logging in again." |
| Session expired | "Your session has expired. Please log in again." |
| Invalid token | "Invalid authentication token. Please log in again." |
| Generic | "Authentication error. Please log in again." |

## Login Page Integration

The login page (`app/login/login-client.tsx`) already handles error display:

```typescript
useEffect(() => {
  const errorParam = searchParams.get("error")
  if (errorParam === "not_registered") {
    setFormError(NOT_REGISTERED_ERROR)
  } else if (errorParam) {
    setFormError(`Authentication error: ${errorParam}`)
  }
}, [searchParams])
```

## Testing

### Manual Testing
1. **Expired Session**: Wait for session to expire, try to access protected route
2. **Invalid Token**: Manually corrupt auth token in cookies
3. **Server Error**: Simulate Supabase downtime
4. **No Session**: Access protected route without logging in

### Expected Behavior
- All scenarios should redirect to `/login?error=<message>`
- Error message should be displayed on login page
- User can log in and be redirected back to original page

## Benefits

1. **No More 500 Errors**: Auth failures don't crash the app
2. **Better UX**: Users get clear feedback and recovery path
3. **Debugging**: All auth errors are logged for investigation
4. **Security**: Sensitive error details not exposed to users
5. **Reliability**: System remains stable even with auth issues

## Error Logging

All authentication errors are logged with context:

```typescript
console.error('[auth-error-handler] Authentication error:', {
  code: error?.code,
  error_code: error?.error_code,
  message: error?.message || error?.msg,
  stack: error?.stack,
})
```

## Future Enhancements

- [ ] Add retry logic for transient failures
- [ ] Implement exponential backoff for repeated failures
- [ ] Add telemetry/monitoring integration
- [ ] Create admin dashboard for auth error analytics
- [ ] Add rate limiting for failed auth attempts

## Related Documentation
- [Error Handling](../error-handling/README.md)
- [Vendor Authentication](../vendor-auth/README.md)
- [Session Management](../session-management/README.md)

## Troubleshooting

### Issue: Still seeing 500 errors
**Solution**: Check server logs for non-auth errors that need separate handling

### Issue: Redirect loop
**Solution**: Verify login page doesn't require authentication

### Issue: Error message not showing
**Solution**: Check URL parameters and login page error display logic

---

**Implementation Status**: ✅ COMPLETE
**Production Ready**: ✅ YES
**Documentation**: ✅ COMPLETE
