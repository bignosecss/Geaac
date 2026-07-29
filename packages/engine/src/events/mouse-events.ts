import { EventCategory, type EventCategoryValue } from '#engine/events/category'
import { Event } from '#engine/events/event'
import { EventType, type EventTypeValue } from '#engine/events/event-type'

/**
 * Emitted when the mouse cursor moves over the canvas.
 *
 * Coordinates are in CSS pixels relative to the canvas's top-left corner.
 * High-frequency; consider throttling handlers in performance-sensitive paths.
 */
export class MouseMovedEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.MouseMoved
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput | EventCategory.EventCategoryMouse

  constructor(
    /** Cursor X in CSS pixels, relative to the canvas. */
    public readonly x: number,
    /** Cursor Y in CSS pixels, relative to the canvas. */
    public readonly y: number,
  ) {
    super()
  }

  public toString(): string {
    return `MouseMoved: ${this.x}, ${this.y}`
  }
}

/** Emitted when the scroll wheel (or equivalent gesture) is actuated. */
export class MouseScrolledEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.MouseScrolled
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryInput | EventCategory.EventCategoryMouse

  constructor(
    /** Horizontal scroll delta; positive = right, negative = left. */
    public readonly xOffset: number,
    /** Vertical scroll delta; positive = down/away, negative = up/toward. */
    public readonly yOffset: number,
  ) {
    super()
  }

  public toString(): string {
    return `MouseScrolled: ${this.xOffset}, ${this.yOffset}`
  }
}
