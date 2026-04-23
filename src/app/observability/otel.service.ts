import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OtelService {
  private readonly originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };

  private logBuffer: {
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    context?: string;
    data?: Record<string, unknown>;
  }[] = [];

  private flushTimer: number | null = null;
  private readonly flushIntervalMs = 5000;
  private readonly flushDebounceMs = 500;
  private readonly heartbeatIntervalMs = 60000;
  private startTimestamp = Date.now();

  constructor() {
    this.initializeLogger();
    this.installAutoFlush();
    this.debug('OtelService initialized', 'APP_INIT', {
      href: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }

  private initializeLogger(): void {
    console.log = (...args) => {
      this.log('info', args.join(' '));
      this.originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.log('warn', args.join(' '));
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.log('error', args.join(' '));
      this.originalConsole.error(...args);
    };

    console.debug = (...args) => {
      this.log('debug', args.join(' '));
      this.originalConsole.debug(...args);
    };
  }

  private installAutoFlush(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.setInterval(() => {
      this.flushLogs();
    }, this.flushIntervalMs);

    window.setInterval(() => {
      const uptimeMs = Date.now() - this.startTimestamp;
      this.debug('heartbeat', 'APP_HEARTBEAT', { uptime_ms: uptimeMs });
    }, this.heartbeatIntervalMs);

    const flushNow = () => this.flushLogs();
    window.addEventListener('beforeunload', flushNow);
    window.addEventListener('pagehide', flushNow);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushLogs();
      }
    });
  }

  private scheduleFlush(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.flushTimer != null) {
      return;
    }

    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null;
      this.flushLogs();
    }, this.flushDebounceMs);
  }

  /**
   * Log a message with optional context and data
   */
  public log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    const logEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      data
    };

    this.logBuffer.push(logEntry);

    // Flush quickly for important logs, otherwise batch
    if (level !== 'debug' || this.logBuffer.length >= 10) {
      this.scheduleFlush();
    }

    // Also log to OpenTelemetry API if available
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>)['OTEL_LOGGER']) {
      const logger = (window as unknown as Record<string, unknown>)['OTEL_LOGGER'] as {
        emit: (record: Record<string, unknown>) => void;
      };
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
      this.originalConsole.error('Failed to send logs to OTLP collector:', error);
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
  public info(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('info', message, context, data);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('warn', message, context, data);
  }

  /**
   * Log error message
   */
  public error(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('error', message, context, data);
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: string, data?: Record<string, unknown>): void {
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
