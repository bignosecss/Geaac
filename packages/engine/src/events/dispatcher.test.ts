import { describe, expect, it } from 'vitest'
import {
  EventCategoryInput,
  EventCategoryKeyboard,
  isInCategory,
} from '#engine/events/category'
import { EventDispatcher } from '#engine/events/dispatcher'
import { KeyPressedEvent } from '#engine/events/key-events'
import { MouseMovedEvent } from '#engine/events/mouse-events'

describe('isInCategory', () => {
  it('detects a set bit', () => {
    expect(isInCategory(EventCategoryKeyboard, EventCategoryKeyboard)).toBe(true)
  })

  it('detects a missing bit', () => {
    expect(isInCategory(EventCategoryKeyboard, EventCategoryInput)).toBe(false)
  })

  it('detects one of several OR-ed bits', () => {
    const both = EventCategoryInput | EventCategoryKeyboard
    expect(isInCategory(both, EventCategoryInput)).toBe(true)
    expect(isInCategory(both, EventCategoryKeyboard)).toBe(true)
  })

  it('treats zero as matching no category', () => {
    expect(isInCategory(0, EventCategoryKeyboard)).toBe(false)
  })
})

describe('EventDispatcher', () => {
  it('runs the handler when the event type matches and reports handled', () => {
    const event = new KeyPressedEvent(65, 1)
    const dispatcher = new EventDispatcher(event)

    const ran = dispatcher.dispatch(KeyPressedEvent, (e) => {
      expect(e).toBe(event)
      return true
    })

    expect(ran).toBe(true)
    expect(event.handled).toBe(true)
  })

  it('does not run the handler when the event type does not match', () => {
    const event = new KeyPressedEvent(65, 1)
    const dispatcher = new EventDispatcher(event)

    let called = false
    const ran = dispatcher.dispatch(MouseMovedEvent, () => {
      called = true
      return true
    })

    expect(ran).toBe(false)
    expect(called).toBe(false)
    expect(event.handled).toBe(false)
  })

  it('does not mark handled when the handler returns false', () => {
    const event = new KeyPressedEvent(65, 1)
    const dispatcher = new EventDispatcher(event)

    const ran = dispatcher.dispatch(KeyPressedEvent, () => false)

    expect(ran).toBe(true)
    expect(event.handled).toBe(false)
  })
})

