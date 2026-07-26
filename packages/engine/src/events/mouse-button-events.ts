import {
  EventCategoryInput,
  EventCategoryMouse,
  EventCategoryMouseButton,
  type EventCategoryBits,
} from '#engine/events/category'
import { Event } from '#engine/events/event'

// Mouse-button events live in three categories at once: Input (any
// device-derived event), Mouse (anything motion or scroll-related), and
// MouseButton (the click subset). Subscribers can pick whichever
// granularity they want via `Event.isInCategory`.
export class MouseButtonPressedEvent extends Event {
  public readonly type = 'MouseButtonPressed'
  public readonly categoryFlags: EventCategoryBits =
    EventCategoryInput | EventCategoryMouse | EventCategoryMouseButton

  constructor(public readonly button: number) {
    super()
  }

  public toString(): string {
    return `MouseButtonPressed: ${this.button}`
  }
}

export class MouseButtonReleasedEvent extends Event {
  public readonly type = 'MouseButtonReleased'
  public readonly categoryFlags: EventCategoryBits =
    EventCategoryInput | EventCategoryMouse | EventCategoryMouseButton

  constructor(public readonly button: number) {
    super()
  }

  public toString(): string {
    return `MouseButtonReleased: ${this.button}`
  }
}

