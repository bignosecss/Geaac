import { LogLevel } from '#engine/log/log-level'

/**
 * Minimal logging surface used by the engine and exposed to consumers.
 *
 * The five level methods are equivalent except for the severity they emit;
 * each one formats and forwards to the underlying transport (by default
 * `console`). Implementations may buffer, drop, or fan out as they see fit —
 * the contract is just "the call returns, the message goes somewhere".
 */
export type Logger = {
  /** Logger scope, used as a prefix in formatted output. */
  readonly name: string
  /** Current severity threshold. Records below this level are dropped. */
  readonly level: LogLevel
  trace(...args: unknown[]): void
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}

/**
 * {@link Logger} implementation that forwards to the corresponding
 * `console.*` method, prefixing the message with `[name]`. Suitable for
 * development and the sandbox; production deployments can swap in a
 * structured-logging implementation that satisfies {@link Logger}.
 */
export class ConsoleLogger implements Logger {
  readonly name: string
  readonly level: LogLevel

  constructor(name: string, level: LogLevel = LogLevel.TRACE) {
    this.name = name
    this.level = level
  }

  /** Emit a record at the TRACE level. Dropped if `level > LogLevel.TRACE`. */
  trace(...args: unknown[]): void {
    this.log(LogLevel.TRACE, args)
  }

  /** Emit a record at the DEBUG level. Dropped if `level > LogLevel.DEBUG`. */
  debug(...args: unknown[]): void {
    this.log(LogLevel.DEBUG, args)
  }

  /** Emit a record at the INFO level. Dropped if `level > LogLevel.INFO`. */
  info(...args: unknown[]): void {
    this.log(LogLevel.INFO, args)
  }

  /** Emit a record at the WARN level. Dropped if `level > LogLevel.WARN`. */
  warn(...args: unknown[]): void {
    this.log(LogLevel.WARN, args)
  }

  /** Emit a record at the ERROR level. Dropped if `level > LogLevel.ERROR`. */
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

/**
 * Engine's own logger instance. Prefixed `[Engine]`. Exposed so consumers can
 * see engine diagnostics without spinning up their own logger.
 */
export const coreLogger: Logger = new ConsoleLogger('Engine')

/**
 * Build a {@link Logger} with the given scope name.
 *
 * @param name   Scope name used as the `[name]` prefix on every record.
 * @param level  Optional severity threshold. Defaults to `LogLevel.TRACE`
 *               (everything passes through).
 */
export function createLogger(name: string, level?: LogLevel): Logger {
  return new ConsoleLogger(name, level ?? LogLevel.TRACE)
}
