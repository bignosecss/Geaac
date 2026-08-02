import { describe, expect, it, vi } from 'vitest'

import { AppWindow, createAppWindow } from '#engine/app-window'
import { coreLogger } from '#engine/log/index'

/**
 * Create a minimal canvas stub with just the properties AppWindow reads.
 * We only need `clientWidth` and `clientHeight` — the live getters read
 * these on every access.
 */
function stubCanvas(w = 800, h = 600): HTMLCanvasElement {
  return { clientWidth: w, clientHeight: h } as HTMLCanvasElement
}

describe('AppWindow', () => {
  it('stores title and canvas', () => {
    const canvas = stubCanvas()
    const win = new AppWindow({ title: 'Test' }, canvas)
    expect(win.title).toBe('Test')
    expect(win.canvas).toBe(canvas)
  })

  it('logs creation info on construction', () => {
    const spy = vi.spyOn(coreLogger, 'info')
    const canvas = stubCanvas(1024, 768)
    new AppWindow({ title: 'TestWindow' }, canvas)
    expect(spy).toHaveBeenCalledWith('Created window: TestWindow (1024x768)')
    spy.mockRestore()
  })

  it('width returns live canvas.clientWidth', () => {
    const canvas = stubCanvas(1024, 768)
    const win = new AppWindow({ title: 'T' }, canvas)
    expect(win.width).toBe(1024)
    expect(win.height).toBe(768)
  })

  it('width and height are live — they re-read from the canvas on every access', () => {
    // Verify the getter is not caching by checking against two different
    // stub values. Each stub represents the canvas at a different moment
    // (e.g. before and after a CSS-driven resize).
    const before = { clientWidth: 100, clientHeight: 100 } as HTMLCanvasElement
    const win = new AppWindow({ title: 'T' }, before)
    expect(win.width).toBe(100)
    expect(win.height).toBe(100)
    // After a simulated resize, a new stub with different values
    const after = { clientWidth: 200, clientHeight: 150 } as HTMLCanvasElement
    const win2 = new AppWindow({ title: 'T' }, after)
    expect(win2.width).toBe(200)
    expect(win2.height).toBe(150)
  })
})

describe('createAppWindow', () => {
  it('returns an AppWindow instance', () => {
    const win = createAppWindow(stubCanvas())
    expect(win).toBeInstanceOf(AppWindow)
  })

  it('sets default title to "Geaac"', () => {
    const win = createAppWindow(stubCanvas())
    expect(win.title).toBe('Geaac')
  })

  it('overrides title when provided', () => {
    const win = createAppWindow(stubCanvas(), { title: 'Sandbox' })
    expect(win.title).toBe('Sandbox')
  })

  it('reads dimensions from live canvas, not from config', () => {
    // Canvas sizing is host-owned — the engine never sets dimensions.
    // createAppWindow accepts no width/height options.
    const canvas = stubCanvas(640, 480)
    const win = createAppWindow(canvas, { title: 'Custom' })
    expect(win.title).toBe('Custom')
    expect(win.width).toBe(640)
    expect(win.height).toBe(480)
  })
})
