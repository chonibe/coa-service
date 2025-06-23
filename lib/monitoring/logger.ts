import { createClient } from '@supabase/supabase-js'

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Log entry interface
export interface LogEntry {
  id?: string
  timestamp: number
  level: LogLevel
  message: string
  context?: Record<string, any>
  source: string
  traceId?: string
}

// Performance tracking interface
export interface PerformanceMetric {
  id?: string
  timestamp: number
  operation: string
  duration: number
  status: 'SUCCESS' | 'FAILURE'
  errorMessage?: string
}

// Error tracking interface
export interface ErrorTrackingEntry {
  id?: string
  timestamp: number
  errorType: string
  message: string
  stackTrace?: string
  context?: Record<string, any>
  severity: LogLevel
}

export class Logger {
  private supabase: ReturnType<typeof createClient>
  private static instance: Logger
  private defaultSource: string

  private constructor(source: string = 'street-collector-platform') {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.defaultSource = source
  }

  // Singleton pattern
  public static getInstance(source?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(source)
    }
    return Logger.instance
  }

  // Safely stringify context
  private safeStringifyContext(context?: Record<string, any>): string {
    if (!context || Object.keys(context).length === 0) {
      return '{}'
    }
    try {
      return JSON.stringify(context)
    } catch {
      return '{}'
    }
  }

  // Log an entry
  async log(
    level: LogLevel, 
    message: string, 
    context?: Record<string, any>,
    source?: string
  ): Promise<void> {
    const logEntry: Record<string, any> = {
      timestamp: Date.now(),
      level,
      message,
      context: this.safeStringifyContext(context),
      source: source || this.defaultSource,
      traceId: this.generateTraceId()
    }

    try {
      const { error } = await this.supabase
        .from('system_logs')
        .insert(logEntry)

      if (error) {
        console.error('Failed to log entry:', error)
      }

      // Console output for local development
      this.consoleLog({
        ...logEntry,
        context: context || {}
      } as LogEntry)
    } catch (err) {
      console.error('Logging system error:', err)
    }
  }

  // Track performance metrics
  async trackPerformance(
    operation: string, 
    startTime: number, 
    status: 'SUCCESS' | 'FAILURE' = 'SUCCESS',
    errorMessage?: string
  ): Promise<void> {
    const duration = Date.now() - startTime

    const performanceMetric: Record<string, any> = {
      timestamp: Date.now(),
      operation,
      duration,
      status,
      errorMessage: errorMessage || null
    }

    try {
      const { error } = await this.supabase
        .from('performance_metrics')
        .insert(performanceMetric)

      if (error) {
        console.error('Failed to track performance:', error)
      }
    } catch (err) {
      console.error('Performance tracking error:', err)
    }
  }

  // Track and log errors
  async trackError(
    error: Error, 
    context?: Record<string, any>,
    severity: LogLevel = LogLevel.ERROR
  ): Promise<void> {
    const errorEntry: Record<string, any> = {
      timestamp: Date.now(),
      errorType: error.name,
      message: error.message,
      stackTrace: error.stack || null,
      context: this.safeStringifyContext(context),
      severity
    }

    try {
      const { error: dbError } = await this.supabase
        .from('error_tracking')
        .insert(errorEntry)

      if (dbError) {
        console.error('Failed to track error:', dbError)
      }

      // Potentially trigger alert for critical errors
      if (severity === LogLevel.CRITICAL) {
        await this.triggerCriticalAlert(errorEntry as ErrorTrackingEntry)
      }
    } catch (err) {
      console.error('Error tracking system error:', err)
    }
  }

  // Generate unique trace ID
  private generateTraceId(): string {
    return crypto.randomUUID()
  }

  // Console logging with color and formatting
  private consoleLog(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`\x1b[34m[${timestamp}] DEBUG:\x1b[0m ${entry.message}`)
        break
      case LogLevel.INFO:
        console.info(`\x1b[32m[${timestamp}] INFO:\x1b[0m ${entry.message}`)
        break
      case LogLevel.WARN:
        console.warn(`\x1b[33m[${timestamp}] WARN:\x1b[0m ${entry.message}`)
        break
      case LogLevel.ERROR:
        console.error(`\x1b[31m[${timestamp}] ERROR:\x1b[0m ${entry.message}`)
        break
      case LogLevel.CRITICAL:
        console.error(`\x1b[41m[${timestamp}] CRITICAL:\x1b[0m ${entry.message}`)
        break
    }

    // Log context if available
    if (entry.context && Object.keys(entry.context).length > 0) {
      console.debug('Context:', entry.context)
    }
  }

  // Trigger critical alert (e.g., email, SMS, external service)
  private async triggerCriticalAlert(
    errorEntry: ErrorTrackingEntry
  ): Promise<void> {
    // Placeholder for external alert system
    // Could integrate with services like PagerDuty, Slack, etc.
    console.warn('CRITICAL ALERT:', errorEntry)
  }

  // Retrieve log entries with advanced filtering
  async getLogs(
    filters?: {
      level?: LogLevel
      startDate?: Date
      endDate?: Date
      source?: string
    },
    limit: number = 100
  ): Promise<LogEntry[]> {
    let query = this.supabase
      .from('system_logs')
      .select('*')
      .limit(limit)

    if (filters?.level) {
      query = query.eq('level', filters.level)
    }

    if (filters?.startDate) {
      query = query.gte('timestamp', filters.startDate.getTime())
    }

    if (filters?.endDate) {
      query = query.lte('timestamp', filters.endDate.getTime())
    }

    if (filters?.source) {
      query = query.eq('source', filters.source)
    }

    const { data, error } = await query.order('timestamp', { ascending: false })

    if (error) {
      throw new Error(`Failed to retrieve logs: ${error.message}`)
    }

    // Transform data to LogEntry type with safe parsing
    return (data || []).map(entry => ({
      ...entry,
      context: this.safeParseContext(entry.context as string | undefined)
    })) as LogEntry[]
  }

  // Safely parse context
  private safeParseContext(contextStr?: string): Record<string, any> {
    if (!contextStr) return {}
    try {
      return JSON.parse(contextStr)
    } catch {
      return {}
    }
  }
}

// Utility function for performance tracking
export function trackPerformance<T>(
  operation: string, 
  fn: () => Promise<T>
): Promise<T> {
  const logger = Logger.getInstance()
  const startTime = Date.now()

  return fn()
    .then(result => {
      logger.trackPerformance(operation, startTime)
      return result
    })
    .catch(error => {
      logger.trackPerformance(
        operation, 
        startTime, 
        'FAILURE', 
        error.message
      )
      throw error
    })
}

// Singleton logger instance
export const logger = Logger.getInstance() 