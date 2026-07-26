import { EventCategory, type EventCategoryValue } from '#engine/events/category'
import { Event } from '#engine/events/event'
import { EventType, type EventTypeValue } from '#engine/events/event-type'

export class WindowResizeEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.WindowResize
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryApplication

  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {
    super()
  }

  public toString(): string {
    return `WindowResize: ${this.width}, ${this.height}`
  }
}

export class WindowCloseEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.WindowClose
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryApplication

  public toString(): string {
    return 'WindowClose'
  }
}

export class AppTickEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.AppTick
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryApplication

  public toString(): string {
    return 'AppTick'
  }
}

export class AppRenderEvent extends Event {
  public readonly eventType: EventTypeValue = EventType.AppRender
  public readonly categoryFlags: EventCategoryValue =
    EventCategory.EventCategoryApplication

  public toString(): string {
    return 'AppRender'
  }
}

