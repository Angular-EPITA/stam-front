import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OtelService {
  private logBuffer: Array<{
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    context?: string;
    data?: any;
  }> = [];

  constructor() {
    this.initializeLogger();
  }

  private initializeLogger(): void {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;

    console.log = (...args) => {
      this.log('info', args.join(' '));
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      this.log('warn', args.join(' '));
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      this.log('error', args.join(' '));
      originalError.apply(console, args);
    };

    console.debug = (...args) => {
      this.log('debug', args.join(' '));
      originalDebug.apply(console, args);
    };
  }

  /**
   * Log a message with optional context and data
   */
  public log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context?: string,
    data?: any
  ): void {
    const logEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      data
    };

    this.logBuffer.push(logEntry);

    // Send to OTLP collector if buffer reaches threshold
    if (this.logBuffer.length >= 10) {
      this.flushLogs();
    }

    // Also log to OpenTelemetry API if available
    if (typeof window !== 'undefined' && (window as any).OTEL_LOGGER) {
      const logger = (window as any).OTEL_LOGGER;
      logger.emit({
        severityNumber: this.getSeverityNumber(level),
        severityText: level.toUpperCase(),
        body: message,
        attributes: {
          'service.name': 'stam-front',
          'app.context': context,
          ...data
        }
      });
    }
  }

  /**
   * Flush logs to OTLP collector
   */
  public flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    // Send logs to OTLP HTTP endpoint
    const endpoint =
      typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:4318/v1/logs`
        : 'http://localhost:4318/v1/logs';

    const payload = {
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'stam-front' } },
              {
                key: 'service.version',
                value: { stringValue: '20.3.1' }
              }
            ]
          },
          scopeLogs: [
            {
              scope: {
                name: 'stam-front-logger',
                version: '1.0.0'
              },
              logRecords: logsToSend.map((log) => ({
                timeUnixNano: String(log.timestamp * 1000000),
                severityNumber: this.getSeverityNumber(log.level),
                severityText: log.level.toUpperCase(),
                body: { stringValue: log.message },
                attributes: [
                  { key: 'service.name', value: { stringValue: 'stam-front' } },
                  ...(log.context
                    ? [{ key: 'context', value: { stringValue: log.context } }]
                    : []),
                  ...(log.data
                    ? [
                        {
                          key: 'data',
                          value: { stringValue: JSON.stringify(log.data) }
                        }
                      ]
                    : [])
                ]
              }))
            }
          ]
        }
      ]
    };

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch((error) => {
      // Silently fail if collector is not available
      console.error('Failed to send logs to OTLP collector:', error);
    });
  }

  /**
   * Get OpenTelemetry severity number for log level
   */
  private getSeverityNumber(
    level: 'info' | 'warn' | 'error' | 'debug'
  ): number {
    const severityMap = {
      debug: 5,
      info: 9,
      warn: 13,
      error: 17
    };
    return severityMap[level] || 0;
  }

  /**
   * Log info message
   */
  public info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  /**
   * Log error message
   */
  public error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data);
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data);
  }

  /**
   * Get current log buffer (for testing)
   */
  public getLogBuffer(): typeof this.logBuffer {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  public clearBuffer(): void {
    this.logBuffer = [];
  }
}
