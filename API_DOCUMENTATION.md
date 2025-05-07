# API Documentation

## Overview

This document provides detailed information about the API endpoints available in the application. The API is organized into several sections:

- Admin APIs
- Vendor APIs
- Public APIs
- Webhook APIs

## Authentication

Most API endpoints require authentication:

- **Admin APIs**: Require admin authentication via session cookie
- **Vendor APIs**: Require vendor authentication via session cookie
- **Public APIs**: Some endpoints are public, others require specific tokens
- **Webhook APIs**: Require webhook signature verification

## Base URL

The base URL for all API endpoints is the deployed application URL.

## Response Format

All API responses follow a standard format:

\`\`\`json
{
  "success": true|false,
  "message": "Optional message",
  "data": { ... }
}
\`\`\`

Error responses include additional information:

\`\`\`json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "code": "Error code"
}
\`\`\`

## Admin APIs

### Products

#### Get All Products

\`\`\`
GET /api/get-all-products
\`\`\`

Query parameters:
- `limit`: Number of products to return (default: 10)
- `cursor`: Pagination cursor
- `query`: Search term
- `field`: Field to search (title, sku, vendor, tag)
- `fetchAll`: Set to "true" to fetch all products (ignores pagination)

Response example:
\`\`\`json
{
  "products": [
    {
      "id": "123456789",
      "title": "Product Title",
      "vendor": "Vendor Name",
      "image": {
        "src": "https://example.com/image.jpg"
      },
      "variants": [
        {
          "sku": "SKU123"
        }
      ],
      "tags": "tag1,tag2,tag3"
    }
  ],
  "pagination": {
    "nextCursor": "cursor_string",
    "prevCursor": "cursor_string",
    "hasNext": true,
    "hasPrev": false
  }
}
\`\`\`

#### Sync All Products

\`\`\`
POST /api/sync-all-products
\`\`\`

Request body:
\`\`\`json
{
  "productIds": ["123456789", "987654321"],
  "forceSync": true
}
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "totalProducts": 2,
  "successfulProducts": 2,
  "failedProducts": 0,
  "syncResults": [
    {
      "productId": "123456789",
      "productTitle": "Product Title",
      "result": {
        "totalEditions": 10,
        "editionTotal": 100,
        "lineItemsProcessed": 10
      }
    }
  ]
}
\`\`\`

#### Test Supabase Connection

\`\`\`
GET /api/test-supabase-connection
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "Connection successful",
  "version": "PostgreSQL 13.4"
}
\`\`\`

### Editions

#### Resequence Edition Numbers

\`\`\`
POST /api/editions/resequence
\`\`\`

Request body:
\`\`\`json
{
  "productId": "123456789"
}
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "Edition numbers resequenced successfully",
  "totalEditions": 10
}
\`\`\`

#### Get Edition Number from Database

\`\`\`
GET /api/editions/get-edition-number-from-db?lineItemId=123456789
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "editionNumber": 42,
  "editionTotal": 100,
  "productId": "123456789",
  "productTitle": "Product Title"
}
\`\`\`

#### Get Edition by Line Item

\`\`\`
GET /api/editions/get-by-line-item?lineItemId=123456789
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "edition": {
    "id": 123,
    "line_item_id": "123456789",
    "product_id": "123456789",
    "edition_number": 42,
    "edition_total": 100,
    "created_at": "2023-01-01T00:00:00Z"
  }
}
\`\`\`

### Certificates

#### Generate Certificate

\`\`\`
POST /api/certificate/generate
\`\`\`

Request body:
\`\`\`json
{
  "lineItemId": "123456789"
}
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "Certificate generated successfully",
  "certificateUrl": "/certificate/123456789"
}
\`\`\`

#### Get Certificate

\`\`\`
GET /api/certificate/123456789
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "certificate": {
    "lineItemId": "123456789",
    "productTitle": "Product Title",
    "editionNumber": 42,
    "editionTotal": 100,
    "customerName": "John Doe",
    "orderDate": "2023-01-01T00:00:00Z"
  }
}
\`\`\`

#### List Certificates

\`\`\`
GET /api/certificates/list
\`\`\`

Query parameters:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20)
- `productId`: Filter by product ID
- `status`: Filter by status
- `search`: Search term
- `sortField`: Field to sort by (default: created_at)
- `sortDirection`: Sort direction (asc or desc)

Response example:
\`\`\`json
{
  "success": true,
  "certificates": [
    {
      "line_item_id": "123456789",
      "product_id": "123456789",
      "order_id": "ORDER123",
      "order_name": "#1001",
      "status": "active",
      "edition_number": 42,
      "edition_total": 100,
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "totalCount": 100
}
\`\`\`

### NFC Tags

#### List NFC Tags

\`\`\`
GET /api/nfc-tags/list
\`\`\`

Query parameters:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20)
- `status`: Filter by status
- `search`: Search term
- `sortField`: Field to sort by (default: created_at)
- `sortDirection`: Sort direction (asc or desc)

Response example:
\`\`\`json
{
  "success": true,
  "nfcTags": [
    {
      "tag_id": "NFC123",
      "line_item_id": "123456789",
      "status": "assigned",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "totalCount": 50
}
\`\`\`

#### Create NFC Tag

\`\`\`
POST /api/nfc-tags/create
\`\`\`

Request body:
\`\`\`json
{
  "tagId": "NFC123"
}
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "NFC tag created successfully",
  "tag": {
    "tag_id": "NFC123",
    "status": "unassigned",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
\`\`\`

#### Assign NFC Tag

\`\`\`
POST /api/nfc-tags/assign
\`\`\`

Request body:
\`\`\`json
{
  "tagId": "NFC123",
  "lineItemId": "123456789"
}
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "NFC tag assigned successfully",
  "tag": {
    "tag_id": "NFC123",
    "line_item_id": "123456789",
    "status": "assigned",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
\`\`\`

### Vendors

#### List Vendors

\`\`\`
GET /api/vendors/list
\`\`\`

Query parameters:
- `query`: Search term
- `limit`: Number of vendors to return (default: 100)
- `cursor`: Pagination cursor

Response example:
\`\`\`json
{
  "vendors": [
    {
      "id": "vendor-name",
      "name": "Vendor Name",
      "product_count": 10,
      "last_updated": "2023-01-01T00:00:00Z",
      "instagram_url": "https://instagram.com/vendor",
      "notes": "Vendor notes"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 100,
    "cursor": "cursor_string",
    "hasMore": false
  }
}
\`\`\`

#### Vendor Payouts

\`\`\`
POST /api/vendors/payouts
\`\`\`

Request body:
\`\`\`json
{
  "productIds": ["123456789", "987654321"],
  "vendorName": "Vendor Name"
}
\`\`\`

Response example:
\`\`\`json
{
  "payouts": [
    {
      "product_id": "123456789",
      "vendor_name": "Vendor Name",
      "payout_percentage": 10,
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
\`\`\`

#### Process Vendor Payout

\`\`\`
POST /api/vendors/payouts/process
\`\`\`

Request body:
\`\`\`json
{
  "vendorName": "Vendor Name",
  "amount": 100.00,
  "description": "Payout for January 2023",
  "paymentMethod": "stripe"
}
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "Payout processed successfully",
  "payout": {
    "id": 123,
    "vendor_name": "Vendor Name",
    "amount": "100.00",
    "status": "completed",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
\`\`\`

### Tax Reporting

#### Generate Tax Forms

\`\`\`
POST /api/tax-reporting/generate-forms
\`\`\`

Request body:
\`\`\`json
{
  "year": "2023",
  "vendorNames": ["Vendor Name"],
  "formType": "1099-NEC"
}
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "generated": 1,
  "total": 1,
  "results": [
    {
      "vendorName": "Vendor Name",
      "success": true,
      "formNumber": "1099-NEC-2023-VEN-ABC123",
      "formId": 123
    }
  ]
}
\`\`\`

## Vendor APIs

### Authentication

#### Vendor Login

\`\`\`
POST /api/vendor/login
\`\`\`

Request body:
\`\`\`json
{
  "vendorName": "Vendor Name",
  "password": "password123"
}
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "Login successful",
  "vendor": {
    "vendor_name": "Vendor Name",
    "email": "vendor@example.com"
  }
}
\`\`\`

#### Vendor Logout

\`\`\`
POST /api/vendor/logout
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "Logout successful"
}
\`\`\`

### Profile

#### Get Vendor Profile

\`\`\`
GET /api/vendor/profile
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "profile": {
    "vendor_name": "Vendor Name",
    "email": "vendor@example.com",
    "paypal_email": "vendor@paypal.com",
    "instagram_url": "https://instagram.com/vendor",
    "stripe_account_id": "acct_123456789",
    "onboarding_completed": true
  }
}
\`\`\`

#### Update Vendor Profile

\`\`\`
POST /api/vendor/update-profile
\`\`\`

Request body:
\`\`\`json
{
  "email": "newemail@example.com",
  "paypal_email": "newemail@paypal.com",
  "instagram_url": "https://instagram.com/newvendor"
}
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "vendor_name": "Vendor Name",
    "email": "newemail@example.com",
    "paypal_email": "newemail@paypal.com",
    "instagram_url": "https://instagram.com/newvendor"
  }
}
\`\`\`

### Stats and Sales

#### Get Vendor Stats

\`\`\`
GET /api/vendor/stats?period=this-month
\`\`\`

Query parameters:
- `period`: Time period (this-month, last-month, this-year, last-year, all-time, custom)
- `startDate`: Start date for custom period (ISO format)
- `endDate`: End date for custom period (ISO format)

Response example:
\`\`\`json
{
  "success": true,
  "stats": {
    "totalProducts": 10,
    "totalSales": 50,
    "totalRevenue": 5000.00,
    "pendingPayout": 500.00
  },
  "dateRange": {
    "start": "2023-01-01T00:00:00Z",
    "end": "2023-01-31T23:59:59Z"
  }
}
\`\`\`

#### Get Vendor Sales

\`\`\`
GET /api/vendor/sales?period=this-month
\`\`\`

Query parameters:
- `period`: Time period (this-month, last-month, this-year, last-year, all-time, custom)
- `startDate`: Start date for custom period (ISO format)
- `endDate`: End date for custom period (ISO format)

Response example:
\`\`\`json
{
  "success": true,
  "sales": [
    {
      "date": "2023-01-01",
      "count": 5,
      "revenue": 500.00
    }
  ],
  "dateRange": {
    "start": "2023-01-01T00:00:00Z",
    "end": "2023-01-31T23:59:59Z"
  }
}
\`\`\`

#### Get Vendor Sales Data

\`\`\`
GET /api/vendor/sales-data?period=this-month&page=1&pageSize=10
\`\`\`

Query parameters:
- `period`: Time period (this-month, last-month, this-year, last-year, all-time, custom)
- `startDate`: Start date for custom period (ISO format)
- `endDate`: End date for custom period (ISO format)
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10)

Response example:
\`\`\`json
{
  "success": true,
  "sales": [
    {
      "line_item_id": "123456789",
      "order_id": "ORDER123",
      "order_name": "#1001",
      "product_id": "123456789",
      "product_title": "Product Title",
      "edition_number": 42,
      "price": "100.00",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "totalCount": 50,
  "dateRange": {
    "start": "2023-01-01T00:00:00Z",
    "end": "2023-01-31T23:59:59Z"
  }
}
\`\`\`

### Payouts

#### Get Vendor Payouts

\`\`\`
GET /api/vendor/payouts
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "payouts": [
    {
      "id": 123,
      "amount": "100.00",
      "status": "completed",
      "payment_method": "stripe",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
\`\`\`

### Stripe Integration

#### Create Stripe Account

\`\`\`
POST /api/stripe/create-account
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "message": "Stripe account created successfully",
  "accountId": "acct_123456789"
}
\`\`\`

#### Get Stripe Onboarding Link

\`\`\`
GET /api/stripe/onboarding-link
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "url": "https://connect.stripe.com/setup/s/..."
}
\`\`\`

#### Check Stripe Account Status

\`\`\`
GET /api/stripe/account-status
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "status": "complete",
  "details": {
    "charges_enabled": true,
    "payouts_enabled": true,
    "requirements": {
      "currently_due": [],
      "eventually_due": [],
      "past_due": []
    }
  }
}
\`\`\`

## Public APIs

### Certificate Verification

\`\`\`
GET /api/certificate/123456789
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "certificate": {
    "lineItemId": "123456789",
    "productTitle": "Product Title",
    "editionNumber": 42,
    "editionTotal": 100,
    "customerName": "John Doe",
    "orderDate": "2023-01-01T00:00:00Z"
  }
}
\`\`\`

### NFC Tag Verification

\`\`\`
GET /api/nfc-tags/verify?tagId=NFC123
\`\`\`

Response example:
\`\`\`json
{
  "success": true,
  "tag": {
    "tag_id": "NFC123",
    "line_item_id": "123456789",
    "status": "assigned",
    "product_title": "Product Title",
    "edition_number": 42,
    "edition_total": 100
  }
}
\`\`\`

## Webhook APIs

### Shopify Order Webhook

\`\`\`
POST /api/webhooks/shopify/orders
\`\`\`

This endpoint receives webhook notifications from Shopify when orders are created, updated, or cancelled. The request body contains the order data in Shopify's format.

Headers:
- `X-Shopify-Hmac-Sha256`: Webhook signature for verification
- `X-Shopify-Topic`: Webhook topic (e.g., orders/create)
- `X-Shopify-Shop-Domain`: Shop domain

Response: Empty 200 OK response if successful

### Stripe Webhook

\`\`\`
POST /api/stripe/webhook
\`\`\`

This endpoint receives webhook notifications from Stripe for events like account updates, payout completions, etc.

Headers:
- `Stripe-Signature`: Webhook signature for verification

Response: Empty 200 OK response if successful

## Error Codes

- `400`: Bad Request - The request was invalid or cannot be served
- `401`: Unauthorized - Authentication is required or has failed
- `403`: Forbidden - The request is understood but refused
- `404`: Not Found - The requested resource does not exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - An error occurred on the server

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse. The current limits are:

- Admin APIs: 100 requests per minute
- Vendor APIs: 60 requests per minute
- Public APIs: 30 requests per minute

When a rate limit is exceeded, the API will return a 429 status code with a message indicating when the limit will reset.

## Pagination

Many endpoints that return lists of items support pagination through the following parameters:

- `page`: Page number (1-based)
- `pageSize`: Number of items per page
- `cursor`: Opaque cursor for cursor-based pagination

Cursor-based pagination is preferred for large datasets as it provides more consistent performance.

## Filtering and Sorting

List endpoints often support filtering and sorting through query parameters:

- `search`: Search term for text-based filtering
- `sortField`: Field to sort by
- `sortDirection`: Sort direction (asc or desc)

Additional filter parameters may be available for specific endpoints.

## Date Ranges

Endpoints that accept date ranges support the following formats:

- Predefined periods: this-month, last-month, this-year, last-year, all-time
- Custom ranges: startDate and endDate parameters in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)

## Versioning

The API does not currently use explicit versioning in the URL. Breaking changes will be communicated in advance.

## Support

For API support, please contact the development team.
