# Webhook Integration Guide

## Overview

The Street Collector platform provides a robust webhook integration system that allows external services to receive real-time updates about platform events.

## Key Features

- Event-driven architecture
- Secure webhook management
- Comprehensive delivery tracking
- Retry mechanism for failed deliveries
- Admin-controlled webhook destinations

## Supported Events

### Order Events
- `order.created`: Triggered when a new order is placed
- `order.updated`: Fired when an order's status changes
- `order.cancelled`: Sent when an order is cancelled

### Product Events
- `product.created`: Triggered when a new product is added
- `product.updated`: Fired when product details are modified
- `product.deleted`: Sent when a product is removed

### Vendor Events
- `vendor.status_changed`: Triggered when a vendor's status is updated
- `vendor.registration`: Fired when a new vendor registers
- `vendor.profile_updated`: Sent when vendor profile details change

### Certificate Events
- `certificate.issued`: Triggered when a new certificate is created
- `certificate.transferred`: Fired when a certificate changes ownership
- `certificate.validated`: Sent when a certificate is verified

### Payment Events
- `payment.processed`: Triggered when a payment is completed
- `payment.refunded`: Fired when a refund is processed
- `payment.failed`: Sent when a payment encounters an error

## Webhook Payload Structure

```typescript
interface WebhookPayload {
  event: string;           // Event type
  timestamp: number;       // Unix timestamp
  data: any;               // Event-specific payload
  source: string;          // Platform identifier
}
```

### Example Payload

```json
{
  "event": "order.created",
  "timestamp": 1623456789,
  "data": {
    "orderId": "ord_123456",
    "productId": "prod_789012",
    "customerId": "cust_345678",
    "total": 1500.00
  },
  "source": "street-collector-platform"
}
```

## Webhook Management

### Registering a Webhook

```typescript
import { webhookManager, WebhookEventType } from './webhooks/webhook-manager'

await webhookManager.registerWebhook({
  url: 'https://your-service.com/webhook',
  secret: 'your_secure_secret',
  events: [
    WebhookEventType.ORDER_CREATED,
    WebhookEventType.PRODUCT_UPDATED
  ]
})
```

### Unregistering a Webhook

```typescript
await webhookManager.unregisterWebhook('webhook_destination_id')
```

## Security Considerations

- Each webhook has a unique secret key
- HTTPS is required for webhook endpoints
- Payload includes a timestamp to prevent replay attacks
- Webhook destinations are admin-controlled

### Webhook Secret Validation

Implement secret validation in your webhook receiver:

```typescript
function validateWebhookSecret(
  receivedSecret: string, 
  expectedSecret: string
): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(receivedSecret),
    Buffer.from(expectedSecret)
  )
}
```

## Delivery Tracking

Webhooks are tracked with the following statuses:
- `PENDING`: Waiting to be delivered
- `SUCCESS`: Successfully delivered
- `FAILED`: Delivery attempt failed
- `RETRY_EXHAUSTED`: Maximum retry attempts reached

### Retry Mechanism

- Maximum of 3 retry attempts
- Exponential backoff between retries
- Comprehensive logging of delivery attempts

## Error Handling

### Recommended Webhook Endpoint Response

```typescript
app.post('/webhook', (req, res) => {
  try {
    // Validate webhook secret
    // Process webhook payload
    res.status(200).json({ status: 'received' })
  } catch (error) {
    res.status(400).json({ error: 'Invalid webhook' })
  }
})
```

## Monitoring and Logging

- All webhook delivery attempts are logged
- Detailed error tracking
- Performance metrics captured

## Best Practices

1. Use HTTPS for webhook endpoints
2. Implement robust error handling
3. Keep webhook receivers idempotent
4. Respond quickly to webhook requests
5. Log and monitor webhook interactions

## Troubleshooting

- Check webhook destination configuration
- Verify endpoint accessibility
- Review delivery logs
- Ensure proper secret management

## Rate Limits

- Maximum 100 webhook events per minute
- Burst limit of 250 events
- Exceeded limits result in temporary blocking

## Version and Compatibility

- Current Webhook API Version: 1.0.0
- Minimum Platform Version: 1.0.0
- Last Updated: ${new Date().toISOString()}

## Support and Contact

For webhook integration support:
- Email: webhooks@streetcollector.com
- Slack: #webhooks-support

## Future Roadmap

- Webhook event filtering
- Advanced retry configurations
- Real-time webhook status dashboard
- Improved error diagnostics

## Legal and Compliance

Webhook usage is subject to our [Terms of Service](/TERMS_OF_SERVICE.md). 