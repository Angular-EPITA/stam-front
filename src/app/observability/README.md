# OpenTelemetry Observability Module

This directory contains all OpenTelemetry configuration and services for monitoring the STAM Frontend application.

## Files

### `otel.config.ts`
**Purpose:** Initialize and configure OpenTelemetry

**Contains:**
- WebTracerProvider setup
- OTLP Exporter configuration  
- Instrumentation for automatic tracing (Fetch, XMLHttpRequest)
- Console exporter for development
- Global tracer registration

**Usage:**
Automatically imported in `src/main.ts` - no manual setup needed.

### `otel.service.ts`
**Purpose:** Angular service for custom logging and tracing

**Key Methods:**
- `log(level, message, context?, data?)` - Internal logging
- `info(message, context?, data?)` - Info level
- `warn(message, context?, data?)` - Warning level  
- `error(message, context?, data?)` - Error level
- `debug(message, context?, data?)` - Debug level
- `flushLogs()` - Send buffered logs to OTLP collector
- `clearBuffer()` - Clear log buffer (for testing)
- `getLogBuffer()` - Get current buffer contents (for testing)

**Features:**
- Automatic console override for log capture
- Batch log sending to OTLP collector (default: every 10 logs)
- OpenTelemetry severity mapping
- Contextual logging with custom data

**Import in your components:**
```typescript
import { OtelService } from './observability/otel.service';

export class MyComponent {
  constructor(private otel: OtelService) {}
  
  doSomething() {
    this.otel.info('Doing something', 'MyComponent.doSomething');
  }
}
```

### `otel.example.ts`
**Purpose:** Reference implementation showing best practices

**Contains:**
Examples for:
- Simple logging operations
- Detailed logging with context and data
- Error tracking and handling
- Async operation tracking  
- Performance monitoring
- User action tracking
- API call tracking
- Database operation tracking
- State change tracking
- Component lifecycle tracking
- Manual log flushing

**Usage:**
Copy methods from this file to your own services. Do NOT import this file in production.

## Integration Points

### HTTP Interceptor (`../interceptors/otel.interceptor.ts`)
Automatically traces all HTTP requests:
- Method and URL
- Status code
- Duration
- Errors

Integrated in `app.config.ts` via `withInterceptors([otelInterceptor])`

### App Configuration (`../app.config.ts`)
- Imports OtelService
- Registers OtelService as singleton
- Adds otelInterceptor to HTTP pipeline

### Main Bootstrap (`../../main.ts`)
Imports `otel.config.ts` to initialize OpenTelemetry SDK

## Log Buffering

Logs are sent in batches to improve performance:
- **Threshold:** 10 logs trigger automatic flush
- **Manual flush:** Call `otelService.flushLogs()`
- **Endpoint:** `http://localhost:4318/v1/logs` (configurable)

## Attributes and Context

All logs include:
- `service.name`: "stam-front"
- `service.version`: "20.3.1"
- Timestamp in nanoseconds
- Severity level (0-24 OTLP scale)
- Optional context string
- Optional custom data

Example log sent to OTLP:
```json
{
  "resourceLogs": [{
    "resource": {
      "attributes": [
        {"key": "service.name", "value": "stam-front"},
        {"key": "service.version", "value": "20.3.1"}
      ]
    },
    "scopeLogs": [{
      "logRecords": [{
        "timeUnixNano": "1234567890000000000",
        "severityNumber": 9,
        "severityText": "INFO",
        "body": "User action detected",
        "attributes": [
          {"key": "service.name", "value": "stam-front"},
          {"key": "context", "value": "UserComponent"},
          {"key": "data", "value": "{\"userId\":\"123\",\"action\":\"click\"}"}
        ]
      }]
    }]
  }]
}
```

## Performance Considerations

- **Memory:** ~10-20 MB for log buffer
- **Network:** Minimal - batch sending
- **CPU:** <1% overhead
- **Browser:** No blocking operations

## Testing

In your tests, you can:

```typescript
// Get log buffer for assertions
const logs = this.otel.getLogBuffer();
expect(logs.length).toBe(1);
expect(logs[0].message).toContain('test');

// Clear buffer between tests
this.otel.clearBuffer();
```

## Production Deployment

For production:

1. Change OTLP endpoint in `otel.config.ts`
2. Disable console exporter if not needed
3. Adjust sampling in `otel.config.ts`:
   ```typescript
   // Only sample 10% of traces in production
   const traceSampler = () => Math.random() < 0.1;
   ```
4. Set appropriate retention in `loki-config.yaml`

## Troubleshooting

### Logs not appearing
- Check OTLP collector is running: `docker-compose ps`
- Verify endpoint URL is correct in `otel.config.ts`
- Check browser console for errors
- Check collector logs: `docker-compose logs otel-collector`

### High memory usage
- Reduce log buffer frequency from 10 to 5 in `otel.service.ts`
- Implement log sampling/filtering

### Network errors
- Ensure collector is accessible from browser
- Check CORS if collector is on different domain
- Use HTTP/1.1 if gRPC fails

## Related Files

- [OBSERVABILITY.md](../OBSERVABILITY.md) - Complete observability guide
- [QUICK_START.md](../QUICK_START.md) - Quick start guide  
- [otel-collector-config.yaml](../otel-collector-config.yaml) - Collector config
- [docker-compose.yml](../docker-compose.yml) - Docker services
