import { WebTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import type { Span } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

// Initialize OpenTelemetry configuration
const initializeOpenTelemetry = (): void => {
  // Create a resource describing this service
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'stam-front',
      [SemanticResourceAttributes.SERVICE_VERSION]: '20.3.1'
    })
  );

  // Create and configure the trace provider
  const provider = new WebTracerProvider({ resource });

  // Determine OTLP endpoint based on environment
  const otlpEndpoint =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4318/v1/traces`
      : 'http://localhost:4318/v1/traces';

  // Add OTLP exporter for production
  const otlpExporter = new OTLPTraceExporter({
    url: otlpEndpoint
  });

  // Add console exporter for development/debugging
  const consoleExporter = new ConsoleSpanExporter();

  // Add span processors
  provider.addSpanProcessor(new SimpleSpanProcessor(otlpExporter));

  // Only add console exporter in development
  if (!isProduction()) {
    provider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter));
  }

  // Register the provider globally
  provider.register();

  // Register instrumentations for automatic tracing
  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        applyCustomAttributesOnSpan: (span: Span, request: Request | RequestInit, result) => {
          const url = request instanceof Request ? request.url : undefined;
          const method = request instanceof Request ? request.method : undefined;

          if (url) span.setAttribute('http.url', url);
          if (method) span.setAttribute('http.method', method);

          const status = (result as unknown as Record<string, unknown>)?.['status'];
          if (typeof status === 'number') {
            span.setAttribute('http.status_code', status);
          }
        }
      }),
      new XMLHttpRequestInstrumentation({
        applyCustomAttributesOnSpan: (span: Span, xhr: XMLHttpRequest) => {
          const url = (xhr as unknown as Record<string, unknown>)?.['responseURL'];
          if (typeof url === 'string' && url.length > 0) {
            span.setAttribute('http.url', url);
          }

          const status = (xhr as unknown as Record<string, unknown>)?.['status'];
          if (typeof status === 'number') {
            span.setAttribute('http.status_code', status);
          }
        }
      })
    ]
  });

  // Make tracer globally available
  const tracer = provider.getTracer('stam-front-tracer');
  (window as unknown as Record<string, unknown>)['OTEL_TRACER'] = tracer;
  (window as unknown as Record<string, unknown>)['OTEL_PROVIDER'] = provider;
};

/**
 * Check if running in production environment
 */
const isProduction = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  );
};

// Initialize on module load
try {
  initializeOpenTelemetry();
} catch (error) {
  console.error('Failed to initialize OpenTelemetry:', error);
}

export { initializeOpenTelemetry };
