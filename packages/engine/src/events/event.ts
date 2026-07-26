import { isInCategory, type EventCategoryValue } from '#engine/events/category'
import { eventTypeName, type EventTypeValue } from '#engine/events/event-type'

export abstract class Event {
  // Set by a handler (via EventDispatcher) to signal the event was
  // consumed; the bus uses this to short-circuit further dispatch.
  public handled = false

  public abstract readonly eventType: EventTypeValue
  public abstract readonly categoryFlags: EventCategoryValue

  public abstract toString(): string

  public isInCategory(category: EventCategoryValue): boolean {
    return isInCategory(this.categoryFlags, category)
  }

  // Reverse lookup into the EventType registry. Returns the string name
  // (e.g. 'KeyPressed') for logging and debugging.
  public get name(): string {
    return eventTypeName(this.eventType)
  }
}
