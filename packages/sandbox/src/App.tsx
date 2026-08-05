import { useEffect, useRef, useState } from 'react'

import { ENGINE_VERSION, EventType, createAppWindow, createApplication } from '@geaac/engine'
import type { Application, KeyPressedEvent, MouseMovedEvent } from '@geaac/engine'

import { useEvent } from '#sandbox/use-event'

const APP_NAME = 'GEAAC Sandbox'

/**
 * Sandbox host component. Creates an {@link AppWindow} from the canvas ref,
 * spins up an {@link Application} on mount, tears it down on unmount, and
 * renders a header showing the engine version. The status panel subscribes to
 * live engine events so the window→bus→subscriber pipeline is visible.
 */
export function App() {
  const [application, setApplication] = useState<Application | null>(null)
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  const [lastKey, setLastKey] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (appRef.current) return
    const appWindow = createAppWindow(canvas, { title: APP_NAME })
    const next = createApplication({ name: APP_NAME, window: appWindow })
    appRef.current = next
    setApplication(next)
    next.run()
    // The engine makes the canvas focusable; the host decides when the game is
    // active. Focusing on mount means keys reach the game immediately.
    canvas.focus()

    return () => {
      next.close()
      appRef.current = null
    }
  }, [])

  // Live event demo: re-render on engine events so the pipeline is visible.
  useEvent(application?.events ?? null, EventType.MouseMoved, (e: MouseMovedEvent) => {
    setMouse({ x: e.x, y: e.y })
  })
  useEvent(application?.events ?? null, EventType.KeyPressed, (e: KeyPressedEvent) => {
    setLastKey(e.repeatCount > 0 ? `KeyPressed (repeat ${e.repeatCount})` : 'KeyPressed')
  })

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-lg font-semibold text-slate-900">{APP_NAME}</h1>
          <p className="text-sm text-slate-500">Engine {ENGINE_VERSION}</p>
        </header>
        <p className="mt-1 text-sm text-slate-500">
          {application ? 'Application initialized.' : 'Initializing application...'}
        </p>
        <canvas
          ref={canvasRef}
          className="mt-4 block h-[70vh] min-h-96 w-full rounded-md border border-slate-200 bg-slate-100"
        />
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <span>Mouse: {mouse ? `${mouse.x}, ${mouse.y}` : '—'}</span>
          <span>Last key: {lastKey ?? '—'}</span>
        </div>
      </div>
    </main>
  )
}
