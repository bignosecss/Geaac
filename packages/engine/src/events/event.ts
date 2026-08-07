import { isInCategory, type EventCategoryValue } from '#engine/events/category'
import { eventTypeName, type EventTypeValue } from '#engine/events/event-type'

/**
 * Base class for every event the engine can dispatch. Concrete events assign
 * themselves an {@link EventTypeValue} and a bitmask of
 * {@link EventCategoryValue}s, then get routed by {@link LayerStack} and
 * pattern-matched by {@link EventDispatcher}.
 */
export abstract class Event {
  /**
   * Set by a layer (directly or via {@link EventDispatcher.dispatch}) to
   * signal the event has been consumed. The layer stack uses this to
   * short-circuit further dispatch for this event.
   */
  public handled = false

  /** Unique event-type identifier; used as the lookup key in the event registry. */
  public abstract readonly eventType: EventTypeValue

  /**
   * Bitmask of {@link EventCategoryValue}s this event belongs to. A single
   * event can be in multiple categories (e.g. `Input | Mouse | MouseButton`).
   */
  public abstract readonly categoryFlags: EventCategoryValue

  /** Human-readable representation used in logs and the debugger. */
  public abstract toString(): string

  /**
   * Convenience: `true` if any of this event's `categoryFlags` overlap the
   * given category bitmask.
   */
  public isInCategory(category: EventCategoryValue): boolean {
    return isInCategory(this.categoryFlags, category)
  }

  /**
   * Reverse lookup into the {@link EventType} registry. Returns the string
   * name (e.g. `'KeyPressed'`) for logging and debugging.
   */
  public get name(): string {
    return eventTypeName(this.eventType)
  }
}
