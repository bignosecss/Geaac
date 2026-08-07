import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

import { Application, Layer, WindowCloseEvent, createApplication } from '@geaac/engine'
import type { AppWindow, Event, TimeStep } from '@geaac/engine'

/**
 * Build a layer that appends `hook:name` lines to a shared log. The shared
 * log keeps cross-layer ordering assertions readable as a transcript.
 */
function recordLayer(name: string, log: string[], claims = false): Layer {
  return new (class extends Layer {
    constructor() {
      super(name)
    }
    override onAttach(): void {
      log.push(`attach:${name}`)
    }
    override onDetach(): void {
      log.push(`detach:${name}`)
    }
    override onUpdate(): void {
      log.push(`update:${name}`)
    }
    override onEvent(event: Event): void {
      log.push(`event:${event.name}:${name}`)
      if (claims) event.handled = true
    }
  })()
}

describe('Application', () => {
  let windowStub: AppWindow
  let attachMock: Mock
  let detachMock: Mock
  let sink: ((event: Event) => void) | undefined
  let tick: ((time: number) => void) | undefined

  beforeEach(() => {
    attachMock = vi.fn((callback: (event: Event) => void) => {
      sink = callback
    })
    detachMock = vi.fn()
    windowStub = {
      width: 800,
      height: 600,
      attach: attachMock,
      detach: detachMock,
    } as unknown as AppWindow
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
      tick = callback
      return 1
    })
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

  it('constructor wires the window bridge into the layer stack', () => {
    new Application({ name: 'Bridged', window: windowStub })
    expect(attachMock).toHaveBeenCalledTimes(1)
    expect(attachMock).toHaveBeenCalledWith(expect.any(Function))
  })

  it('pushLayer inserts a layer and calls onAttach', () => {
    const app = new Application({ name: 'Pusher', window: windowStub })
    const log: string[] = []
    app.pushLayer(recordLayer('A', log))
    expect(log).toEqual(['attach:A'])
  })

  it('pushOverlay pins a layer above every layer', () => {
    const app = new Application({ name: 'Pinner', window: windowStub })
    const log: string[] = []
    app.pushLayer(recordLayer('A', log))
    app.pushOverlay(recordLayer('O', log))
    expect(log).toEqual(['attach:A', 'attach:O'])

    sink!(new WindowCloseEvent())
    // top → bottom: overlay first, then the layer
    expect(log).toEqual(['attach:A', 'attach:O', 'event:WindowClose:O', 'event:WindowClose:A'])
  })

  it('stops event dispatch at the first claiming layer', () => {
    const app = new Application({ name: 'Claimer', window: windowStub })
    const log: string[] = []
    app.pushLayer(recordLayer('A', log))
    app.pushLayer(recordLayer('B', log, true)) // B is the higher layer and claims

    sink!(new WindowCloseEvent())

    expect(log).toEqual(['attach:A', 'attach:B', 'event:WindowClose:B'])
  })

  it('popLayer calls onDetach and removes the layer from dispatch', () => {
    const app = new Application({ name: 'Popper', window: windowStub })
    const log: string[] = []
    const a = recordLayer('A', log)
    app.pushLayer(a)
    app.pushLayer(recordLayer('B', log))

    app.popLayer(a)

    expect(log).toEqual(['attach:A', 'attach:B', 'detach:A'])
    sink!(new WindowCloseEvent())
    expect(log).toEqual(['attach:A', 'attach:B', 'detach:A', 'event:WindowClose:B'])
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

  it('tick() updates layers bottom-to-top with a frame delta', () => {
    const app = new Application({ name: 'Ticker', window: windowStub })
    const log: string[] = []
    app.pushLayer(recordLayer('A', log))
    app.pushLayer(recordLayer('B', log))
    app.run()

    tick!(0)
    tick!(16)
    tick!(32)

    // three frames, each updating A then B (bottom → top)
    expect(log).toEqual([
      'attach:A',
      'attach:B',
      'update:A',
      'update:B',
      'update:A',
      'update:B',
      'update:A',
      'update:B',
    ])
  })

  it('tick() passes the seconds between frames to onUpdate', () => {
    const app = new Application({ name: 'Delta', window: windowStub })
    const deltas: number[] = []
    app.pushLayer(
      new (class extends Layer {
        constructor() {
          super('TsSpy')
        }
        override onUpdate(ts: TimeStep): void {
          deltas.push(ts)
        }
      })(),
    )
    app.run()

    tick!(1000)
    tick!(1016)
    tick!(1066)

    expect(deltas).toEqual([0, 0.016, 0.05])
  })

  it('close() routes WindowClose to layers before tearing them down', () => {
    const app = new Application({ name: 'Closer', window: windowStub })
    const log: string[] = []
    app.pushLayer(recordLayer('A', log))
    app.pushOverlay(recordLayer('O', log))
    app.run()

    app.close()

    // WindowClose top → bottom, then shutdown detaches in stack order
    expect(log).toEqual([
      'attach:A',
      'attach:O',
      'event:WindowClose:O',
      'event:WindowClose:A',
      'detach:A',
      'detach:O',
    ])
    expect(detachMock).toHaveBeenCalledTimes(1)
    expect(console.info).toHaveBeenCalledWith('[Engine]', 'Application closed')
  })

  it('close() does not throw when called without run()', () => {
    const app = new Application({ name: 'Safe', window: windowStub })
    expect(() => app.close()).not.toThrow()
  })
})
