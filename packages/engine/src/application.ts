import { coreLogger } from '#engine/log/index'

/**
 * Construction-time inputs for {@link Application}.
 */
export type ApplicationConfig = {
  /** Human-readable name, used as the logger scope and in diagnostics. */
  readonly name: string
  /**
   * The host-owned canvas the engine will draw into. The engine treats this
   * element as opaque: it never queries the DOM to discover a canvas on its
   * own — the consumer owns DOM placement.
   */
  readonly canvas: HTMLCanvasElement
}

/**
 * Top-level engine host. Owns the main loop and the lifecycle from `run` to
 * `close`. Created via {@link createApplication} or directly with a config.
 */
export class Application {
  /** Human-readable name passed at construction. */
  readonly name: string
  /** The host-owned canvas this application renders into. */
  readonly canvas: HTMLCanvasElement
  private running = false
  private rAFId: number | null = null

  constructor(config: ApplicationConfig) {
    this.name = config.name
    this.canvas = config.canvas
    coreLogger.info(`Created application: ${this.name}`)
  }

  /**
   * Start the main loop. Idempotent: calling `run` while already running logs
   * a warning and returns without side effects.
   */
  run(): void {
    if (this.running) {
      coreLogger.warn('Application is already running')
      return
    }
    this.running = true
    coreLogger.info('Main loop started')
    this.rAFId = requestAnimationFrame(() => this.tick())
  }

  /**
   * Stop the main loop and release the pending animation frame. Safe to call
   * when the application is not running. After `close`, `run` may be called
   * again to restart the loop.
   */
  close(): void {
    if (this.rAFId !== null) {
      cancelAnimationFrame(this.rAFId)
      this.rAFId = null
    }
    this.running = false
    coreLogger.info('Application closed')
  }

  private tick(): void {
    this.rAFId = requestAnimationFrame(() => this.tick())
  }
}

/**
 * Convenience factory for {@link Application}. Equivalent to
 * `new Application(config)`; preferred at composition sites to keep the
 * `new` keyword out of consumer code.
 */
export function createApplication(config: ApplicationConfig): Application {
  return new Application(config)
}
