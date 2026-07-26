import {
  EventCategoryApplication,
  type EventCategoryBits,
} from '#engine/events/category'
import { Event } from '#engine/events/event'

export class WindowResizeEvent extends Event {
  public readonly type = 'WindowResize'
  public readonly categoryFlags: EventCategoryBits = EventCategoryApplication

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
  public readonly type = 'WindowClose'
  public readonly categoryFlags: EventCategoryBits = EventCategoryApplication

  public toString(): string {
    return 'WindowClose'
  }
}

export class AppTickEvent extends Event {
  public readonly type = 'AppTick'
  public readonly categoryFlags: EventCategoryBits = EventCategoryApplication

  public toString(): string {
    return 'AppTick'
  }
}

export class AppRenderEvent extends Event {
  public readonly type = 'AppRender'
  public readonly categoryFlags: EventCategoryBits = EventCategoryApplication

  public toString(): string {
    return 'AppRender'
  }
}

