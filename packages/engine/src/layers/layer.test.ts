import { describe, expect, it } from 'vitest'

import type { Event } from '#engine/events/event'
import { Layer } from '#engine/layers/layer'

describe('Layer', () => {
  it('carries the debug name given at construction', () => {
    expect(new Layer('World').debugName).toBe('World')
  })

  it('provides no-op hooks so subclasses can override only what they need', () => {
    class Silent extends Layer {
      constructor() {
        super('Silent')
      }
    }
    const layer = new Silent()
    expect(() => layer.onAttach()).not.toThrow()
    expect(() => layer.onDetach()).not.toThrow()
    expect(() => layer.onUpdate(0.016)).not.toThrow()
    expect(() => layer.onEvent({} as Event)).not.toThrow()
  })

  it('hands the time step to an overridden onUpdate', () => {
    const received: number[] = []
    class Recorder extends Layer {
      constructor() {
        super('Recorder')
      }
      override onUpdate(ts: number): void {
        received.push(ts)
      }
    }
    new Recorder().onUpdate(0.5)
    expect(received).toEqual([0.5])
  })

  it('hands the event to an overridden onEvent', () => {
    const seen: Event[] = []
    class Recorder extends Layer {
      constructor() {
        super('Recorder')
      }
      override onEvent(event: Event): void {
        seen.push(event)
      }
    }
    const evt = { handled: false } as Event
    new Recorder().onEvent(evt)
    expect(seen).toEqual([evt])
  })
})
