export type Application = {
  readonly name: string
  readonly canvas: HTMLCanvasElement
}

export type ApplicationConfig = {
  readonly name: string
  readonly canvas: HTMLCanvasElement
}

export function createApplication(config: ApplicationConfig): Application {
  return {
    name: config.name,
    canvas: config.canvas,
  }
}
