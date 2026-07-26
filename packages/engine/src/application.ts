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
  private frameCount = 0

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
    this.rAFId = requestAnimationFrame((t) => this.tick(t))
  }

  close(): void {
    if (this.rAFId !== null) {
      cancelAnimationFrame(this.rAFId)
      this.rAFId = null
    }
    this.running = false
    this.frameCount = 0
    coreLogger.info('Application closed')
  }

  private tick(_time: DOMHighResTimeStamp): void {
    void _time
    coreLogger.trace(`Frame ${this.frameCount}`)
    this.frameCount++
    this.rAFId = requestAnimationFrame((t) => this.tick(t))
  }
}

export function createApplication(config: ApplicationConfig): Application {
  return new Application(config)
}
