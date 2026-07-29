import type { Event } from '#engine/events/event'

/**
 * Wraps a single already-constructed event and lets a handler try to process
 * it for a specific concrete type. Mirrors Hazel's
 * `template <typename T> EventDispatcher::Dispatch`.
 *
 * Typical use inside a generic event handler:
 *
 * ```ts
 * const dispatcher = new EventDispatcher(event)
 * dispatcher.dispatch(KeyPressedEvent, (e) => {
 *   // ... handle
 *   return true  // => marks event.handled
 * })
 * ```
 */
export class EventDispatcher<E extends Event> {
  constructor(private readonly event: E) {}

  /**
   * Try to handle the wrapped event as a specific concrete type.
   *
   * The handler is invoked only when the wrapped event is an `instanceof ctor`.
   * If the handler returns `true`, the underlying event is marked as handled
   * so the bus short-circuits further dispatch.
   *
   * @typeParam T  The concrete event subtype the handler expects.
   * @param ctor     The event class to match against, e.g. `KeyPressedEvent`.
   * @param handler  Invoked only when the wrapped event is an instance of `ctor`.
   * @returns        `true` if the wrapped event was an instance of `ctor`
   *                 (regardless of whether the handler marked it handled),
   *                 `false` otherwise. Lets the caller chain further type
   *                 checks without re-checking `instanceof`.
   */
  public dispatch<T extends Event>(
    ctor: new (...args: never[]) => T,
    handler: (e: T) => boolean,
  ): boolean {
    if (this.event instanceof ctor) {
      const handled = handler(this.event as unknown as T)
      if (handled) {
        this.event.handled = true
      }
      return true
    }
    return false
  }
}
