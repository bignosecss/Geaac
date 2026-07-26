import { isInCategory, type EventCategoryValue } from '#engine/events/category'
import type { Event } from '#engine/events/event'
import type { EventTypeValue } from '#engine/events/event-type'

// Handler signature. Subscribers run synchronously when the matching event
// is published. To stop further dispatch, set `event.handled = true` (either
// directly, or via `EventDispatcher.dispatch(...)`).
export type EventHandler<E extends Event = Event> = (event: E) => void

// Subscription registry. Two subscribe modes:
//   - on(type, h):         fires for events whose `eventType` matches exactly
//   - onCategory(bits, h): fires for any event whose categoryFlags overlap
// Type-subs run first, then category-subs. Once any handler sets
// `event.handled = true`, dispatch stops.
export class EventBus {
  private readonly byType: Map<EventTypeValue, Set<EventHandler>> = new Map()
  private readonly byCategory: Set<EventHandler> = new Set()

  public on<E extends Event>(type: EventTypeValue, handler: EventHandler<E>): () => void {
    let set = this.byType.get(type)
    if (!set) {
      set = new Set()
      this.byType.set(type, set)
    }
    set.add(handler as EventHandler)
    return () => {
      set!.delete(handler as EventHandler)
    }
  }

  public onCategory<E extends Event>(
    bits: EventCategoryValue,
    handler: EventHandler<E>,
  ): () => void {
    const wrapped: EventHandler = (event) => {
      if (isInCategory(event.categoryFlags, bits)) {
        handler(event as E)
      }
    }
    this.byCategory.add(wrapped)
    return () => {
      this.byCategory.delete(wrapped)
    }
  }

  public publish(event: Event): void {
    const typeHandlers = this.byType.get(event.eventType)
    if (typeHandlers) {
      for (const h of typeHandlers) {
        h(event)
        if (event.handled) return
      }
    }
    for (const h of this.byCategory) {
      h(event)
      if (event.handled) return
    }
  }

  public clear(): void {
    this.byType.clear()
    this.byCategory.clear()
  }
}
