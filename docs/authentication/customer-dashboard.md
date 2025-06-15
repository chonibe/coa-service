# Customer Dashboard Authentication

**Version:** 1.0.0  
**Last Updated:** <!--date-->

## Overview
The customer dashboard is protected by a server-side middleware guard. A request is considered **authenticated** when the following cookie is present:

| Cookie | Purpose |
|--------|---------|
| `shopify_customer_id` | Identifies the logged-in Shopify customer |

`shopify_customer_access_token` is **optional**. It may be introduced in a later phase when the server needs to call Shopify Storefront APIs on behalf of the customer.

## Flow
1. Browser hits `/dashboard/:customerId` or `/customer/dashboard/:customerId`.
2. `middleware.ts` checks for `shopify_customer_id`.
3. If the cookie is **missing** the user is redirected to `/login?redirect=<original-path>` which triggers Shopify OAuth.
4. After successful login `/api/auth/callback` sets the `shopify_customer_id` cookie and redirects back to the requested dashboard URL.
5. Middleware now allows the request and the React page loads.

## Future work
* Generate or fetch a Storefront **customer access token** and store it in `shopify_customer_access_token` when needed.
* Reinstate the stricter middleware check once token-dependent server routes are implemented.

---
**Implementation link:** [`middleware.ts`](../../middleware.ts)

**Tests:** none yet – to be added with token work.

**Changelog**
- **1.0.0** – Initial documentation. Middleware now requires only `shopify_customer_id`. 