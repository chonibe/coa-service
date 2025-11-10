# COA Service Documentation

## 📚 Documentation Structure

### User Dashboards
- [Customer Dashboard](/app/customer/dashboard/README.md)
- [Vendor Dashboard Overview](/app/vendor/dashboard/README.md)
- [Vendor Dashboard Hardening](./features/vendor-dashboard/README.md)
- `/vendor/signup` self-serve onboarding flow (see vendor dashboard hardening guide)
- [Admin Dashboard](/app/admin/dashboard/README.md)
- Admin vendor switcher (`app/admin/components/vendor-switcher.tsx`) for quick impersonation.

### Technical Design
- [Project Overview](/technical-design/overview.md)
- [Architecture](/architecture/README.md)
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
- Vendor login/signup/onboarding surfaces share the [`AuthShell`](../components/vendor/AuthShell.tsx) layout and bypass sidebar navigation via local layouts.
- Admin accounts (`choni@thestreetlamp.com`, `chonibe@gmail.com`) land on the admin dashboard after Google OAuth and can open vendor dashboards through the header vendor switcher.

## Version
**Documentation Version**: 1.5.0  
**Last Updated**: 2025-11-10