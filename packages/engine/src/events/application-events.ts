import { EventCategory, type EventCategoryValue } from '#engine/events/category'
import { Event } from '#engine/events/event'
import { EventType, type EventTypeValue } from '#engine/events/event-type'

/**
 * Emitted when the host window or canvas is resized. The new dimensions are
 * in CSS pixels.
 */
export class WindowResizeEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.WindowResize
  public readonly categoryFlags: EventCategoryValue = EventCategory.EventCategoryApplication

  constructor(
    /** New canvas width in CSS pixels. */
    public readonly width: number,
    /** New canvas height in CSS pixels. */
    public readonly height: number,
  ) {
    super()
  }

  public toString(): string {
    return `WindowResize: ${this.width}, ${this.height}`
  }
}

/** Emitted when the host requests window close (e.g. close button clicked). */
export class WindowCloseEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.WindowClose
  public readonly categoryFlags: EventCategoryValue = EventCategory.EventCategoryApplication

  public toString(): string {
    return 'WindowClose'
  }
}

/** Emitted once per main-loop tick, before the render pass. */
export class AppTickEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.AppTick
  public readonly categoryFlags: EventCategoryValue = EventCategory.EventCategoryApplication

  public toString(): string {
    return 'AppTick'
  }
}

/** Emitted once per main-loop tick, after the tick pass, before drawing. */
export class AppRenderEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.AppRender
  public readonly categoryFlags: EventCategoryValue = EventCategory.EventCategoryApplication

  public toString(): string {
    return 'AppRender'
  }
}
