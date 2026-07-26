import { EventCategory, type EventCategoryValue } from '#engine/events/category'
import { Event } from '#engine/events/event'
import { EventType, type EventTypeValue } from '#engine/events/event-type'

export class MouseMovedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.MouseMoved
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput | EventCategory.EventCategoryMouse

  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {
    super()
  }

  public toString(): string {
    return `MouseMoved: ${this.x}, ${this.y}`
  }
}

export class MouseScrolledEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.MouseScrolled
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput | EventCategory.EventCategoryMouse

  constructor(
    public readonly xOffset: number,
    public readonly yOffset: number,
  ) {
    super()
  }

  public toString(): string {
    return `MouseScrolled: ${this.xOffset}, ${this.yOffset}`
  }
}

