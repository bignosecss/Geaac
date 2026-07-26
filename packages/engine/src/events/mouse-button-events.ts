import { EventCategory, type EventCategoryValue } from '#engine/events/category'
import { Event } from '#engine/events/event'
import { EventType, type EventTypeValue } from '#engine/events/event-type'

// Mouse-button events live in three categories at once: Input (any
// device-derived event), Mouse (anything motion or scroll-related), and
// MouseButton (the click subset). Subscribers can pick whichever
// granularity they want via `Event.isInCategory`.
export class MouseButtonPressedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.MouseButtonPressed
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput |
    EventCategory.EventCategoryMouse |
    EventCategory.EventCategoryMouseButton

  constructor(public readonly button: number) {
    super()
  }

  public toString(): string {
    return `MouseButtonPressed: ${this.button}`
  }
}

export class MouseButtonReleasedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.MouseButtonReleased
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput |
    EventCategory.EventCategoryMouse |
    EventCategory.EventCategoryMouseButton

  constructor(public readonly button: number) {
    super()
  }

  public toString(): string {
    return `MouseButtonReleased: ${this.button}`
  }
}
