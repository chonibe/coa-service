# COA Service Documentation

## 📚 Documentation Structure

### User Dashboards
- [Customer Dashboard](/app/customer/dashboard/README.md)
- [Vendor Dashboard Overview](/app/vendor/dashboard/README.md)
- [Vendor Dashboard Hardening](./features/vendor-dashboard/README.md)
- [Admin Dashboard](/app/admin/dashboard/README.md)

### Technical Design
- [Project Overview](/technical-design/overview.md)
- [Architecture](/architecture/README.md)
- [Data Enrichment Protocol (PII Bridge)](/docs/features/data-enrichment-protocol.md) 🆕
- [**Data Fetching Strategies**](/data-fetching/README.md) 🆕

### Authentication
- [Authentication Flows](/authentication/README.md)

### NFC Certification
- [NFC Authentication Flow](/nfc-certification/authentication-flow.md)

### Sprint Planning
- [Sprint Roadmap](/sprint-planning/roadmap.md)

## 🔗 Quick Links
- [Main Project README](/README.md)
- [Technical Overview](/technical-design/overview.md)

## Routing Structure
- Customer Routes: `/customer/*`
- Vendor Routes: `/vendor/*`
- Admin Routes: `/admin/*`

## Contributing to Documentation
1. Follow markdown best practices
2. Keep documentation concise and up-to-date
3. Use clear, technical language
4. Include code examples where appropriate

## Environment Notes
- Vendor endpoints now require a signed `vendor_session` cookie generated with `VENDOR_SESSION_SECRET`.
- Ensure Shopify and Supabase credentials remain configured for fallback analytics.
- Configure Supabase Google OAuth (`SUPABASE_GOOGLE_CLIENT_ID` / `SUPABASE_GOOGLE_CLIENT_SECRET`) and run `npm run supabase:enable-google` after updating redirect URLs.

## Version
**Documentation Version**: 1.3.0  
**Last Updated**: 2025-11-10