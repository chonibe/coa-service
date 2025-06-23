# Street Collector API Documentation

## Overview
The Street Collector API provides a comprehensive, headless backend for managing digital art collections, vendor interactions, and user experiences.

## Authentication

### Authentication Mechanism
- JWT-based authentication
- Role-based access control
- Secure token management

#### User Roles
- `ADMIN`: Full system access
- `VENDOR`: Product and sales management
- `CUSTOMER`: Personal dashboard and order interactions
- `GUEST`: Limited access

### Authentication Endpoints
| Endpoint | Method | Description | Roles Allowed |
|----------|--------|-------------|--------------|
| `/api/v1/auth/login` | POST | User authentication | ALL |
| `/api/v1/auth/register` | POST | User registration | ALL |
| `/api/v1/auth/refresh` | POST | Token refresh | ALL |

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