import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { OtelService } from '../observability/otel.service';
import { tap } from 'rxjs';
import type { Tracer } from '@opentelemetry/api';

/**
 * HTTP Interceptor for OpenTelemetry tracing
 * Automatically traces all HTTP requests and logs them
 */
export const otelInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const otelService = inject(OtelService);

  // Get the global tracer if available
  const tracer = (window as unknown as { OTEL_TRACER?: Tracer }).OTEL_TRACER;

  // Create a span for this HTTP request
  const span = tracer?.startSpan(`HTTP ${req.method}`, {
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.target': new URL(req.url, window.location.href).pathname
    }
  });

  const startTime = performance.now();

  // Log the request
  otelService.debug(`HTTP ${req.method} ${req.url}`, 'HTTP_REQUEST', {
    url: req.url,
    method: req.method
  });

  return next(req).pipe(
    tap({
      next: (event: HttpEvent<unknown>) => {
        // Log on response (only HttpResponse has status)
        if (event instanceof HttpResponse) {
          const duration = performance.now() - startTime;

          // Update span attributes
          if (span) {
            span.setAttributes({
              'http.status_code': event.status,
              'http.duration_ms': duration
            });
            span.end();
          }

          otelService.debug(
            `HTTP ${req.method} ${req.url} - ${event.status}`,
            'HTTP_RESPONSE',
            {
              status: event.status,
              duration: `${duration.toFixed(2)}ms`
            }
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        // Log errors
        const duration = performance.now() - startTime;

        if (span) {
          span.setAttributes({
            'http.status_code': error.status || 0,
            'http.duration_ms': duration,
            'error': true
          });
          span.end();
        }

        otelService.error(
          `HTTP ${req.method} ${req.url} failed`,
          'HTTP_ERROR',
          {
            status: error.status,
            error: error.message,
            duration: `${duration.toFixed(2)}ms`
          }
        );
      }
    })
  );
};
