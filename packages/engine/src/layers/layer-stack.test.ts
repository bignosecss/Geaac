import { describe, expect, it } from 'vitest'

import { WindowCloseEvent } from '#engine/events/application-events'
import type { Event } from '#engine/events/event'
import { Layer } from '#engine/layers/layer'
import { LayerStack } from '#engine/layers/layer-stack'

/**
 * Build a layer that appends `hook:name` lines to a shared log, optionally
 * claiming events. The shared log makes cross-layer ordering assertions read
 * like a transcript of the frame.
 */
function spy(name: string, log: string[], claim = false): Layer {
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
      log.push(`event:${name}`)
      if (claim) event.handled = true
    }
  })()
}

describe('LayerStack', () => {
  it('keeps pushLayer order and pins pushOverlay above them', () => {
    const log: string[] = []
    const stack = new LayerStack()
    stack.pushLayer(spy('A', log))
    stack.pushLayer(spy('B', log))
    stack.pushOverlay(spy('O', log))

    stack.onUpdate(0.016)

    // bottom → top: A then B, with the overlay always highest
    expect(log).toEqual(['update:A', 'update:B', 'update:O'])
  })

  it('dispatches events top-to-bottom and stops at the first claimer', () => {
    const log: string[] = []
    const stack = new LayerStack()
    stack.pushLayer(spy('A', log))
    stack.pushLayer(spy('B', log))
    stack.pushOverlay(spy('O', log, true)) // overlay claims

    stack.onEvent(new WindowCloseEvent())

    // O is topmost, sees the event first, claims it; B and A never see it
    expect(log).toEqual(['event:O'])
  })

  it('lets every layer see an event nobody claims', () => {
    const log: string[] = []
    const stack = new LayerStack()
    stack.pushLayer(spy('A', log))
    stack.pushLayer(spy('B', log))
    stack.pushOverlay(spy('O', log))

    stack.onEvent(new WindowCloseEvent())

    // top → bottom: O, B, A
    expect(log).toEqual(['event:O', 'event:B', 'event:A'])
  })

  it('skips lower layers once an event is already handled before dispatch', () => {
    const log: string[] = []
    const stack = new LayerStack()
    stack.pushLayer(spy('A', log))
    const evt = new WindowCloseEvent()
    evt.handled = true

    stack.onEvent(evt)

    expect(log).toEqual([])
  })

  it('pushLayer and pushOverlay never call onAttach (the application does)', () => {
    const log: string[] = []
    const stack = new LayerStack()
    stack.pushLayer(spy('A', log))
    stack.pushOverlay(spy('O', log))

    expect(log).toEqual([])
  })

  it('popLayer detaches the layer, removes it, and lowers the partition line', () => {
    const log: string[] = []
    const stack = new LayerStack()
    const a = spy('A', log)
    const b = spy('B', log)
    stack.pushLayer(a)
    stack.pushLayer(b)

    stack.popLayer(b)

    expect(log).toEqual(['detach:B'])
    stack.onUpdate(0.016)
    expect(log).toEqual(['detach:B', 'update:A'])
  })

  it('popLayer is a no-op for a layer living in the overlay region', () => {
    const log: string[] = []
    const stack = new LayerStack()
    stack.pushLayer(spy('A', log))
    const overlay = spy('O', log)
    stack.pushOverlay(overlay)

    stack.popLayer(overlay)

    expect(log).toEqual([])
    stack.onUpdate(0.016)
    expect(log).toEqual(['update:A', 'update:O'])
  })

  it('popOverlay detaches the overlay and removes it', () => {
    const log: string[] = []
    const stack = new LayerStack()
    stack.pushLayer(spy('A', log))
    const overlay = spy('O', log)
    stack.pushOverlay(overlay)

    stack.popOverlay(overlay)

    expect(log).toEqual(['detach:O'])
    stack.onUpdate(0.016)
    expect(log).toEqual(['detach:O', 'update:A'])
  })

  it('popOverlay is a no-op for a layer living in the layer region', () => {
    const log: string[] = []
    const stack = new LayerStack()
    const a = spy('A', log)
    stack.pushLayer(a)

    stack.popOverlay(a)

    expect(log).toEqual([])
    stack.onUpdate(0.016)
    expect(log).toEqual(['update:A'])
  })

  it('a popLayer no-op does not disturb the partition line', () => {
    const log: string[] = []
    const stack = new LayerStack()
    const a = spy('A', log)
    stack.pushLayer(a)
    stack.pushOverlay(spy('O', log))
    const stranger = spy('S', log) // never pushed

    stack.popLayer(stranger)
    stack.pushLayer(spy('C', log))
    stack.popOverlay(stranger)

    // C must land below the overlay, so the order stays A, C, O
    stack.onUpdate(0.016)
    expect(log).toEqual(['update:A', 'update:C', 'update:O'])
  })

  it('shutdown detaches every layer in stack order and clears the stack', () => {
    const log: string[] = []
    const stack = new LayerStack()
    stack.pushLayer(spy('A', log))
    stack.pushLayer(spy('B', log))
    stack.pushOverlay(spy('O', log))

    stack.shutdown()

    expect(log).toEqual(['detach:A', 'detach:B', 'detach:O'])
    stack.onUpdate(0.016)
    expect(log).toEqual(['detach:A', 'detach:B', 'detach:O'])
  })
})
