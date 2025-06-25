# Street Collector Authentication System

## 🔐 Overview
The Street Collector authentication system provides a secure, Shopify-integrated login mechanism for accessing customer dashboards and digital art collections.

## 🌐 Authentication Flow

### 1. Login Initiation
- User clicks "Login with Shopify"
- Redirected to Shopify account login page
- Includes state parameter for CSRF protection

### 2. Shopify Authentication
- Shopify validates customer credentials
- Redirects back to application callback route
- Passes customer ID and optional metadata

### 3. Callback Processing
- Validate OAuth state
- Set authentication cookies
- Redirect to customer dashboard

## 🍪 Cookie Management

### Authentication Cookies
| Cookie Name | Purpose | Accessibility | Expiration |
|------------|---------|--------------|------------|
| `shopify_customer_id` | Store customer identifier | Client & Server | 7 days |
| `shopify_customer_email` | Store customer email | Client & Server | 7 days |
| `shopify_customer_login` | Temporary login flag | Client | 5 minutes |
| `shopify_oauth_state` | CSRF protection | Server-only | 15 minutes |

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
**Authentication System Version**: 1.2.0
**Last Updated**: ${new Date().toISOString()}

## Related Documentation
- [NFC Authentication](/docs/nfc-certification/authentication-flow.md)
- [Customer Portal Experience](/docs/customer-portal-experience.md) 