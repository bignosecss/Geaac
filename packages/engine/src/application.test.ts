import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createApplication, Application } from '@geaac/engine'

describe('Application', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('stores name and canvas', () => {
    const canvas = {} as HTMLCanvasElement
    const app = new Application({ name: 'Test', canvas })
    expect(app.name).toBe('Test')
    expect(app.canvas).toBe(canvas)
  })

  it('createApplication is a convenience factory', () => {
    const canvas = {} as HTMLCanvasElement
    const app = createApplication({ name: 'Via Factory', canvas })
    expect(app).toBeInstanceOf(Application)
    expect(app.name).toBe('Via Factory')
  })

  it('logs creation on construction', () => {
    new Application({ name: 'Console Check', canvas: {} as HTMLCanvasElement })
    expect(console.info).toHaveBeenCalledWith('[Engine]', 'Created application: Console Check')
  })

  it('run() logs that the main loop started', () => {
    const app = new Application({ name: 'Runner', canvas: {} as HTMLCanvasElement })
    app.run()
    expect(console.info).toHaveBeenCalledWith('[Engine]', 'Main loop started')
  })

  it('run() warns when called twice', () => {
    const app = new Application({ name: 'Guard', canvas: {} as HTMLCanvasElement })
    app.run()
    app.run()
    expect(console.warn).toHaveBeenCalledWith('[Engine]', 'Application is already running')
  })

  it('close() logs that the application closed', () => {
    const app = new Application({ name: 'Closer', canvas: {} as HTMLCanvasElement })
    app.run()
    app.close()
    expect(console.info).toHaveBeenCalledWith('[Engine]', 'Application closed')
  })

  it('close() does not throw when called without run()', () => {
    const app = new Application({ name: 'Safe', canvas: {} as HTMLCanvasElement })
    expect(() => app.close()).not.toThrow()
  })
})
