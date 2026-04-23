import { Injectable, inject } from '@angular/core';
import { OtelService } from '../observability/otel.service';

/**
 * Example usage of OtelService for monitoring and tracing application behavior
 * Copy methods from here to your own services
 */
@Injectable({
  providedIn: 'root'
})
export class ObservabilityExampleService {
  private readonly otel = inject(OtelService);

  constructor() {
    this.otel.info('ObservabilityExampleService initialized', 'ObservabilityExampleService');
  }

  /**
   * Example: Log simple operations
   */
  exampleSimpleLogging(): void {
    this.otel.info('Starting simple operation', 'exampleSimpleLogging');
    
    // Do work...
    const result = 42;
    
    this.otel.debug(`Operation result: ${result}`, 'exampleSimpleLogging');
  }

  /**
   * Example: Log with context and data
   */
  exampleDetailedLogging(userId: string, action: string): void {
    const startTime = performance.now();
    
    this.otel.info(
      `User action: ${action}`,
      'exampleDetailedLogging',
      {
        userId,
        action,
        timestamp: new Date().toISOString()
      }
    );

    // Simulate work
    setTimeout(() => {
      const duration = performance.now() - startTime;
      this.otel.info(
        `Action completed`,
        'exampleDetailedLogging',
        {
          userId,
          action,
          duration: `${duration.toFixed(2)}ms`
        }
      );
    }, 100);
  }

  /**
   * Example: Error tracking
   */
  exampleErrorHandling(): void {
    try {
      // Code that might fail
      void (null as unknown as Record<string, Record<string, unknown>>).someProperty.value;
    } catch (error) {
      this.otel.error(
        `Error occurred: ${(error as Error).message}`,
        'exampleErrorHandling',
        {
          errorType: (error as Error).constructor.name,
          errorStack: (error as Error).stack?.substring(0, 200)
        }
      );
    }
  }

  /**
   * Example: Async operation tracking
   */
  async exampleAsyncOperation(): Promise<void> {
    this.otel.debug('Starting async operation', 'exampleAsyncOperation');
    
    const startTime = performance.now();
    
    try {
      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const duration = performance.now() - startTime;
      this.otel.info(
        'Async operation completed',
        'exampleAsyncOperation',
        { duration: `${duration.toFixed(2)}ms` }
      );
    } catch (error) {
      this.otel.error(
        'Async operation failed',
        'exampleAsyncOperation',
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Example: Performance monitoring
   */
  examplePerformanceMonitoring(): void {
    const measurements: Record<string, number> = {};
    
    // Track multiple operations
    const operations = ['parse', 'process', 'render'];
    
    operations.forEach((op) => {
      const time = performance.now();
      // Simulate operation
      measurements[op] = performance.now() - time;
    });

    this.otel.info(
      'Performance metrics',
      'examplePerformanceMonitoring',
      measurements
    );
  }

  /**
   * Example: User action tracking
   */
  trackUserAction(
    actionType: 'click' | 'form_submit' | 'navigation',
    actionName: string,
    metadata?: Record<string, unknown>
  ): void {
    this.otel.info(
      `User action: ${actionName}`,
      'trackUserAction',
      {
        actionType,
        actionName,
        ...metadata
      }
    );
  }

  /**
   * Example: API call tracking
   * Note: HTTP calls are automatically traced via otelInterceptor
   * This is for additional context
   */
  trackApiCall(
    method: string,
    endpoint: string,
    status: number,
    duration: number
  ): void {
    const logLevel = status >= 400 ? 'error' : 'info';
    
    this.otel[logLevel](
      `API ${method} ${endpoint}`,
      'trackApiCall',
      {
        method,
        endpoint,
        status,
        duration: `${duration.toFixed(2)}ms`,
        success: status < 400
      }
    );
  }

  /**
   * Example: Database operation tracking
   */
  trackDatabaseOperation(
    operation: 'query' | 'insert' | 'update' | 'delete',
    table: string,
    duration: number,
    success: boolean
  ): void {
    this.otel.info(
      `Database ${operation} on ${table}`,
      'trackDatabaseOperation',
      {
        operation,
        table,
        duration: `${duration.toFixed(2)}ms`,
        success
      }
    );
  }

  /**
   * Example: State change tracking (Redux, NgRx, etc.)
   */
  trackStateChange(
    store: string,
    action: string,
    oldState: Record<string, unknown>,
    newState: Record<string, unknown>
  ): void {
    this.otel.debug(
      `State change in ${store}: ${action}`,
      'trackStateChange',
      {
        store,
        action,
        changedFields: Object.keys(newState).filter(
          (key) => oldState[key] !== newState[key]
        )
      }
    );
  }

  /**
   * Example: Component lifecycle tracking
   */
  trackComponentLifecycle(
    componentName: string,
    lifecycle: 'init' | 'destroy' | 'change'
  ): void {
    this.otel.debug(
      `Component ${lifecycle}: ${componentName}`,
      'trackComponentLifecycle',
      {
        component: componentName,
        lifecycle,
        timestamp: performance.now()
      }
    );
  }

  /**
   * Example: Flush logs manually if needed
   */
  flushAllLogs(): void {
    this.otel.flushLogs();
    this.otel.info('Logs manually flushed', 'flushAllLogs');
  }
}
