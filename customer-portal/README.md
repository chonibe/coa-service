# Street Collector Customer Portal

## Overview
A Shopify Customer Account Extension for digital art certification and management.

## Features
- Multi-Factor Authentication
- Digital Art Certification Tracking
- Secure Customer Identity Verification
- Responsive Dashboard Design

## Prerequisites
- Node.js 18+
- Shopify Partner Account
- Shopify CLI
- Vercel Account (for deployment)

## Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with the following:
   ```
   REACT_APP_CERTIFICATION_API=https://api.streetcollector.com
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## Deployment
Deployed via Vercel:
```bash
vercel
```

## Testing Credentials
- **Test Email:** test@thestreetlamp.com
- **Verification Code:** 123456 (for MFA testing)

## Troubleshooting
- Ensure Shopify app is configured in Partner Dashboard
- Check network connectivity
- Verify API endpoints

## Security Notes
- Multi-Factor Authentication enabled
- Comprehensive error handling
- Secure data transmission

## Roadmap
- [ ] Enhanced MFA methods
- [ ] Performance optimization
- [ ] Accessibility improvements
