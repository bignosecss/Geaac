import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createApplication, Application } from '@geaac/engine'
import type { AppWindow } from '@geaac/engine'

describe('Application', () => {
  let windowStub: AppWindow

  beforeEach(() => {
    windowStub = { width: 800, height: 600 } as AppWindow
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('stores name and window', () => {
    const app = new Application({ name: 'Test', window: windowStub })
    expect(app.name).toBe('Test')
    expect(app.window).toBe(windowStub)
  })

  it('createApplication is a convenience factory', () => {
    const app = createApplication({ name: 'Via Factory', window: windowStub })
    expect(app).toBeInstanceOf(Application)
    expect(app.name).toBe('Via Factory')
  })

  it('logs creation on construction', () => {
    new Application({ name: 'Console Check', window: windowStub })
    expect(console.info).toHaveBeenCalledWith('[Engine]', 'Created application: Console Check')
  })

  it('run() logs that the main loop started', () => {
    const app = new Application({ name: 'Runner', window: windowStub })
    app.run()
    expect(console.info).toHaveBeenCalledWith('[Engine]', 'Main loop started')
  })

  it('run() warns when called twice', () => {
    const app = new Application({ name: 'Guard', window: windowStub })
    app.run()
    app.run()
    expect(console.warn).toHaveBeenCalledWith('[Engine]', 'Application is already running')
  })

  it('close() logs that the application closed', () => {
    const app = new Application({ name: 'Closer', window: windowStub })
    app.run()
    app.close()
    expect(console.info).toHaveBeenCalledWith('[Engine]', 'Application closed')
  })

  it('close() does not throw when called without run()', () => {
    const app = new Application({ name: 'Safe', window: windowStub })
    expect(() => app.close()).not.toThrow()
  })
})
