import { isInCategory, type EventCategoryBits } from '#engine/events/category'

export abstract class Event {
  // Set by a handler (via EventDispatcher) to signal the event was
  // consumed; the bus uses this to short-circuit further dispatch.
  public handled = false

  public abstract readonly type: string
  public abstract readonly categoryFlags: EventCategoryBits

  public abstract toString(): string

  public isInCategory(category: EventCategoryBits): boolean {
    return isInCategory(this.categoryFlags, category)
  }
}

