import {
  EventCategoryInput,
  EventCategoryMouse,
  type EventCategoryBits,
} from '#engine/events/category'
import { Event } from '#engine/events/event'

export class MouseMovedEvent extends Event {
  public readonly type = 'MouseMoved'
  public readonly categoryFlags: EventCategoryBits =
    EventCategoryInput | EventCategoryMouse

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
  public readonly type = 'MouseScrolled'
  public readonly categoryFlags: EventCategoryBits =
    EventCategoryInput | EventCategoryMouse

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

