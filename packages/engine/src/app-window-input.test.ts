// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppWindow } from '#engine/app-window'
import { WindowResizeEvent } from '#engine/events/application-events'
import type { Event } from '#engine/events/event'
import { KeyPressedEvent, KeyReleasedEvent } from '#engine/events/key-events'
import { MouseMovedEvent, MouseScrolledEvent } from '#engine/events/mouse-events'
import {
  MouseButtonPressedEvent,
  MouseButtonReleasedEvent,
} from '#engine/events/mouse-button-events'

type SinkSpy = { events: Event[]; fn: (event: Event) => void }

/** Collects the events a sink receives, so tests can assert the translation. */
function createSinkSpy(): SinkSpy {
  const events: Event[] = []
  const fn = (event: Event): void => {
    events.push(event)
  }
  return { events, fn }
}

// jsdom does not implement ResizeObserver. Stub it and capture the callback so
// tests can drive the resize path directly instead of waiting for layout.
let resizeCallback: ResizeObserverCallback | undefined

class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback
  }
  observe(): void {}
  disconnect(): void {}
}

describe('AppWindow input bridge', () => {
  const windows: AppWindow[] = []

  beforeEach(() => {
    resizeCallback = undefined
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  afterEach(() => {
    for (const win of windows) win.detach()
    windows.length = 0
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function createWindow(): AppWindow {
    const win = new AppWindow({ title: 'Test' }, document.createElement('canvas'))
    windows.push(win)
    return win
  }

  describe('attach / detach lifecycle', () => {
    it('stops delivering events after detach', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      win.detach()
      win.canvas.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))
      expect(sink.events).toEqual([])
    })

    it('attach while already attached swaps the sink', () => {
      const win = createWindow()
      const first = createSinkSpy()
      const second = createSinkSpy()
      win.attach(first.fn)
      win.attach(second.fn)
      win.canvas.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))
      expect(first.events).toEqual([])
      expect(second.events).toHaveLength(1)
    })

    it('detach is idempotent', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      win.detach()
      expect(() => win.detach()).not.toThrow()
    })
  })

  describe('keyboard', () => {
    it('translates keydown to KeyPressedEvent', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      win.canvas.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))
      expect(sink.events).toHaveLength(1)
      const ev = sink.events[0] as KeyPressedEvent
      expect(ev).toBeInstanceOf(KeyPressedEvent)
      expect(ev.code).toBe('KeyA')
      expect(ev.repeatCount).toBe(0)
    })

    it('maps the DOM repeat flag to a repeat count', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      win.canvas.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', repeat: true }))
      expect((sink.events[0] as KeyPressedEvent).repeatCount).toBe(1)
    })

    it('translates keyup to KeyReleasedEvent', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      win.canvas.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyB' }))
      expect(sink.events).toHaveLength(1)
      const ev = sink.events[0] as KeyReleasedEvent
      expect(ev).toBeInstanceOf(KeyReleasedEvent)
      expect(ev.code).toBe('KeyB')
    })

    it('attach makes the canvas focusable', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      expect(win.canvas.tabIndex).toBe(0)
    })

    it('does not listen on window', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))
      expect(sink.events).toEqual([])
    })
  })

  describe('mouse motion', () => {
    it('translates mousemove to canvas-relative coordinates', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      const rect = {
        left: 100,
        top: 50,
        right: 900,
        bottom: 650,
        width: 800,
        height: 600,
        x: 100,
        y: 50,
      } as unknown as DOMRect
      vi.spyOn(win.canvas, 'getBoundingClientRect').mockReturnValue(rect)
      win.attach(sink.fn)
      win.canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 200 }))
      expect(sink.events).toHaveLength(1)
      const ev = sink.events[0] as MouseMovedEvent
      expect(ev).toBeInstanceOf(MouseMovedEvent)
      expect(ev.x).toBe(200)
      expect(ev.y).toBe(150)
    })

    it('translates wheel to MouseScrolledEvent', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      win.canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: 10, deltaY: -30 }))
      expect(sink.events).toHaveLength(1)
      const ev = sink.events[0] as MouseScrolledEvent
      expect(ev).toBeInstanceOf(MouseScrolledEvent)
      expect(ev.xOffset).toBe(10)
      expect(ev.yOffset).toBe(-30)
    })
  })

  describe('mouse buttons', () => {
    it('translates mousedown to MouseButtonPressedEvent', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      win.canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }))
      expect(sink.events).toHaveLength(1)
      const ev = sink.events[0] as MouseButtonPressedEvent
      expect(ev).toBeInstanceOf(MouseButtonPressedEvent)
      expect(ev.button).toBe(0)
    })

    it('translates mouseup to MouseButtonReleasedEvent', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      win.canvas.dispatchEvent(new MouseEvent('mouseup', { button: 2 }))
      expect(sink.events).toHaveLength(1)
      const ev = sink.events[0] as MouseButtonReleasedEvent
      expect(ev).toBeInstanceOf(MouseButtonReleasedEvent)
      expect(ev.button).toBe(2)
    })
  })

  describe('resize', () => {
    it('translates the ResizeObserver callback to WindowResizeEvent', () => {
      const win = createWindow()
      const sink = createSinkSpy()
      win.attach(sink.fn)
      expect(resizeCallback).toBeDefined()
      resizeCallback!(
        [{ contentRect: { width: 1024, height: 768 } }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      )
      expect(sink.events).toHaveLength(1)
      const ev = sink.events[0] as WindowResizeEvent
      expect(ev).toBeInstanceOf(WindowResizeEvent)
      expect(ev.width).toBe(1024)
      expect(ev.height).toBe(768)
    })
  })
})
