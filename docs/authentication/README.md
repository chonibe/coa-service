# Street Collector Authentication System

## 🔐 Overview
The Street Collector authentication system provides a secure, Shopify-integrated login mechanism for accessing customer dashboards and digital art collections.

## 🌐 Authentication Flow

### 1. Login Initiation
- User clicks "Login with Shopify" or "Continue with Google" (Shopify Google login).
- Redirected to Shopify account login page with `identity_provider=google` when using Google.
- Includes state parameter for CSRF protection.

### 2. Shopify Authentication
- Shopify validates customer credentials (password or Google identity).
- Redirects back to application callback route.
- Passes customer ID and optional metadata (access token, email when available).

### 3. Callback Processing
- Validate OAuth state.
- Set authentication cookies (domain `.thestreetlamp.com` in production).
- Create collector session token when `customer_id` is present.
- Redirect to customer or collector dashboard.

## 🍪 Cookie Management

### Authentication Cookies
| Cookie Name | Purpose | Accessibility | Expiration |
|------------|---------|--------------|------------|
| `shopify_customer_id` | Store customer identifier | Client & Server | 7 days |
| `shopify_customer_access_token` | Store Shopify customer token (server usage) | Server-only | 7 days |
| `collector_session` | Signed session for collector dashboards | Server-only | 24 hours |
| `shopify_customer_login` | Temporary login flag | Client | 7 days |
| `shopify_oauth_state` | CSRF protection | Server-only | 10 minutes |

## 🛡️ Security Features
- CSRF protection via state parameter
- Secure, HTTP-only cookies
- Environment-specific validation
- Comprehensive logging

## 🔍 Debugging
- Debug route: `/api/auth/debug`
- Provides detailed authentication state information

## 🚀 Configuration

### Environment Variables
- `SHOPIFY_SHOP`: Shopify store domain
- `NEXT_PUBLIC_APP_URL`: Application base URL
- `NODE_ENV`: Deployment environment
- `VENDOR_SESSION_SECRET`: 32-byte random secret required for signed vendor sessions (enforced via [`lib/env.ts`](../../lib/env.ts))

### Development Considerations
- Relaxed state validation in development mode
- Test state bypass for local testing

## 🔧 Troubleshooting

### Common Issues
1. **Missing Customer ID**
   - Ensure Shopify login is successful
   - Check Shopify app permissions

2. **Redirect Failures**
   - Verify `NEXT_PUBLIC_APP_URL`
   - Check domain configuration

3. **Cookie Problems**
   - Verify browser cookie settings
   - Check for cross-domain restrictions

## 📋 Roadmap
- [ ] Multi-factor authentication
- [ ] Enhanced logging and monitoring
- [ ] Improved error handling
- [ ] Support for additional OAuth providers

## 🤝 Contributing
- Follow existing authentication patterns
- Update documentation
- Add comprehensive tests

## 📝 Version
**Authentication System Version**: 1.3.0  
**Last Updated**: 2025-12-21

## Related Documentation
- [NFC Authentication](/docs/nfc-certification/authentication-flow.md)
- [Customer Portal Experience](/docs/customer-portal-experience.md) 