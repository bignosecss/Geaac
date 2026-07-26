import { coreLogger } from '#engine/log/index'

export type ApplicationConfig = {
  readonly name: string
  readonly canvas: HTMLCanvasElement
}

export class Application {
  readonly name: string
  readonly canvas: HTMLCanvasElement
  private running = false
  private rAFId: number | null = null

  constructor(config: ApplicationConfig) {
    this.name = config.name
    this.canvas = config.canvas
    coreLogger.info(`Created application: ${this.name}`)
  }

  run(): void {
    if (this.running) {
      coreLogger.warn('Application is already running')
      return
    }
    this.running = true
    coreLogger.info('Main loop started')
    this.rAFId = requestAnimationFrame(() => this.tick())
  }

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

export function createApplication(config: ApplicationConfig): Application {
  return new Application(config)
}
