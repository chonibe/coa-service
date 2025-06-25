# Customer Dashboard

## 🔗 Route Information
- **Path**: `/customer/dashboard`
- **Component**: `app/customer/dashboard/page.tsx`

## 📋 Overview
The Customer Dashboard provides a centralized interface for users to:
- Manage digital art collections
- Authenticate artworks
- Explore digital experiences

## 🚨 Common 404 Error Troubleshooting
If you're experiencing a 404 error:

### Potential Causes
1. **Incorrect Route**
   - Ensure you're using `/customer/dashboard`
   - Previous route was `/pages/dashboard`

2. **Authentication Issues**
   - Verify user is logged in
   - Check Supabase authentication status
   - Confirm user has correct role/permissions

3. **Technical Checks**
   - Verify API endpoint configuration
   - Check Next.js routing setup
   - Inspect browser network tab for specific error details

### Debugging Steps
```typescript
// Example authentication check
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  // Redirect to login or handle unauthenticated state
  router.push('/login')
}
```

## 🔍 Related Documentation
- [Authentication Flows](/docs/authentication/README.md)
- [NFC Certification](/docs/nfc-certification/authentication-flow.md)
- [Technical Design](/docs/technical-design/overview.md)

## 📝 Version
**Customer Dashboard Version**: 1.1.0
**Last Updated**: [Current Date] 