import { isInCategory, type EventCategoryValue } from '#engine/events/category'
import type { Event } from '#engine/events/event'
import type { EventTypeValue } from '#engine/events/event-type'

/**
 * A subscriber callback. Invoked synchronously on the call site of
 * {@link EventBus.publish} whenever a matching event is dispatched.
 *
 * To stop further dispatch of the current event, set `event.handled = true`
 * either directly or via {@link EventDispatcher.dispatch}.
 */
export type EventHandler<E extends Event = Event> = (event: E) => void

/**
 * Central pub/sub for engine events.
 *
 * Two subscription modes:
 * - `on(type, handler)` — fires only for events whose `eventType` matches exactly.
 * - `onCategory(bits, handler)` — fires for any event whose `categoryFlags`
 *   overlap the given bitmask.
 *
 * Within a single `publish` call, type-subs run first, then category-subs, in
 * registration order. As soon as any handler sets `event.handled = true`,
 * dispatch stops for that event.
 */
export class EventBus {
  private readonly byType: Map<EventTypeValue, Set<EventHandler>> = new Map()
  private readonly byCategory: Set<EventHandler> = new Set()

  /**
   * Subscribe to events of a single concrete type.
   *
   * @param type     The exact {@link EventTypeValue} to match against `event.eventType`.
   * @param handler  Called once per matching event until unsubscribed.
   * @returns        A disposer function. Calling it removes this subscription
   *                 (idempotent; safe to call multiple times).
   */
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

  /**
   * Subscribe to any event whose `categoryFlags` overlap the given bitmask.
   *
   * The wrapped handler receives only events that pass the overlap test; the
   * original `handler` is invoked with the narrowed event type `E`.
   *
   * @param bits     Bitmask of {@link EventCategory} values, e.g.
   *                 `EventCategory.EventCategoryInput | EventCategory.EventCategoryMouse`.
   * @param handler  Called once per matching event until unsubscribed.
   * @returns        A disposer function. Calling it removes this subscription.
   */
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

  /**
   * Dispatch an event to all matching subscribers.
   *
   * Type-subs run first, then category-subs. Dispatch short-circuits as soon
   * as a handler sets `event.handled = true`.
   */
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

  /**
   * Remove every subscription. Useful for teardown (e.g. between test cases
   * or when tearing down a scene). Does not affect any in-flight `publish`.
   */
  public clear(): void {
    this.byType.clear()
    this.byCategory.clear()
  }
}
