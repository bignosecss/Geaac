import { describe, expect, it } from 'vitest'
import { EventCategory, isInCategory } from '#engine/events/category'
import { EventDispatcher } from '#engine/events/dispatcher'
import { KeyPressedEvent } from '#engine/events/key-events'
import { MouseMovedEvent } from '#engine/events/mouse-events'

describe('isInCategory', () => {
  it('detects a set bit', () => {
    expect(
      isInCategory(EventCategory.EventCategoryKeyboard, EventCategory.EventCategoryKeyboard),
    ).toBe(true)
  })

  it('detects a missing bit', () => {
    expect(
      isInCategory(EventCategory.EventCategoryKeyboard, EventCategory.EventCategoryInput),
    ).toBe(false)
  })

  it('detects one of several OR-ed bits', () => {
    const both = EventCategory.EventCategoryInput | EventCategory.EventCategoryKeyboard
    expect(isInCategory(both, EventCategory.EventCategoryInput)).toBe(true)
    expect(isInCategory(both, EventCategory.EventCategoryKeyboard)).toBe(true)
  })

  it('treats zero as matching no category', () => {
    expect(isInCategory(0, EventCategory.EventCategoryKeyboard)).toBe(false)
  })
})

describe('EventDispatcher', () => {
  it('runs the handler when the event type matches and reports handled', () => {
    const event = new KeyPressedEvent('KeyA', 1)
    const dispatcher = new EventDispatcher(event)

    const ran = dispatcher.dispatch(KeyPressedEvent, (e) => {
      expect(e).toBe(event)
      return true
    })

    expect(ran).toBe(true)
    expect(event.handled).toBe(true)
  })

  it('does not run the handler when the event type does not match', () => {
    const event = new KeyPressedEvent('KeyA', 1)
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
    const event = new KeyPressedEvent('KeyA', 1)
    const dispatcher = new EventDispatcher(event)

    const ran = dispatcher.dispatch(KeyPressedEvent, () => false)

    expect(ran).toBe(true)
    expect(event.handled).toBe(false)
  })
})
