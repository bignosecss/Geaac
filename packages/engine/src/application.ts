export type Application = {
  readonly name: string
}

export type ApplicationConfig = {
  readonly name: string
}

export function createApplication(config: ApplicationConfig): Application {
  return {
    name: config.name,
  }
}
