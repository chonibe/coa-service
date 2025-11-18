# Street Collector API Documentation

## Overview
The Street Collector API provides a comprehensive, headless backend for managing digital art collections, vendor interactions, and user experiences.

## Authentication

### Authentication Mechanism
- Supabase Auth (Google OAuth) for vendors and admins.
- Supabase sessions exchanged via `/auth/callback` and persisted in HTTP-only cookies.
- Signed `vendor_session` cookie isolates vendor access and is required for protected endpoints.
- Signed `admin_session` cookie (HMAC-SHA256 via `ADMIN_SESSION_SECRET`) secures admin UI and APIs.

#### User Roles
- `ADMIN`: Full system access
- `VENDOR`: Product and sales management
- `CUSTOMER`: Personal dashboard and order interactions
- `GUEST`: Limited access

## Vendor Portal (App Router)

### Session Model
- Vendors initiate Google OAuth via `GET /api/auth/google/start`. Supabase handles the consent screen and redirects to `/auth/callback`.
- Email/password logins post to `POST /api/auth/email-login`, which uses Supabase Auth password flow and mirrors the same vendor linkage.
- The callback exchanges the Supabase code for a server session, resolves vendor linkage through `vendor_users`/`vendors` tables, and issues signed cookies.
- Admin emails (`choni@thestreetlamp.com`, `chonibe@gmail.com`) retain Supabase access and can impersonate vendors with `/api/auth/impersonate`.
- All vendor endpoints reject requests without a valid signed cookie, preventing cross-vendor session bleed.
- Admin overrides can directly bind Google accounts to specific vendors (e.g., Street Collector) before automatic vendor creation occurs.

### Endpoint: `GET /api/auth/google/start`
- **Description**: Initiates Supabase Google OAuth and stores the post-login redirect path for the session.
- **Query Params**: `redirect` (optional) relative path to return to after sign-in.
- **Response**: Redirect (302) to Supabase Auth consent URL. Sets `vendor_post_login_redirect` cookie.
- **Errors**: Returns `400` JSON when Supabase cannot generate an OAuth URL.

### Endpoint: `/auth/callback`
- **Description**: Supabase OAuth callback. Exchanges the authorization code for a Supabase session, links the user to a vendor record, and issues the `vendor_session` cookie.
- **Redirect Flow**:
  - Vendors with linked records → `/vendor/dashboard` (or stored redirect).
  - New vendors → `/vendor/onboarding`.
  - Admins → `/admin/dashboard` (or stored redirect) with `admin_session` cookie.

### Endpoint: `POST /api/auth/email-login`
- **Description**: Authenticates Supabase email/password users, links the account to a vendor or admin role, and returns a JSON redirect target.
- **Request Body**:
  ```json
  { "email": "artist@example.com", "password": "supabaseSecret" }
  ```
- **Success (200)**: `{ "redirect": "/vendor/dashboard" }` (or `/admin/dashboard` for admins). Issues/clears the same cookies as `/auth/callback`.
- **Errors**:
  - `400` missing email/password payload.
  - `401` invalid credentials.
  - `403` unregistered email (responds with support contact message, clears cookies, and signs out).

### Endpoint: `GET /api/auth/status`
- **Description**: Returns Supabase session metadata and vendor context for the current request.
- **Success (200)**:
  ```json
  {
    "authenticated": true,
    "isAdmin": false,
    "vendorSession": "my-vendor",
    "vendor": {
      "id": 42,
      "vendor_name": "my-vendor"
    },
    "user": {
      "id": "uuid",
      "email": "artist@example.com",
      "app_metadata": { "provider": "google" }
    }
  }
  ```
- **Notes**: Response caching is disabled; route uses Supabase session cookies.

### Endpoint: `POST /api/auth/impersonate`
- **Description**: Allows whitelisted admin emails to assume a vendor session for diagnostics. Requires both Supabase admin session and signed `admin_session` cookie.
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  { "vendorName": "Example Vendor" }
  ```
- **Success (200)**: `{ "success": true, "vendor": { "id": 12, "vendor_name": "Example Vendor" } }` and sets a new `vendor_session`.
- **Errors**:
  - `401` if the Supabase session or `admin_session` cookie is missing.
  - `403` if the user is not an admin.
  - `404` if the vendor cannot be located.
- **Side Effects**: Failed password attempts are recorded in `failed_login_attempts` for audit review.

### Endpoint: `POST /api/auth/impersonate/end`
- **Description**: Allows admins to exit impersonation mode while retaining their admin session.
- **Success (200)**: `{ "success": true }`
- **Side Effects**: Clears the `vendor_session` cookie and redirects callers to admin view when requested.

### Endpoint: `POST /api/vendor/logout`
- **Description**: Signs out of Supabase and clears vendor cookies.
- **Success (200)**: `{ "success": true }`
- **Side Effects**: Calls `supabase.auth.signOut()` and clears `vendor_session`, `vendor_post_login_redirect`, `pending_vendor_email`, and `admin_session`.

### Endpoint: `GET /api/vendor/stats`
- **Description**: Returns vendor sales totals, payout totals, and 30-day daily chart.
- **Response (200)**:
  ```json
  {
    "totalProducts": 12,
    "totalSales": 48,
    "totalRevenue": 1260.5,
    "totalPayout": 378.15,
    "currency": "GBP",
    "salesByDate": [
      { "date": "2025-10-12", "sales": 4, "revenue": 95.4 }
    ],
    "recentActivity": [
      {
        "id": "123",
        "date": "2025-10-12T10:15:00.000Z",
        "product_id": "987654321",
        "price": 64.5,
        "quantity": 1
      }
    ]
  }
  ```
- **Data Sources**:
  - Supabase `order_line_items_v2` primary source.
  - Supabase `product_vendor_payouts` for payout percentages/amounts.
  - Shopify GraphQL fallback (`orders` + `products`) when Supabase data is absent.

### Endpoint: `GET /api/vendor/sales-analytics`
- **Description**: Returns monthly analytics, product revenue breakdown, and detailed sales history.
- **Response (200)**:
  ```json
  {
    "salesByDate": [
      { "period": "2025-10", "month": "Oct 2025", "sales": 12, "revenue": 210.25 }
    ],
    "salesByProduct": [
      {
        "productId": "987654321",
        "title": "Limited Edition Print",
        "sales": 8,
        "revenue": 168.2,
        "payoutType": "percentage",
        "payoutAmount": 25
      }
    ],
    "salesHistory": [
      {
        "id": "123",
        "product_id": "987654321",
        "title": "Limited Edition Print",
        "date": "2025-10-12T10:15:00.000Z",
        "price": 64.5,
        "quantity": 1,
        "revenue": 16.12,
        "currency": "GBP",
        "payout": {
          "type": "percentage",
          "amount": 25
        }
      }
    ],
    "totalItems": 24
  }
  ```
- **Notes**: Aggregates quantities, revenue, and payout metadata server-side to maintain consistency.

### Endpoint: `GET /api/vendors/products`
- **Description**: Lists vendor products, combining Shopify catalog data with Supabase payout settings.
- **Query Parameters**:
  - `vendor` (optional): Overrides cookie vendor (requires same value as authenticated vendor; falls back to cookie when omitted).
- **Response (200)**:
  ```json
  {
    "products": [
      {
        "id": "987654321",
        "title": "Limited Edition Print",
        "handle": "limited-edition-print",
        "vendor": "Example Vendor",
        "productType": "Print",
        "inventory": 5,
        "price": "64.50",
        "currency": "GBP",
        "image": "https://cdn.shopify.com/product.jpg",
        "status": "active",
        "payout_amount": 25,
        "is_percentage": true
      }
    ]
  }
  ```
- **Fallback**: Returns mock products if both cookie and `vendor` query param are absent (development aid).

### Error Handling
- Missing or invalid `vendor_session` cookie → `401 { "error": "Not authenticated" }`.
- Missing or invalid `admin_session` cookie on admin endpoints → `401 { "error": "Unauthorized" }`.
- Unexpected Supabase/Shopify failures → `500 { "error": "Failed to fetch vendor stats" }`.
- All vendor endpoints log detailed errors server-side for observability.

### Authentication Endpoints
| Endpoint | Method | Description | Roles Allowed |
|----------|--------|-------------|--------------|
| `/api/v1/auth/login` | POST | User authentication | ALL |
| `/api/v1/auth/register` | POST | User registration | ALL |
| `/api/v1/auth/refresh` | POST | Token refresh | ALL |

## Admin Portal (App Router)

### Session Model
- Admins complete Google OAuth via `/api/auth/google/start?redirect=/admin/dashboard`.
- `/auth/callback` validates admin email, issues `admin_session`, and redirects to the stored admin path.
- Server-side admin layout rejects requests lacking a valid admin cookie and redirects to `/admin/login`.

### Endpoint: `POST /api/admin/login`
- **Description**: Confirms Supabase Google session belongs to an admin and issues a signed `admin_session` cookie.
- **Success (200)**: `{ "success": true }`
- **Errors**:
  - `401` if Supabase session missing.
  - `403` if email not on admin whitelist.

### Endpoint: `POST /api/admin/logout`
- **Description**: Clears both admin and vendor session cookies.
- **Success (200)**: `{ "success": true }`
- **Side Effects**: Removes `admin_session` and `vendor_session`; client redirects to `/admin/login`.

### Endpoint: `GET /api/get-all-products`
- **Description**: Shopify REST proxy for product search, now restricted to administrators.
- **Auth**: Requires `admin_session`.
- **Errors**: `401` when missing/invalid admin cookie; upstream Shopify errors surface as `500`.

### Endpoint: `GET /api/vendors/names`
- **Description**: Returns alphabetized vendor names to populate the admin vendor switcher.
- **Auth**: Requires `admin_session`.
- **Success (200)**: `{ "vendors": ["street-collector", "..."] }`

### Endpoint: `GET /api/admin/orders`
- **Description**: Lists orders and grouped line items for the admin portal.
- **Auth**: Requires `admin_session`.
- **Notes**: Supports preview bypass via `x-preview-mode` header for test fixtures.

### Endpoint: `GET /api/admin/orders/[orderId]`
- **Description**: Fetch detailed order information and associated line items.
- **Auth**: Requires `admin_session`.

### Endpoint: `GET /api/admin/backup/list`
- **Description**: Returns backup history (`backups` table).
- **Auth**: Requires `admin_session`.

### Endpoint: `POST /api/admin/backup/[type]`
- **Description**: Triggers database or Google Sheets backups based on `type` path parameter.
- **Auth**: Requires `admin_session`.
- **Errors**: `400` invalid type, `500` on failure; failure recorded in Supabase.

### Endpoint: `GET /api/admin/backup/settings`
- **Description**: Fetches backup configuration, bootstrapping defaults as needed.
- **Auth**: Requires `admin_session`.

### Endpoint: `POST /api/admin/backup/settings`
- **Description**: Upserts backup schedule and retention settings.
- **Auth**: Requires `admin_session`.
- **Validation**: Payload validated against `backupSettingsSchema`; invalid input returns `400`.

### Endpoint: `GET /api/admin/run-cron`
- **Description**: Allows admins to manually trigger cron jobs. Requires `admin_session` and `CRON_SECRET`.
- **Errors**: `401` missing admin session, `403` invalid secret, `500` upstream cron failure.

### Endpoint: `GET /api/admin/vendors/list`
- **Description**: Returns vendor directory details (status, onboarding, last login, contact email) for the admin vendor explorer.
- **Query Parameters**: `search`, `status`, `limit` (optional; defaults to 100).
- **Auth**: Requires signed `admin_session` cookie.
- **Success (200)**: `{ "vendors": [ { "id": 1, "vendor_name": "Street Collector", "status": "active", "onboarding_completed": true, "last_login_at": "2025-11-11T10:00:00Z", "contact_email": "..." } ] }`

### Endpoint: `GET /api/admin/audit/logins`
- **Description**: Fetches recent failed login attempts and impersonation logs for administrator review.
- **Auth**: Requires `admin_session`.
- **Success (200)**:
  ```json
  {
    "failedLogins": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "method": "email",
        "reason": "Invalid credentials",
        "ip_address": "127.0.0.1",
        "created_at": "2025-11-11T10:00:00.000Z"
      }
    ],
    "impersonations": [
      {
        "id": "uuid",
        "admin_email": "admin@example.com",
        "vendor_id": 12,
        "vendor_name": "Street Collector",
        "created_at": "2025-11-11T10:05:00.000Z"
      }
    ]
  }
  ```
- **Notes**: Results are ordered by `created_at DESC`; `limit` query parameter (default 100) controls page size.

### Endpoint: `POST /api/admin/vendors/update-email`
- **Description**: Updates a vendor's contact email and vendor user mapping. Logs admin action for audit.
- **Auth**: Requires `admin_session`.
- **Request Body**:
  ```json
  { "vendorId": 123, "email": "vendor@example.com" }
  ```
- **Success (200)**:
  ```json
  {
    "success": true,
    "vendor": {
      "id": 123,
      "vendor_name": "Street Collector",
      "contact_email": "vendor@example.com"
    }
  }
  ```
- **Notes**: Persists the email to both `vendors.contact_email` and `vendor_users.email` (creating the mapping if it doesn't exist). Action is logged to `admin_actions` table.

### Endpoint: `GET /api/admin/vendors/[vendorId]/dashboard`
- **Description**: Returns vendor dashboard data (stats, analytics, recent activity) for admin view.
- **Auth**: Requires signed `admin_session` cookie.
- **Success (200)**:
  ```json
  {
    "vendor": {
      "id": 123,
      "vendor_name": "Street Collector",
      "status": "active",
      "contact_email": "vendor@example.com",
      "onboarding_completed": true,
      "created_at": "2025-11-11T10:00:00Z",
      "last_login_at": "2025-11-17T10:00:00Z"
    },
    "stats": {
      "totalProducts": 15,
      "totalSales": 42,
      "totalRevenue": 1250.50,
      "totalPayout": 1250.50,
      "currency": "GBP",
      "salesByDate": [...],
      "recentActivity": [...]
    }
  }
  ```
- **Notes**: Logs admin view action to `admin_actions` table.

### Endpoint: `GET /api/admin/vendors/[vendorId]/orders`
- **Description**: Returns vendor orders/line items for admin view.
- **Auth**: Requires signed `admin_session` cookie.
- **Success (200)**:
  ```json
  {
    "vendor": {
      "id": 123,
      "vendor_name": "Street Collector"
    },
    "orders": [...]
  }
  ```
- **Notes**: Logs admin view action to `admin_actions` table.

### Endpoint: `GET /api/admin/vendors/[vendorId]/settings`
- **Description**: Returns vendor settings and account details for admin view.
- **Auth**: Requires signed `admin_session` cookie.
- **Success (200)**:
  ```json
  {
    "vendor": {
      "id": 123,
      "vendor_name": "Street Collector",
      "status": "active",
      "contact_email": "vendor@example.com",
      "onboarding_completed": true,
      "created_at": "2025-11-11T10:00:00Z",
      "last_login_at": "2025-11-17T10:00:00Z"
    },
    "vendorUser": {
      "email": "vendor@example.com",
      "hasAuth": true
    }
  }
  ```
- **Notes**: Logs admin view action to `admin_actions` table.

### Endpoint: `PATCH /api/admin/vendors/[vendorId]/settings`
- **Description**: Updates vendor settings. Logs admin action for audit.
- **Auth**: Requires signed `admin_session` cookie.
- **Request Body**: Partial vendor object with fields to update.
- **Success (200)**:
  ```json
  {
    "success": true,
    "vendor": { ... }
  }
  ```
- **Notes**: Action is logged to `admin_actions` table with updated fields.

## API Endpoints

### Dashboard API
Base URL: `/api/v1/dashboard`

#### GET Endpoints
| Endpoint | Description | Required Role | Parameters |
|----------|-------------|---------------|------------|
| `/?type=overview` | Fetch dashboard overview | CUSTOMER, ADMIN | - |
| `/?type=recent_orders` | Fetch recent orders | CUSTOMER, ADMIN | `limit` (optional) |

#### POST Endpoints
| Endpoint | Description | Required Role | Payload |
|----------|-------------|---------------|----------|
| `/` | Update dashboard preferences | CUSTOMER, ADMIN | `{ action: string, payload: any }` |

### Vendor API
Base URL: `/api/v1/vendor`

#### GET Endpoints
| Endpoint | Description | Required Role | Parameters |
|----------|-------------|---------------|------------|
| `/?type=products` | List vendor products | VENDOR | `page`, `limit` |
| `/?type=dashboard` | Vendor dashboard metrics | VENDOR | - |
| `/?type=payouts` | Vendor payout history | VENDOR | `page`, `limit` |

#### POST Endpoints
| Endpoint | Description | Required Role | Payload |
|----------|-------------|---------------|----------|
| `/` | Create product | VENDOR | Product details |
| `/` | Update vendor profile | VENDOR | Profile data |

### Admin API
Base URL: `/api/v1/admin`

#### GET Endpoints
| Endpoint | Description | Required Role | Parameters |
|----------|-------------|---------------|------------|
| `/?type=VENDORS` | List vendors | ADMIN | `page`, `limit` |
| `/?type=ORDERS` | List orders | ADMIN | `page`, `limit` |
| `/?type=DASHBOARD` | Admin dashboard metrics | ADMIN | - |
| `/?type=CERTIFICATES` | List certificates | ADMIN | `page`, `limit` |

#### POST Endpoints
| Endpoint | Description | Required Role | Payload |
|----------|-------------|---------------|----------|
| `/` | Create vendor | ADMIN | Vendor details |
| `/` | Trigger Shopify sync | ADMIN | Sync configuration |
| `/` | Generate reports | ADMIN | Report parameters |

### Customer Orders API

## Endpoint: `/api/customer/orders`

### Authentication Methods
The API supports multiple methods for customer authentication:
1. URL Query Parameter: `?customerId=123`
2. Cookie: `shopify_customer_id`
3. Custom Header: `X-Customer-ID`

### Response Formats

#### Successful Response
```json
{
  "success": true,
  "orders": [
    {
      "id": "string",
      "order_number": 1001,
      "processed_at": "2023-06-15T10:30:00Z",
      "total_price": 99.99,
      "financial_status": "paid",
      "fulfillment_status": "shipped",
      "line_items": [...]
    }
  ],
  "count": 1,
  "message": "Retrieved 1 orders"
}
```

#### Error Responses

1. No Customer ID
```json
{
  "success": false,
  "message": "Authentication failed - customer ID not found",
  "errorCode": "AUTH_NO_CUSTOMER_ID",
  "possibleReasons": [
    "Not logged in",
    "Session expired",
    "Missing customer identification"
  ]
}
```

2. Invalid Customer ID
```json
{
  "success": false,
  "message": "Invalid customer ID format",
  "errorCode": "AUTH_INVALID_CUSTOMER_ID",
  "providedId": "invalid_id"
}
```

3. No Orders Found
```json
{
  "success": true,
  "orders": [],
  "count": 0,
  "message": "No orders found for this customer"
}
```

### Error Codes
- `AUTH_NO_CUSTOMER_ID`: Customer authentication failed
- `AUTH_INVALID_CUSTOMER_ID`: Provided customer ID is invalid
- `DB_CONNECTION_FAILED`: Database connection error
- `DB_QUERY_FAILED`: Failed to retrieve orders from database
- `UNEXPECTED_SERVER_ERROR`: Unexpected server-side error

### Recommended Client-Side Handling
1. Check `response.ok` to determine success
2. Inspect `errorCode` for specific error scenarios
3. Provide user-friendly error messages
4. Implement fallback UI for different error states

### Frontend Example
```javascript
async function fetchOrders() {
  try {
    const response = await fetch('/api/customer/orders', {
      headers: {
        'X-Customer-ID': customerId,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific error codes
      switch (data.errorCode) {
        case 'AUTH_NO_CUSTOMER_ID':
          showLoginPrompt();
          break;
        case 'DB_QUERY_FAILED':
          showRetryMessage();
          break;
        default:
          showGenericError(data.message);
      }
      return;
    }
    
    renderOrders(data.orders);
  } catch (error) {
    showGenericError('An unexpected error occurred');
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": "Error Category",
  "message": "Detailed error description",
  "status": 400,
  "timestamp": "2025-06-23T12:34:56Z"
}
```

### Common Error Codes
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting
- Maximum 100 requests per minute
- Burst limit: 50 requests in 10 seconds
- Exceeded limits result in temporary IP blocking

## Versioning
- Current API Version: `v1`
- Deprecation Policy: 6-month notice for major changes

## Security
- HTTPS required
- CORS configured
- Input validation
- Comprehensive logging

## Pagination
All list endpoints support:
- `page`: Current page number
- `limit`: Items per page (default: 50, max: 250)

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "total": 1000,
    "page": 1,
    "limit": 50,
    "totalPages": 20
  }
}
```

## Webhooks
Supported Events:
- `order.created`
- `product.updated`
- `vendor.status_changed`
- `certificate.issued`

## Best Practices
- Use meaningful `cacheKey` for data caching
- Handle loading and error states
- Implement retry mechanisms
- Use predefined schemas for validation

## SDK & Client Libraries
- React Hook: `useApiFetch`
- Mutation Hook: `useApiMutation`
- TypeScript Type Definitions Included

## Changelog
- 2025-06-23: Initial v1 Release
- Headless architecture implementation
- Comprehensive role-based access

## Support
- Email: api-support@streetcollector.com
- Documentation: [Link to Full Docs]
- Status Page: [API Status Monitoring Link]

## Customer Dashboard API

### Endpoint: `/api/customer/dashboard/[customerId]`

#### Description
Retrieves order details for a specific customer using their Shopify Customer ID.

#### Request Method
- `GET`

#### Path Parameters
- `customerId` (required): Shopify Customer ID as a string

#### Response

**Success Response (200 OK)**
```json
{
  "success": true,
  "orders": [
    {
      "id": "unique_order_id",
      "order_number": "1234",
      "processed_at": "2023-06-15T10:30:00Z",
      "total_price": 99.99,
      "financial_status": "paid",
      "fulfillment_status": "shipped",
      "line_items": [
        {
          "id": "line_item_id",
          "name": "Product Name",
          "quantity": 1,
          "price": 99.99,
          "nfc_tag_id": "optional_nfc_tag",
          "certificate_url": "optional_certificate_link"
        }
      ]
    }
  ],
  "count": 1,
  "message": "Retrieved 1 orders for customer shopify_customer_123"
}
```

**Error Responses**

1. Missing or Invalid Customer ID (400 Bad Request)
```json
{
  "success": false,
  "message": "Customer ID is required",
  "errorCode": "MISSING_CUSTOMER_ID"
}
```

2. Customer Not Found (404 Not Found)
```json
{
  "success": false,
  "message": "Customer not found",
  "errorCode": "CUSTOMER_NOT_FOUND"
}
```

3. Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Failed to retrieve orders",
  "errorCode": "DB_QUERY_FAILED",
  "technicalDetails": "Detailed error message"
}
```

#### Error Codes
- `MISSING_CUSTOMER_ID`: No customer ID was provided
- `INVALID_CUSTOMER_ID`: Customer ID is not in the correct format
- `CUSTOMER_NOT_FOUND`: No customer found with the given ID
- `DB_QUERY_FAILED`: Database query encountered an error
- `SUPABASE_CONNECTION_ERROR`: Unable to connect to the database

#### Notes
- Requires valid authentication
- Returns up to 50 most recent orders
- Orders are sorted by `processed_at` in descending order 