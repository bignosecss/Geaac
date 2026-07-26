import { LogLevel } from '#engine/log/log-level'

export type Logger = {
  readonly name: string
  readonly level: LogLevel
  trace(...args: unknown[]): void
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}

export class ConsoleLogger implements Logger {
  readonly name: string
  readonly level: LogLevel

  constructor(name: string, level: LogLevel = LogLevel.TRACE) {
    this.name = name
    this.level = level
  }

  trace(...args: unknown[]): void {
    this.log(LogLevel.TRACE, args)
  }

  debug(...args: unknown[]): void {
    this.log(LogLevel.DEBUG, args)
  }

  info(...args: unknown[]): void {
    this.log(LogLevel.INFO, args)
  }

  warn(...args: unknown[]): void {
    this.log(LogLevel.WARN, args)
  }

  error(...args: unknown[]): void {
    this.log(LogLevel.ERROR, args)
  }

  private log(level: LogLevel, args: unknown[]): void {
    if (level < this.level) return

    const prefix = `[${this.name}]`

    switch (level) {
      case LogLevel.TRACE:
        console.trace(prefix, ...args)
        break
      case LogLevel.DEBUG:
        console.debug(prefix, ...args)
        break
      case LogLevel.INFO:
        console.info(prefix, ...args)
        break
      case LogLevel.WARN:
        console.warn(prefix, ...args)
        break
      case LogLevel.ERROR:
        console.error(prefix, ...args)
        break
    }
  }
}

export const coreLogger: Logger = new ConsoleLogger('Engine')

export function createLogger(name: string, level?: LogLevel): Logger {
  return new ConsoleLogger(name, level ?? LogLevel.TRACE)
}
