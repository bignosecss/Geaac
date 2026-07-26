import { useEffect, useRef, useState } from 'react'

import { ENGINE_VERSION, createApplication } from '@geaac/engine'

import type { Application } from '@geaac/engine'

const APP_NAME = 'GEAAC Sandbox'

export function App() {
  const [application, setApplication] = useState<Application | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (appRef.current) return
    const next = createApplication({ name: APP_NAME, canvas })
    appRef.current = next
    setApplication(next)
    next.run()

    return () => {
      next.close()
      appRef.current = null
    }
  }, [])

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
      </div>
    </main>
  )
}
