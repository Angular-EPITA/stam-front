import { WebTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
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
        requestHook: (span, request) => {
          span.setAttribute('http.url', request.url);
          span.setAttribute('http.method', request.method);
        },
        responseHook: (span, response) => {
          span.setAttribute('http.status_code', response.status);
        }
      }),
      new XMLHttpRequestInstrumentation({
        requestHook: (span, request) => {
          span.setAttribute('http.method', request.method);
          span.setAttribute('http.url', request.url);
        },
        responseHook: (span, xhr) => {
          span.setAttribute('http.status_code', xhr.status);
        }
      })
    ]
  });

  // Make tracer globally available
  const tracer = provider.getTracer('stam-front-tracer');
  (window as any).OTEL_TRACER = tracer;
  (window as any).OTEL_PROVIDER = provider;
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
