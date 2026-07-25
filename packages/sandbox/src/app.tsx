import { ENGINE_VERSION } from '@geaac/engine'

export function App() {
  return (
    <main className="app">
      <h1>GEAAC Sandbox</h1>
      <p>Engine version: {ENGINE_VERSION}</p>
      <p>Workspace import from @geaac/engine works.</p>
    </main>
  )
}
