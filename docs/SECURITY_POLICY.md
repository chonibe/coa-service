# Security Policy - COA Service

## Overview
This document outlines the security procedures, responsibilities, and guidelines for the COA Service codebase and infrastructure.

## 1. Development Best Practices

### Secret Management
- **NEVER** hardcode secrets (API keys, tokens, passwords) in the codebase.
- Use Vercel environment variables for production secrets.
- Use `.env.local` for local development.
- Staged files are scanned for secrets before every commit via `husky` and `lint-staged`.

### Input Validation & Sanitization
- All user inputs from API requests must be validated using Zod schemas.
- HTML content must be sanitized using `DOMPurify` before being rendered with `dangerouslySetInnerHTML`.
- Prefer server-side components and safe React rendering over `dangerouslySetInnerHTML`.

### Authentication & Authorization
- Use `guardAdminRequest` for all `/api/admin` routes.
- Use `guardVendorRequest` for all `/api/vendor` routes.
- Ensure all database queries include proper filtering by `vendor_id` or `user_id`.

## 2. Infrastructure Security

### Database (Supabase)
- **Row Level Security (RLS)**: Must be enabled on all tables. Policies should be reviewed quarterly.
- **Service Role Key**: Should only be used in secure server-side environments.
- **Raw SQL**: The `exec_sql` function is restricted to specific operations and is audit-logged.

### Hosting (Vercel)
- **Security Headers**: Configured in `next.config.js` including CSP, HSTS, and X-Frame-Options.
- **CORS**: Wildcards are prohibited. Allowed origins must be explicitly listed in `ALLOWED_ORIGINS`.
- **Rate Limiting**: Applied to all API routes via middleware.

## 3. Continuous Security Checks

### Automated Scans
- **Linting**: `npm run lint` includes `eslint-plugin-security` and `eslint-plugin-sonarjs`.
- **Audit**: `npm audit` runs in CI/CD and fails on High/Critical vulnerabilities.
- **Secret Scanning**: Gitleaks and custom scripts run on every PR.

### Regular Audits
- **Access Review**: Monthly review of admin users and their access levels.
- **Key Rotation**: API keys (Shopify, PayPal, Stripe) should be rotated every 6 months or immediately if exposure is suspected.

## 4. Incident Response

### Reporting a Vulnerability
If you discover a security vulnerability, please report it immediately to:
- **Email**: security@thestreetlamp.com
- **Urgent**: Contact the Lead Developer directly.

### Vulnerability Triage
1. **Identify**: Confirm the vulnerability and its impact.
2. **Contain**: Temporarily disable the affected feature if necessary.
3. **Remediate**: Develop and test a fix.
4. **Deploy**: Roll out the fix to production immediately.
5. **Post-mortem**: Document the issue and implement measures to prevent recurrence.

## 5. Key Rotation Checklist
In the event of a secret leak:
1. Revoke the compromised key in the provider's dashboard (e.g., Shopify, PayPal).
2. Generate a new key.
3. Update the environment variable in Vercel.
4. Redeploy the application.
5. Invalidate any sessions associated with the compromised key.


