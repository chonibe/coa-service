# Monitoring and Logging System

## Overview

The monitoring and logging system is a comprehensive solution for tracking, logging, and analyzing system events, performance metrics, and errors in the Street Collector platform.

## Key Components

### 1. Logger

The `Logger` class provides a robust, centralized logging mechanism with the following features:

- Singleton pattern for global access
- Multiple log levels (DEBUG, INFO, WARN, ERROR, CRITICAL)
- Contextual logging
- Performance tracking
- Error tracking
- Supabase integration for persistent logging

#### Log Levels

- `DEBUG`: Detailed information for debugging
- `INFO`: General information about system operations
- `WARN`: Potential issues that don't prevent system functioning
- `ERROR`: Significant problems that require attention
- `CRITICAL`: Severe issues that may require immediate intervention

### 2. Webhook Manager

The `WebhookManager` provides a robust system for managing and delivering webhooks:

- Event-driven webhook triggering
- Retry mechanism
- Delivery tracking
- Secure secret management

## Usage Examples

### Logging

```typescript
import { logger, LogLevel } from './monitoring/logger'

// Basic logging
logger.log(LogLevel.INFO, 'User login', { userId: '123' })

// Error tracking
try {
  // Some operation
} catch (error) {
  logger.trackError(error, { context: 'User authentication' })
}

// Performance tracking
const result = await trackPerformance('database_query', async () => {
  return await database.query()
})
```

### Webhook Integration

```typescript
import { webhookManager, WebhookEventType } from './webhooks/webhook-manager'

// Register a webhook
await webhookManager.registerWebhook({
  url: 'https://example.com/webhook',
  secret: 'your_secret',
  events: [WebhookEventType.ORDER_CREATED]
})

// Trigger a webhook
await webhookManager.triggerWebhook(
  WebhookEventType.ORDER_CREATED, 
  { orderId: '123', details: {...} }
)
```

## Configuration

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Database Schema

### system_logs

| Column     | Type    | Description                      |
|------------|---------|----------------------------------|
| id         | UUID    | Unique log entry identifier      |
| timestamp  | BIGINT  | Log entry timestamp              |
| level      | STRING  | Log level (DEBUG, INFO, etc.)    |
| message    | STRING  | Log message                      |
| context    | JSONB   | Contextual information           |
| source     | STRING  | Source of the log entry          |
| traceId    | UUID    | Trace identifier                 |

### performance_metrics

| Column       | Type    | Description                      |
|--------------|---------|----------------------------------|
| id           | UUID    | Unique metric identifier         |
| timestamp    | BIGINT  | Metric timestamp                 |
| operation    | STRING  | Operation being measured         |
| duration     | BIGINT  | Operation duration (ms)          |
| status       | STRING  | Operation status                 |
| errorMessage | STRING  | Error message (if applicable)    |

### error_tracking

| Column       | Type    | Description                      |
|--------------|---------|----------------------------------|
| id           | UUID    | Unique error entry identifier    |
| timestamp    | BIGINT  | Error timestamp                  |
| errorType    | STRING  | Type of error                    |
| message      | STRING  | Error message                    |
| stackTrace   | TEXT    | Full stack trace                 |
| context      | JSONB   | Contextual information           |
| severity     | STRING  | Error severity level             |

## Best Practices

1. Always include contextual information in logs
2. Use appropriate log levels
3. Avoid logging sensitive information
4. Implement proper error handling
5. Regularly review and analyze logs

## Monitoring and Alerting

- Critical errors trigger immediate alerts
- Performance metrics are tracked and can be analyzed
- Comprehensive logging for debugging and auditing

## Future Improvements

- External alerting system integration
- Advanced log filtering and searching
- Machine learning-based anomaly detection
- Real-time dashboard for system health

## Security Considerations

- Logs are stored securely in Supabase
- Sensitive information is not logged
- Webhook secrets are managed securely
- Rate limiting and error tracking prevent abuse

## Troubleshooting

- Check environment variables
- Verify Supabase connection
- Review log levels and configuration
- Monitor performance metrics

## Version

- Current Version: 1.0.0
- Last Updated: ${new Date().toISOString()} 