import { ENGINE_VERSION } from '@geaac/engine'

import type { Application } from '@geaac/engine'

type AppProps = {
  application: Application
}

export function App({ application }: AppProps) {
  return (
    <main className="app">
      <h1>{application.name}</h1>
      <p>Engine version: {ENGINE_VERSION}</p>
      <p>Workspace import from @geaac/engine works.</p>
    </main>
  )
}
