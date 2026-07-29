import { EventCategory, type EventCategoryValue } from '#engine/events/category'
import { Event } from '#engine/events/event'
import { EventType, type EventTypeValue } from '#engine/events/event-type'

/**
 * Emitted when a mouse button transitions to the pressed state.
 *
 * Mouse-button events live in three categories at once: `Input` (any
 * device-derived event), `Mouse` (anything motion or scroll-related), and
 * `MouseButton` (the click subset). Subscribers can pick whichever
 * granularity they want via {@link Event.isInCategory}.
 */
export class MouseButtonPressedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.MouseButtonPressed
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput |
    EventCategory.EventCategoryMouse |
    EventCategory.EventCategoryMouseButton

  /**
   * Platform-specific button identifier (e.g. 0 = left, 1 = middle, 2 = right
   * on most platforms; exact mapping is host-defined).
   */
  constructor(public readonly button: number) {
    super()
  }

  public toString(): string {
    return `MouseButtonPressed: ${this.button}`
  }
}

/** Emitted when a mouse button transitions to the released state. */
export class MouseButtonReleasedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.MouseButtonReleased
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput |
    EventCategory.EventCategoryMouse |
    EventCategory.EventCategoryMouseButton

  /** Platform-specific button identifier. See {@link MouseButtonPressedEvent}. */
  constructor(public readonly button: number) {
    super()
  }

  public toString(): string {
    return `MouseButtonReleased: ${this.button}`
  }
}
