import { describe, expect, it } from 'vitest'
import { EventCategory } from '#engine/events/category'
import { EventBus } from '#engine/events/bus'
import { EventType } from '#engine/events/event-type'
import { KeyPressedEvent } from '#engine/events/key-events'
import { MouseMovedEvent } from '#engine/events/mouse-events'
import { MouseButtonPressedEvent } from '#engine/events/mouse-button-events'

describe('EventBus', () => {
  it('delivers events to type subscribers', () => {
    const bus = new EventBus()
    const calls: number[] = []
    bus.on(EventType.KeyPressed, (e) => {
      calls.push((e as KeyPressedEvent).keyCode)
    })

    bus.publish(new KeyPressedEvent(65, 1))
    bus.publish(new KeyPressedEvent(66, 1))

    expect(calls).toEqual([65, 66])
  })

  it('returns an unsubscribe function from on()', () => {
    const bus = new EventBus()
    const calls: number[] = []
    const off = bus.on(EventType.KeyPressed, (e) => {
      calls.push((e as KeyPressedEvent).keyCode)
    })

    bus.publish(new KeyPressedEvent(1, 1))
    off()
    bus.publish(new KeyPressedEvent(2, 1))

    expect(calls).toEqual([1])
  })

  it('stops dispatch once an event is handled', () => {
    const bus = new EventBus()
    const calls: string[] = []

    bus.on(EventType.KeyPressed, (e) => {
      calls.push('first')
      e.handled = true
    })
    bus.on(EventType.KeyPressed, () => {
      calls.push('second')
    })

    bus.publish(new KeyPressedEvent(65, 1))

    expect(calls).toEqual(['first'])
  })

  it('delivers to category subscribers that overlap with the event', () => {
    const bus = new EventBus()
    const calls: string[] = []

    bus.onCategory(EventCategory.EventCategoryMouse, (e) => {
      calls.push(`mouse: ${e.name}`)
    })
    bus.onCategory(EventCategory.EventCategoryMouseButton, (e) => {
      calls.push(`mouse-button: ${e.name}`)
    })

    bus.publish(new MouseMovedEvent(1, 2))
    bus.publish(new MouseButtonPressedEvent(0))

    expect(calls).toEqual([
      'mouse: MouseMoved',
      'mouse: MouseButtonPressed',
      'mouse-button: MouseButtonPressed',
    ])
  })

  it('runs type subscribers before category subscribers', () => {
    const bus = new EventBus()
    const order: string[] = []

    bus.onCategory(EventCategory.EventCategoryMouse, () => order.push('category'))
    bus.on(EventType.MouseMoved, () => order.push('type'))

    bus.publish(new MouseMovedEvent(0, 0))

    expect(order).toEqual(['type', 'category'])
  })

  it('returns an unsubscribe function from onCategory()', () => {
    const bus = new EventBus()
    const calls: string[] = []
    const off = bus.onCategory(EventCategory.EventCategoryMouse, (e) => {
      calls.push(e.name)
    })

    bus.publish(new MouseMovedEvent(0, 0))
    off()
    bus.publish(new MouseMovedEvent(1, 1))

    expect(calls).toEqual(['MouseMoved'])
  })

  it('does nothing for events with no subscribers', () => {
    const bus = new EventBus()
    expect(() => bus.publish(new KeyPressedEvent(65, 1))).not.toThrow()
  })
})
